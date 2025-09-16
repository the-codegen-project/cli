import {
  ConstrainedEnumModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedUnionModel
} from '@asyncapi/modelina';
import {TypeScriptRenderer} from '@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer';
import {Logger} from '../../../LoggingInterface';
import {
  BaseGeneratorContext,
  generateTypescriptValidationCode
} from './validation';

/**
 * Configuration options for the union preset
 */
export interface UnionPresetOptions {
  /** Whether to include validation methods in generated union types */
  includeValidation: boolean;
}

/**
 * Find the best possible discriminator value along side the properties using;
 * - Enum value
 * - Constant
 */
function findBestDiscriminatorOption(
  model: ConstrainedObjectModel,
  renderer: TypeScriptRenderer
) {
  //find first const or enum value since no explicit discriminator property found
  const firstFound = Object.values(model.properties)
    .map((property) => {
      const enumModel =
        property.property instanceof ConstrainedReferenceModel &&
        property.property.ref instanceof ConstrainedEnumModel
          ? property.property.ref
          : undefined;
      const constValue = property.property.options.const
        ? property.property.options.const.value
        : undefined;
      return {
        isEnumModel: enumModel !== undefined,
        isConst: constValue !== undefined,
        constValue,
        enumModel,
        property
      };
    })
    .filter(({isConst, isEnumModel}) => {
      return isConst || isEnumModel;
    });
  if (firstFound.length > 1) {
    const potentialProperties = firstFound
      .map(({property}) => {
        return property.propertyName;
      })
      .join(', ');
    Logger.warn(
      `More then one property could be discriminator for union model ${model.name}, found property ${potentialProperties}`
    );
  }
  if (firstFound.length >= 1) {
    const firstIsBest = firstFound[0];
    const discriminatorValue = firstIsBest.property.unconstrainedPropertyName;
    if (firstIsBest.isEnumModel) {
      const enumModel = firstIsBest.enumModel as ConstrainedEnumModel;
      renderer.dependencyManager.addTypeScriptDependency(
        `{${enumModel.type}}`,
        `./${enumModel.type}`
      );
      return {
        objCheck: `if(json.${discriminatorValue} === ${enumModel.type}.${enumModel.values[0].key}) {
  return ${model.name}.unmarshal(json);
  }`
      };
    } else if (firstIsBest.isConst) {
      return {
        objCheck: `if(json.${discriminatorValue} === ${firstIsBest.constValue}) {
  return ${model.name}.unmarshal(json);
  }`
      };
    }
    Logger.warn(
      `Could not determine discriminator for ${model.name}, as part of ${model.name}, will not be able to serialize or deserialize messages with this payload`
    );
    return {};
  }
}

function findDiscriminatorChecks(
  model: ConstrainedMetaModel,
  renderer: TypeScriptRenderer
) {
  if (
    model instanceof ConstrainedReferenceModel &&
    model.ref instanceof ConstrainedObjectModel
  ) {
    const discriminatorValue = model.options.discriminator?.type;
    if (!discriminatorValue) {
      return findBestDiscriminatorOption(model.ref, renderer);
    }

    // Use discriminatorValue to figure out if we unmarshal it
    return {
      objCheck: `if(json.${model.options.discriminator?.discriminator} === ${discriminatorValue}}) {
return ${model.type}.unmarshal(json);
}`
    };
  }
  return {};
}

function renderUnionMarshal(model: ConstrainedUnionModel) {
  const unmarshalChecks = model.union.map((unionModel) => {
    if (
      unionModel instanceof ConstrainedReferenceModel &&
      unionModel.ref instanceof ConstrainedObjectModel
    ) {
      return `if(payload instanceof ${unionModel.type}) {
return payload.marshal();
}`;
    }
  });
  return `export function marshal(payload: ${model.name}) {
  ${unmarshalChecks.join('\n')}
  return JSON.stringify(payload);
}`;
}

function renderUnionUnmarshal(
  model: ConstrainedUnionModel,
  renderer: TypeScriptRenderer
) {
  const discriminatorChecks = model.union.map((model) => {
    return findDiscriminatorChecks(model, renderer);
  });
  const hasObjValues =
    discriminatorChecks.filter((value) => value?.objCheck).length >= 1;
  return `export function unmarshal(json: any): ${model.name} {
  ${
    hasObjValues
      ? `if(typeof json === 'object') {
    ${discriminatorChecks
      .filter((value) => value?.objCheck)
      .map((value) => value?.objCheck)
      .join('\n  ')}
  }`
      : ''
  }
  return JSON.parse(json);
}`;
}

/**
 * Extract status code value from union member
 */
function extractStatusCodeValue(
  unionMember: ConstrainedMetaModel
): number | null {
  if (
    !(
      unionMember instanceof ConstrainedReferenceModel &&
      unionMember.ref instanceof ConstrainedObjectModel
    )
  ) {
    return null;
  }

  const memberOriginalInput = unionMember.ref.originalInput;
  const statusCode = memberOriginalInput?.['x-modelina-status-codes'];

  if (!statusCode) {
    return null;
  }

  if (typeof statusCode === 'object' && statusCode.code !== undefined) {
    return statusCode.code;
  }

  if (typeof statusCode === 'number') {
    return statusCode;
  }

  return null;
}

/**
 * Generate status code check string for a union member
 */
function generateStatusCodeCheck(
  unionMember: ConstrainedMetaModel,
  codeValue: number
): string {
  return `  if (statusCode === ${codeValue}) {
    return ${unionMember.type}.unmarshal(json);
  }`;
}

/**
 * Render status code based unmarshal function for union models
 */
function renderUnionUnmarshalByStatusCode(model: ConstrainedUnionModel) {
  if (!model.originalInput?.['x-modelina-has-status-codes']) {
    return '';
  }

  const statusCodeChecks = model.union
    .map((unionMember) => {
      const codeValue = extractStatusCodeValue(unionMember);
      return codeValue !== null
        ? generateStatusCodeCheck(unionMember, codeValue)
        : null;
    })
    .filter((check) => check !== null);

  if (statusCodeChecks.length === 0) {
    return '';
  }

  return `
export function unmarshalByStatusCode(json: any, statusCode: number): ${model.name} {
${statusCodeChecks.join('\n')}
  throw new Error(\`No matching type found for status code: \${statusCode}\`);
}`;
}

/**
 * Creates a union preset that adds marshalling/unmarshalling methods to union types
 *
 * @param options Configuration for union generation
 * @param context Generator context containing input type information
 * @returns Modelina preset object with union marshalling functionality
 *
 * @example
 * ```typescript
 * const preset = createUnionPreset({
 *   includeValidation: true
 * }, context);
 * ```
 */
export function createUnionPreset(
  options: UnionPresetOptions,
  context: BaseGeneratorContext
) {
  return {
    type: {
      self({
        model,
        content,
        renderer
      }: {
        model: ConstrainedMetaModel;
        content: string;
        renderer: TypeScriptRenderer;
      }) {
        if (model instanceof ConstrainedUnionModel) {
          return `${content}

${renderUnionUnmarshal(model, renderer)}
${renderUnionMarshal(model)}
${renderUnionUnmarshalByStatusCode(model)}
${options.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context: context as any}) : ''}
`;
        }
        return content;
      }
    }
  };
}
