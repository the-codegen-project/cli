import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  GenericCodegenContext,
  TypesRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {generateAsyncAPITypes} from '../../inputs/asyncapi/generators/types';
import {generateOpenAPITypes} from '../../inputs/openapi/generators/types';
import {createMissingInputDocumentError} from '../../errors';

export const zodTypescriptTypesGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('types-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  preset: z
    .literal('types')
    .default('types')
    .describe(
      'Generates simple type aliases and enum definitions derived from the input document. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__')
    .describe(
      'The directory path where the generated type definitions will be written. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypescriptTypesGenerator = z.input<
  typeof zodTypescriptTypesGenerator
>;
export type TypescriptTypesGeneratorInternal = z.infer<
  typeof zodTypescriptTypesGenerator
>;

export const defaultTypeScriptTypesOptions: TypescriptTypesGeneratorInternal =
  zodTypescriptTypesGenerator.parse({});

export interface TypescriptTypesContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypescriptTypesGeneratorInternal;
}

export type TypeScriptTypesRenderType =
  TypesRenderType<TypescriptTypesGeneratorInternal>;

export async function generateTypescriptTypes(
  context: TypescriptTypesContext
): Promise<TypeScriptTypesRenderType> {
  const {asyncapiDocument, openapiDocument, inputType, generator} = context;

  let result: string;
  let files: GeneratedFile[] = [];

  switch (inputType) {
    case 'asyncapi':
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'types'
        });
      }
      {
        const asyncAPIResult = await generateAsyncAPITypes(
          asyncapiDocument,
          generator
        );
        result = asyncAPIResult.result;
        files = asyncAPIResult.files;
      }
      break;
    case 'openapi':
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'types'
        });
      }
      {
        const openAPIResult = await generateOpenAPITypes(
          openapiDocument,
          generator
        );
        result = openAPIResult.result;
        files = openAPIResult.files;
      }
      break;
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  return {
    result,
    generator,
    files
  };
}
