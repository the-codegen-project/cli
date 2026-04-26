import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {z} from 'zod';
import {GenericCodegenContext} from '../../../types';
import {zodImportExtension} from '../../../utils';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

export type SupportedProtocols = 'nats';

export const zodTypescriptClientGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('client-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the client generator here](https://the-codegen-project.org/docs/generators/client)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default(['channels-typescript'])
    .describe(
      'The list of other generator IDs that this generator depends on. The client generator depends on the channels generator by default. [Read more about the client generator here](https://the-codegen-project.org/docs/generators/client)'
    ),
  preset: z
    .literal('client')
    .default('client')
    .describe(
      'Generates a full-featured client that wraps the channel functions with built-in protocol connection handling. [Read more about the client generator here](https://the-codegen-project.org/docs/generators/client)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__/clients')
    .describe(
      'The directory path where the generated client code will be written. [Read more about the client generator here](https://the-codegen-project.org/docs/generators/client)'
    ),
  protocols: z
    .array(z.enum(['nats']))
    .default(['nats'])
    .describe(
      'The protocols to generate clients for. The client wraps the protocol channel functions and manages the underlying connection. [Read more about supported protocols here](https://the-codegen-project.org/docs/getting-started/protocols)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  channelsGeneratorId: z
    .string()
    .optional()
    .describe(
      'When multiple TypeScript channels generators are configured, specify which one this client generator should depend on. Defaults to "channels-typescript". [Read more about the client generator here](https://the-codegen-project.org/docs/generators/client)'
    )
    .default('channels-typescript'),
  importExtension: zodImportExtension.describe(
    'File extension appended to relative import paths in generated client code. Use ".ts" for moduleResolution: "node16"/"nodenext", ".js" for compiled ESM output, or "none" (default) for bundlers. Overrides the global importExtension. [Read more about import extensions here](https://the-codegen-project.org/docs/configurations)'
  )
});

export type TypeScriptClientGenerator = z.input<
  typeof zodTypescriptClientGenerator
>;
export type TypeScriptClientGeneratorInternal = z.infer<
  typeof zodTypescriptClientGenerator
>;

export const defaultTypeScriptClientGenerator: TypeScriptClientGeneratorInternal =
  zodTypescriptClientGenerator.parse({});

export interface TypeScriptClientContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypeScriptClientGeneratorInternal;
}

export interface TypeScriptClientRenderType {
  protocolResult: Record<SupportedProtocols, string>;
  /**
   * Generated files with path and content.
   */
  files: import('../../../types').GeneratedFile[];
}
