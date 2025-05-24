import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext} from '../../types';
import {z} from 'zod';
import { OpenAPIV3, OpenAPIV2, OpenAPIV3_1 } from 'openapi-types';

export interface CustomContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
  generator: CustomGenerator;
}

export const zodCustomGenerator = z.object({
  id: z.string().optional().default('custom'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('custom').default('custom'),
  options: z.any().optional().default({}),
  outputPath: z.string().optional().default('custom'),
  language: z.literal('typescript').optional().default('typescript'),
  renderFunction: z
    .function()
    .args(
      z
        .object({
          inputType: z.enum(['asyncapi', 'openapi']).default('asyncapi'),
          asyncapiDocument: z
            .any()
            .describe(
              `Type is AsyncAPIDocumentInterface from @asyncapi/parser`
            ),
          openapiDocument: z
            .any()
            .describe(
              `Type is { OpenAPIV3, OpenAPIV2, OpenAPIV3_1 } from 'openapi-types`
            ),
          generator: z.any(),
          dependencyOutputs: z.record(z.any()).default({})
        })
        .default({}),
      z
        .any()
        .optional()
        .describe('The provided options by the user')
        .default({})
    )
    .returns(z.any())
    .optional()
    .default(() => {})
});

export type CustomGenerator = z.input<typeof zodCustomGenerator>;

export type CustomGeneratorInternal = z.infer<typeof zodCustomGenerator>;

export const defaultCustomGenerator: CustomGeneratorInternal =
  zodCustomGenerator.parse({});
