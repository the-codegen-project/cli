/* eslint-disable security/detect-object-injection */
import {
  ConstrainedEnumModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedUnionModel,
  TS_COMMON_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {generateAsyncAPIPayloads} from '../helpers/payloads';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {Logger} from '../../../LoggingInterface';
import {TypeScriptRenderer} from '@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer';

export const zodTypeScriptPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().optional().default('src/__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript'),
  enum: z
    .enum(['enum', 'union'])
    .optional()
    .default('enum')
    .describe(
      'By default all payloads enum types are generated as separate enum types, but in some cases a simple union type might be more prudent.'
    ),
  map: z
    .enum(['indexedObject', 'map', 'record'])
    .optional()
    .default('record')
    .describe('Which map type to use when a dictionary type is needed'),
  useForJavaScript: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models might be transpiled to JS, therefore JS restrictions will be applied by default.'
    ),
  includeValidation: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models will be used to also validate incoming data.'
    ),
  rawPropertyNames: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Use raw property names instead of constrained ones, where you most likely need to access them with obj["propertyName"] instead of obj.propertyName'
    )
});

export type TypeScriptPayloadGenerator = z.input<
  typeof zodTypeScriptPayloadGenerator
>;

export type TypeScriptPayloadGeneratorInternal = z.infer<
  typeof zodTypeScriptPayloadGenerator
>;

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGeneratorInternal =
  zodTypeScriptPayloadGenerator.parse({});

export interface TypeScriptPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptPayloadGeneratorInternal;
}

export type TypeScriptPayloadRenderType =
  PayloadRenderType<TypeScriptPayloadGeneratorInternal>;

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
function renderUnionUnmarshal(model: ConstrainedUnionModel, renderer: TypeScriptRenderer) {
  const discriminatorChecks = model.union.map((model) => {
    return findDiscriminatorChecks(model, renderer);
  });
  const hasObjValues =
    discriminatorChecks.filter((value) => value?.objCheck).length >=
    1;
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
 * Safe stringify that removes x- properties and circular references by assuming true
 */
export function safeStringify (value: any): string {
  const stack: any[] = [];
  let r = 0; 
  const replacer = (key: string, value: any) => {
    // remove extension properties
    if (key.startsWith('x-')) { return; }

    switch (typeof value) {
      case "function":
        return 'true';
      // is this a primitive value ?
      case "boolean":
      case "number":
      case "string":
        // primitives cannot have properties
        // so these are safe to parse
        return value;
      default: {
        // only null does not need to be stored
        // for all objects check recursion first
        // hopefully 255 calls are enough ...
        if (!value || 255 < ++r) {return 'true';}

        const i = stack.indexOf(value);
        // all objects not already parsed
        if (i < 0) {return stack.push(value) && value;}
        // all others are duplicated or cyclic
        // let them through
        return 'true';
      }
    }
  };

  return JSON.stringify(value, replacer);
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypescriptPayload(
  context: TypeScriptPayloadContext
): Promise<TypeScriptPayloadRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }

  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    presets: [
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      },
      {
        class: {
          additionalContent: ({content, model, renderer}) => {
            if (!generator.includeValidation) {
              return content;
            }
            renderer.dependencyManager.addTypeScriptDependency('{Ajv, Options as AjvOptions, ValidateFunction}', 'ajv');
            renderer.dependencyManager.addTypeScriptDependency('addFormats', 'ajv-formats');
            return `${content}
public theCodeGenSchema = ${safeStringify(model.originalInput)};
public validate(context : {data: any, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; validateFunction: ValidateFunction; } {
  const {ajvInstance, data} = {...context, ajvInstance: new Ajv(context.ajvOptions ?? {})};
  addFormats(ajvInstance);
  const validate = ajvInstance.compile(this.theCodeGenSchema);
  return {valid: validate(data), validateFunction: validate};
}
`;
          }
        }
      },
      {
        type: {
          self({model, content, renderer}) {
            if (model instanceof ConstrainedUnionModel) {
              return `${content}

${renderUnionUnmarshal(model, renderer)}
${renderUnionMarshal(model)}`;
            }
            return content;
          }
        }
      }
    ],
    enumType: generator.enum,
    mapType: generator.map,
    rawPropertyNames: generator.rawPropertyNames,
    useJavascriptReservedKeywords: generator.useForJavaScript
  });
  return generateAsyncAPIPayloads(
    asyncapiDocument!,
    (input) =>
      modelinaGenerator.generateToFiles(
        input,
        generator.outputPath,
        {exportType: 'named'},
        true
      ),
    generator
  );
}
