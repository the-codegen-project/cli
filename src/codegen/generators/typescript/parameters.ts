/* eslint-disable security/detect-object-injection, sonarjs/cognitive-complexity */
import {OutputModel, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  GenericCodegenContext,
  ParameterRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {
  createAsyncAPIGenerator,
  processAsyncAPIParameters,
  ProcessedParameterSchemaData
} from '../../inputs/asyncapi/generators/parameters';
import {
  createOpenAPIGenerator,
  createOpenAPIInterfaceParameterGenerator,
  generateOpenAPIParameterFunctions,
  processOpenAPIParameters
} from '../../inputs/openapi/generators/parameters';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {createMissingInputDocumentError} from '../../errors';
import {generateModels} from '../../output';

export const zodTypescriptParametersGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('parameters-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  preset: z
    .literal('parameters')
    .default('parameters')
    .describe(
      'Generates typed channel/operation parameter models used to interpolate values into subjects, topics, and URL paths. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__/parameters')
    .describe(
      'The directory path where the generated parameter models will be written. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  serializationType: z
    .literal('json')
    .optional()
    .default('json')
    .describe(
      'The serialization format used by the generated parameter models. Currently only "json" is supported. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  modelType: z
    .enum(['class', 'interface'])
    .optional()
    .default('class')
    .describe(
      'How parameter models are rendered. "class" (default) emits a class with serialization methods (the AsyncAPI/broker shape). "interface" emits a plain interface plus standalone serializer functions (serialize<Name>QueryParameters / serialize<Name>Url) — the idiomatic shape for OpenAPI REST consumers, used by the OpenAPI interface/client profiles. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    )
});

export type TypescriptParametersGenerator = z.input<
  typeof zodTypescriptParametersGenerator
>;
export type TypescriptParametersGeneratorInternal = z.infer<
  typeof zodTypescriptParametersGenerator
>;

export const defaultTypeScriptParametersOptions: TypescriptParametersGeneratorInternal =
  zodTypescriptParametersGenerator.parse({});

export interface TypescriptParametersContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypescriptParametersGeneratorInternal;
}

export type TypeScriptParameterRenderType =
  ParameterRenderType<TypescriptParametersGeneratorInternal>;

/**
 * Rewrite a generated parameter model's trailing `export { <Name> };` to also
 * export the companion `<Name>Interface` emitted by the class preset. Modelina
 * appends the export outside the preset chain from the single class model, so
 * the interface (raw text injected by the `self` hook) would otherwise not be
 * exported. Only rewrites when the companion interface is actually present, so
 * models without the interface treatment are left untouched.
 */
function withParameterInterfaceExport(model: OutputModel): OutputModel {
  const interfaceName = `${model.modelName}Interface`;
  const originalExport = `export { ${model.modelName} };`;
  if (
    !model.result.includes(`interface ${interfaceName}`) ||
    !model.result.includes(originalExport)
  ) {
    return model;
  }
  const rewritten = model.result.replace(
    originalExport,
    `export { ${model.modelName}, ${interfaceName} };`
  );
  return OutputModel.toOutputModel({
    result: rewritten,
    model: model.model,
    modelName: model.modelName,
    inputModel: model.inputModel,
    dependencies: model.dependencies
  });
}

// Main generator function that orchestrates input processing and generation
export async function generateTypescriptParameters(
  context: TypescriptParametersContext
): Promise<TypeScriptParameterRenderType> {
  const {asyncapiDocument, openapiDocument, inputType, generator} = context;

  const channelModels: Record<string, OutputModel | undefined> = {};
  const files: GeneratedFile[] = [];
  const parameterFunctions: Record<string, string[]> = {};
  let processedSchemaData: ProcessedParameterSchemaData;
  let parameterGenerator: TypeScriptFileGenerator;

  // Interface mode (OpenAPI REST consumers) emits a plain interface plus
  // standalone serializer functions; class mode keeps the AsyncAPI/broker
  // shape. Interface mode is only meaningful for OpenAPI input.
  const isInterface =
    generator.modelType === 'interface' && inputType === 'openapi';

  // Process input based on type
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'parameters'
        });
      }

      processedSchemaData = await processAsyncAPIParameters(asyncapiDocument);
      parameterGenerator = createAsyncAPIGenerator();
      break;
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'parameters'
        });
      }

      processedSchemaData = processOpenAPIParameters(openapiDocument);
      parameterGenerator = isInterface
        ? createOpenAPIInterfaceParameterGenerator()
        : createOpenAPIGenerator();
      break;
    }
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  // Generate models for channel parameters
  for (const [channelId, schemaData] of Object.entries(
    processedSchemaData.channelParameters
  )) {
    if (!schemaData) {
      channelModels[channelId] = undefined;
      continue;
    }
    const result = await generateModels({
      generator: parameterGenerator,
      input: schemaData.schema,
      outputPath: generator.outputPath
    });
    if (isInterface) {
      appendInterfaceParameterFunctions(result, files, parameterFunctions);
      channelModels[channelId] =
        result.models.length > 0 ? result.models[0] : undefined;
      continue;
    }
    const mainModel =
      result.models.length > 0
        ? withParameterInterfaceExport(result.models[0])
        : undefined;
    channelModels[channelId] = mainModel;
    for (const file of result.files) {
      if (mainModel && file.path.endsWith(`/${mainModel.modelName}.ts`)) {
        // The parameter model's own file carries the companion interface,
        // so re-export both symbols from its (rewritten) content.
        files.push({path: file.path, content: mainModel.result});
      } else {
        files.push(file);
      }
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
    generator,
    files: uniqueFiles,
    parameterFunctions
  };
}

/**
 * Append the standalone serializer functions to each interface-mode parameter
 * model's own file and record the exported function names keyed by model name
 * (consumed by the channels/HTTP-client generators, mirroring header
 * functions). Only object models carry parameters worth serializing.
 */
function appendInterfaceParameterFunctions(
  result: {models: OutputModel[]; files: GeneratedFile[]},
  files: GeneratedFile[],
  parameterFunctions: Record<string, string[]>
): void {
  for (const file of result.files) {
    const model = result.models.find((candidate) =>
      file.path.endsWith(`/${candidate.modelName}.ts`)
    );
    if (!model || !(model.model instanceof ConstrainedObjectModel)) {
      files.push(file);
      continue;
    }
    const {functions, functionNames} = generateOpenAPIParameterFunctions(
      model.model
    );
    files.push({path: file.path, content: `${file.content}\n\n${functions}`});
    parameterFunctions[model.modelName] = functionNames;
  }
}
