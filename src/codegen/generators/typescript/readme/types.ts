import {z} from 'zod';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {GenericCodegenContext} from '../../../types';

export const zodTypescriptReadmeGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('readme')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. List every generator referenced through the generator ID options (channelsGeneratorId, payloadsGeneratorId, typesGeneratorId, clientGeneratorId) here to guarantee their output is rendered before the README. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  preset: z
    .literal('readme')
    .default('readme')
    .describe(
      'Generates a README.md that documents how to install and use the generated code, with usage sections derived from the other configured generators. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  outputPath: z
    .string()
    .optional()
    .default('.')
    .describe(
      'The directory path where README.md will be written, relative to the configuration file. Defaults to the project root. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  packageName: z
    .string()
    .optional()
    .describe(
      'The npm package name the generated code is published as. When set, the README includes an installation section and usage examples import from this package. When omitted, the installation section is skipped and imports use paths relative to the generator output directories. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  packageVersion: z
    .string()
    .optional()
    .describe(
      'The version of the generated package, shown below the README title. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  introduction: z
    .string()
    .optional()
    .describe(
      'Custom Markdown content placed at the very top of the README, above the generated content, separated by a horizontal rule. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  suffix: z
    .string()
    .optional()
    .describe(
      'Custom Markdown content appended as the final section of the README. When omitted, an attribution line naming The Codegen Project CLI and its version is rendered instead. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  channelsGeneratorId: z
    .string()
    .optional()
    .default('channels-typescript')
    .describe(
      'The ID of the channels generator to document. When its output is available, the README includes usage sections for the generated channel functions (including HTTP client operations). Remember to also list the ID in dependencies. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  payloadsGeneratorId: z
    .string()
    .optional()
    .default('payloads-typescript')
    .describe(
      'The ID of the payloads generator to document. When its output is available, the README includes a usage section for the generated payload models. Remember to also list the ID in dependencies. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  typesGeneratorId: z
    .string()
    .optional()
    .default('types-typescript')
    .describe(
      'The ID of the types generator to document. When its output is available, the README includes a usage section for the generated types. Remember to also list the ID in dependencies. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    ),
  clientGeneratorId: z
    .string()
    .optional()
    .default('client-typescript')
    .describe(
      'The ID of the client generator to document. When its output is available, the README includes a usage section for the generated client. Remember to also list the ID in dependencies. [Read more about the readme generator here](https://the-codegen-project.org/docs/generators/readme)'
    )
});

export type TypeScriptReadmeGenerator = z.input<
  typeof zodTypescriptReadmeGenerator
>;
export type TypeScriptReadmeGeneratorInternal = z.infer<
  typeof zodTypescriptReadmeGenerator
>;

export const defaultTypeScriptReadmeGenerator: TypeScriptReadmeGeneratorInternal =
  zodTypescriptReadmeGenerator.parse({});

export interface TypeScriptReadmeContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypeScriptReadmeGeneratorInternal;
}

export interface TypeScriptReadmeRenderType {
  /**
   * The full rendered README.md content.
   */
  content: string;
  generator: TypeScriptReadmeGeneratorInternal;
  /**
   * Generated files with path and content.
   */
  files: import('../../../types').GeneratedFile[];
}
