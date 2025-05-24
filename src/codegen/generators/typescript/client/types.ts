import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {z} from 'zod';
import {GenericCodegenContext} from '../../../types';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type SupportedProtocols = 'nats';

export const zodTypescriptClientGenerator = z.object({
  id: z.string().optional().default('client-typescript'),
  dependencies: z.array(z.string()).optional().default(['channels-typescript']),
  preset: z.literal('client').default('client'),
  outputPath: z.string().default('src/__gen__/clients'),
  protocols: z.array(z.enum(['nats'])).default(['nats']),
  language: z.literal('typescript').optional().default('typescript'),
  channelsGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript channels generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('channels-typescript')
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
  openapiDocument?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
  generator: TypeScriptClientGeneratorInternal;
}

export interface TypeScriptClientRenderType {
  protocolResult: Record<SupportedProtocols, string>;
}
