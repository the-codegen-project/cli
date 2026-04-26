import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext} from '../../types';
import {z} from 'zod';
import {OpenAPIV3, OpenAPIV2, OpenAPIV3_1} from 'openapi-types';
import {JsonSchemaDocument} from '../../inputs/jsonschema';

export interface CustomContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi' | 'jsonschema';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  jsonSchemaDocument?: JsonSchemaDocument;
  generator: CustomGenerator;
}

export const zodCustomGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('custom')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. Outputs from these generators are passed to renderFunction via dependencyOutputs. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  preset: z
    .literal('custom')
    .default('custom')
    .describe(
      'Lets you write a custom render function that produces arbitrary code from the parsed input document and the outputs of other generators. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  options: z
    .any()
    .optional()
    .default({})
    .describe(
      'Arbitrary user-defined options that are forwarded to the renderFunction as its second argument. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  outputPath: z
    .string()
    .optional()
    .default('custom')
    .describe(
      'The directory path where files written by the custom generator will be placed. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  renderFunction: z
    .function()
    .args(
      z
        .object({
          inputType: z
            .enum(['asyncapi', 'openapi', 'jsonschema'])
            .default('asyncapi')
            .describe(
              'The type of input document being processed. [Read more about supported inputs here](https://the-codegen-project.org/docs/configurations)'
            ),
          asyncapiDocument: z
            .any()
            .describe(
              'The parsed AsyncAPI document (AsyncAPIDocumentInterface from @asyncapi/parser) when inputType is "asyncapi". [Read more about AsyncAPI input here](https://the-codegen-project.org/docs/inputs/asyncapi)'
            ),
          openapiDocument: z
            .any()
            .describe(
              'The parsed OpenAPI document (one of OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document from openapi-types) when inputType is "openapi". [Read more about OpenAPI input here](https://the-codegen-project.org/docs/inputs/openapi)'
            ),
          jsonSchemaDocument: z
            .any()
            .describe(
              'The parsed JSON Schema document when inputType is "jsonschema". [Read more about JSON Schema input here](https://the-codegen-project.org/docs/inputs/jsonschema)'
            ),
          generator: z
            .any()
            .describe(
              'The fully resolved configuration object for this custom generator instance. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
            ),
          dependencyOutputs: z
            .record(z.any())
            .default({})
            .describe(
              'A map of generator ID to render result for each generator listed in dependencies. Use this to access models, channels, etc. produced by other generators. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
            )
        })
        .default({}),
      z
        .any()
        .optional()
        .describe(
          'The user-defined options passed in via the "options" field of this generator configuration. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
        )
        .default({})
    )
    .returns(z.any())
    .optional()
    .default(() => {})
    .describe(
      'The render function executed by the custom generator. Receives the parsed input document and the outputs of dependency generators, and is responsible for producing custom code. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    )
});

export type CustomGenerator = z.input<typeof zodCustomGenerator>;

export type CustomGeneratorInternal = z.infer<typeof zodCustomGenerator>;

export const defaultCustomGenerator: CustomGeneratorInternal =
  zodCustomGenerator.parse({});
