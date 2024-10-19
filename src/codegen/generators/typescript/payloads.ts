/* eslint-disable security/detect-object-injection */
import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedStringModel,
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

export const zodTypeScriptPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().optional().default('src/__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript'),
  model: z
    .enum(['class', 'interface'])
    .optional()
    .default('class')
    .describe(
      'By default all payloads are generated as class types, but in some cases interfaces might be more prudent.'
    ),
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
  moduleSystem: z.enum(['esm', 'cjs']).optional().default('esm').describe(''),
  useForJavaScript: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models might be transpiled to JS, therefore JS restrictions will be applied by default.'
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

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGenerator =
  zodTypeScriptPayloadGenerator.parse({});

export interface TypeScriptPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptPayloadGeneratorInternal;
}

export type TypeScriptPayloadRenderType =
  PayloadRenderType<TypeScriptPayloadGenerator>;

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypescriptPayload(
  context: TypeScriptPayloadContext
): Promise<TypeScriptPayloadRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    return Promise.reject('Expected AsyncAPI input, was not given');
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
        type: {
          self({model, content, renderer}) {
            if (model instanceof ConstrainedUnionModel) {
              const discriminatorChecks = model.union.map((unionModel) => {
                if (
                  unionModel instanceof ConstrainedReferenceModel &&
                  unionModel.ref instanceof ConstrainedObjectModel
                ) {
                  let discriminatorValue =
                    unionModel.options.discriminator?.type;
                  //find first const or enum value
                  if (!discriminatorValue) {
                    const firstFOund = Object.values(unionModel.ref.properties)
                      .map((property) => {
                        const enumModel =
                          property.property instanceof
                            ConstrainedReferenceModel &&
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
                    if (firstFOund.length > 1) {
                      const potentialProperties = firstFOund
                        .map(({property}) => {
                          return property.propertyName;
                        })
                        .join(', ');
                      Logger.warn(
                        `More then one property could be discriminator for union model ${unionModel.name}, found property ${potentialProperties}`
                      );
                    }
                    if (firstFOund.length >= 1) {
                      const firstIsBest = firstFOund[0];
                      discriminatorValue =
                        firstIsBest.property.unconstrainedPropertyName;
                      if (firstIsBest.isEnumModel) {
                        const enumModel =
                          firstIsBest.enumModel as ConstrainedEnumModel;
                        renderer.dependencyManager.addTypeScriptDependency(
                          `{${enumModel.type}}`,
                          `./${enumModel.type}`
                        );
                        return {
                          objCheck: `if(json.${discriminatorValue} === ${enumModel.type}.${enumModel.values[0].key}) {
  return ${unionModel.name}.unmarshal(json)
}`
                        };
                      } else if (firstIsBest.isConst) {
                        return {
                          objCheck: `if(json.${discriminatorValue} === ${firstIsBest.constValue}) {
  return ${unionModel.name}.unmarshal(json)
}`
                        };
                      }
                      Logger.warn(
                        `Could not determine discriminator for ${unionModel.name}, as part of ${model.name}, will not be able to serialize or deserialize messages with this payload`
                      );
                      return {};
                    }
                  } else {
                    // Use discriminatorValue to figure out if we unmarshal it
                    return {
                      objCheck: `if(json.${unionModel.options.discriminator?.discriminator} === ${discriminatorValue}}) {
return ${unionModel.type}.unmarshal(json)
}`
                    };
                  }
                } else if (unionModel instanceof ConstrainedStringModel) {
                  return {strCheck: 'return json'};
                }
                return {};
              });
              const unmarshalChecks = model.union.map((unionModel) => {
                if (
                  unionModel instanceof ConstrainedReferenceModel &&
                  unionModel.ref instanceof ConstrainedObjectModel
                ) {
                  return `if(payload instanceof ${unionModel.type}) {
  return payload.marshal();
}`;
                }
                if (unionModel instanceof ConstrainedStringModel) {
                  return `if(typeof payload === 'string') {
  return payload;
}`;
                }
                return '';
              });
              const hasObjValues =
                discriminatorChecks.filter((value) => value.objCheck).length >
                1;
              const hasStrValues =
                discriminatorChecks.filter((value) => value.strCheck).length >
                1;
              return `${content}\n

export function unmarshal(json: any): ${model.name} {
  ${
    hasObjValues &&
    `if(typeof json === 'object') {
    ${discriminatorChecks
      .filter((value) => value.objCheck)
      .map((value) => value.objCheck)
      .join('\n  ')}
  }`
  }
  
  ${
    hasStrValues &&
    `if(typeof json === 'string') {
    return json;
  }`
  }
  throw new Error('Could not determine json input')
}
export function marshal(payload: ${model.name}) {
  ${unmarshalChecks.join('\n')}
}`;
            }
            return content;
          }
        }
      }
    ],
    enumType: generator.enum,
    mapType: generator.map,
    modelType: generator.model,
    moduleSystem: generator.moduleSystem.toUpperCase() as any,
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
