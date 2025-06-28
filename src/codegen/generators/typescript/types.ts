import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, TypesRenderType} from '../../types';
import {z} from 'zod';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {generateAsyncAPITypes} from '../../inputs/asyncapi/generators/types';
import {generateOpenAPITypes} from '../../inputs/openapi/generators/types';

export const zodTypescriptTypesGenerator = z.object({
  id: z.string().optional().default('types-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('types').default('types'),
  outputPath: z.string().default('src/__gen__'),
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

  switch (inputType) {
    case 'asyncapi':
      if (!asyncapiDocument) {
        throw new Error('Expected AsyncAPI input, was not given');
      }
      result = await generateAsyncAPITypes(asyncapiDocument, generator);
      break;
    case 'openapi':
      if (!openapiDocument) {
        throw new Error('Expected OpenAPI input, was not given');
      }
      result = await generateOpenAPITypes(openapiDocument, generator);
      break;
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  return {
    result,
    generator
  };
}
