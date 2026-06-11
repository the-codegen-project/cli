/* eslint-disable security/detect-object-injection */
/**
 * TypeScript payloads generator.
 *
 * Consumes `PayloadGeneratorInput` (a normalized JSON-Schema IR produced
 * by an input-format-specific producer) and emits Modelina-generated
 * payload models. The generator never sees the source document or
 * `inputType` — input-format dispatch happens in the renderer.
 */
import {
  TypeScriptFileGenerator,
  OutputModel,
  ConstrainedObjectModel
} from '@asyncapi/modelina';
import {
  GenericCodegenContext,
  PayloadRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {TS_COMMON_PRESET, TS_DESCRIPTION_PRESET} from '@asyncapi/modelina';
import {
  createValidationPreset,
  createUnionPreset,
  createPrimitivesPreset
} from '../../modelina/presets';
import {generateModels} from '../../output';
import {PayloadGeneratorInput} from './payloads.input';

export {PayloadGeneratorInput, PayloadEntry} from './payloads.input';

export const zodTypeScriptPayloadGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('payloads-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  preset: z
    .literal('payloads')
    .default('payloads')
    .describe(
      'Generates typed payload/message models that can be serialized into the wire format used for communication. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  outputPath: z
    .string()
    .optional()
    .default('src/__gen__/payloads')
    .describe(
      'The directory path where the generated payload models will be written. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  serializationType: z
    .literal('json')
    .optional()
    .default('json')
    .describe(
      'The serialization format used by the generated payload models. Currently only "json" is supported. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  enum: z
    .enum(['enum', 'union'])
    .optional()
    .default('enum')
    .describe(
      'How payload enum types are rendered. By default ("enum") each is generated as a TypeScript enum, but "union" can be used to produce string/number union types instead. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  map: z
    .enum(['indexedObject', 'map', 'record'])
    .optional()
    .default('record')
    .describe(
      'How dictionary/map types are rendered: "record" for TypeScript Record<K, V> (default), "map" for the Map class, or "indexedObject" for index signatures. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  useForJavaScript: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'When true (default), JavaScript restrictions are applied to the generated models so they remain valid when transpiled to JavaScript (for example, avoiding reserved keywords as identifiers). [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  includeValidation: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'When true (default), the generated payload models include built-in JSON Schema validation methods so incoming data can be validated at runtime. [Read more about payload validation here](https://the-codegen-project.org/docs/generators/payloads)'
    ),
  rawPropertyNames: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'When true, properties keep their raw names from the input schema (no normalization). Consumers will typically need to access them via obj["propertyName"] instead of obj.propertyName. [Read more about the payloads generator here](https://the-codegen-project.org/docs/generators/payloads)'
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
  /** Normalized payload input produced by an input-format producer. */
  input: PayloadGeneratorInput;
  generator: TypeScriptPayloadGeneratorInternal;
  /**
   * AJV vocabularies to register before compiling validators. The
   * renderer populates this for input formats that need extra
   * vocabularies (e.g. OpenAPI → `['xml', 'example']`).
   */
  validationVocabularies?: string[];
}

export type TypeScriptPayloadRenderType =
  PayloadRenderType<TypeScriptPayloadGeneratorInternal>;

// Interface for processed payloads data (input-agnostic)
export interface ProcessedPayloadData {
  channelModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  >;
  operationModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  >;
  otherModels: Array<{messageModel: OutputModel; messageType: string}>;
}

// Core generator function that works with already-rendered processed data
export async function generateTypescriptPayloadsCore(
  processedData: ProcessedPayloadData,
  generator: TypeScriptPayloadGeneratorInternal
): Promise<TypeScriptPayloadRenderType> {
  return {
    channelModels: processedData.channelModels,
    operationModels: processedData.operationModels,
    otherModels: processedData.otherModels,
    generator,
    files: []
  };
}

// Core generator that runs Modelina against the typed PayloadGeneratorInput.
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypescriptPayloadsCoreFromSchemas({
  context,
  processedSchemaData
}: {
  processedSchemaData: PayloadGeneratorInput;
  context: TypeScriptPayloadContext;
}): Promise<TypeScriptPayloadRenderType> {
  const generator = context.generator;

  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    presets: [
      TS_DESCRIPTION_PRESET,
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      },
      createValidationPreset(
        {
          includeValidation: generator.includeValidation
        },
        context
      ),
      createUnionPreset(
        {
          includeValidation: generator.includeValidation
        },
        context
      ),
      createPrimitivesPreset(
        {
          includeValidation: generator.includeValidation
        },
        context
      )
    ],
    enumType: generator.enum,
    mapType: generator.map,
    rawPropertyNames: generator.rawPropertyNames,
    useJavascriptReservedKeywords: generator.useForJavaScript
  });

  const channelModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  > = {};
  const operationModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  > = {};
  const otherModels: Array<{messageModel: OutputModel; messageType: string}> =
    [];
  const files: GeneratedFile[] = [];

  // Generate models for channel payloads
  for (const [channelId, schemaData] of Object.entries(
    processedSchemaData.channelPayloads
  )) {
    if (schemaData) {
      const result = await generateModels({
        generator: modelinaGenerator,
        input: schemaData.schema,
        outputPath: generator.outputPath
      });
      const models = result.models;
      files.push(...result.files);

      if (models.length > 0) {
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        channelModels[channelId] = {
          messageModel: models[0],
          messageType
        };

        for (let i = 1; i < models.length; i++) {
          const additionalModel = models[i].model;
          otherModels.push({
            messageModel: models[i],
            messageType: additionalModel.type
          });
        }
      }
    }
  }

  // Generate models for operation payloads
  for (const [operationId, schemaData] of Object.entries(
    processedSchemaData.operationPayloads
  )) {
    if (schemaData) {
      const result = await generateModels({
        generator: modelinaGenerator,
        input: schemaData.schema,
        outputPath: generator.outputPath
      });
      const models = result.models;
      files.push(...result.files);

      if (models.length > 0) {
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        operationModels[operationId] = {
          messageModel: models[0],
          messageType
        };

        for (let i = 1; i < models.length; i++) {
          const additionalModel = models[i].model;
          otherModels.push({
            messageModel: models[i],
            messageType: additionalModel.type
          });
        }
      }
    }
  }

  // Generate models for other payloads
  for (const schemaData of processedSchemaData.otherPayloads) {
    const result = await generateModels({
      generator: modelinaGenerator,
      input: schemaData.schema,
      outputPath: generator.outputPath
    });
    files.push(...result.files);

    for (const model of result.models) {
      const messageModel = model.model;
      let messageType = messageModel.type;
      if (!(messageModel instanceof ConstrainedObjectModel)) {
        messageType = messageModel.name;
      }
      otherModels.push({
        messageModel: model,
        messageType
      });
    }
  }

  // Deduplicate files by path
  const uniqueFiles: GeneratedFile[] = [];
  const seenPaths = new Set<string>();
  for (const file of files) {
    if (!seenPaths.has(file.path)) {
      seenPaths.add(file.path);
      uniqueFiles.push(file);
    }
  }

  return {
    channelModels,
    operationModels,
    otherModels,
    generator,
    files: uniqueFiles
  };
}

/**
 * Run the payloads generator over a normalized `PayloadGeneratorInput`.
 * The renderer (or test code) is responsible for producing the input
 * via the appropriate input-format producer beforehand.
 */
export async function generateTypescriptPayload(
  context: TypeScriptPayloadContext
): Promise<TypeScriptPayloadRenderType> {
  return generateTypescriptPayloadsCoreFromSchemas({
    processedSchemaData: context.input,
    context
  });
}
