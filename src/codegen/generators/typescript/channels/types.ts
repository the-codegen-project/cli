import {z} from 'zod';
import { GenericCodegenContext } from '../../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { TypeScriptPayloadRenderType } from '../payloads';
import { TypeScriptParameterRenderType } from '../parameters';

export const zodTypescriptChannelsGenerator = z.object({
  id: z.string().optional().default('channels-typescript'),
  dependencies: z
    .array(z.string())
    .optional()
    .default(['parameters-typescript', 'payloads-typescript']),
  preset: z.literal('channels').default('channels'),
  outputPath: z.string().default('src/__gen__/channels'),
  protocols: z.array(z.enum(['nats'])).default(['nats']),
  parameterGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript parameter generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('parameters-typescript'),
  payloadGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript payload generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('payloads-typescript'),
  asyncapiReverseOperations: z.boolean().optional().default(false).describe('Setting this to true generate channels and client operations with reversed meaning. So for AsyncAPI this means if an operation is defined as action: "send", it gets the opposite view of "receive".'),
  asyncapiGenerateForOperations: z.boolean().optional().default(true).describe('Setting this to false means we dont enforce the operations defined in the AsyncAPI document and generate more generic channels.'),
  functionTypeMapping: z.record(z.array(z.string()).optional()).optional().default({}),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypeScriptChannelsGenerator = z.input<
  typeof zodTypescriptChannelsGenerator
>;
export type TypeScriptChannelsGeneratorInternal = z.infer<
  typeof zodTypescriptChannelsGenerator
>;

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGeneratorInternal =
  zodTypescriptChannelsGenerator.parse({});

export interface TypeScriptChannelsContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptChannelsGeneratorInternal;
}
export type renderedFunctionType = {
  functionType: ChannelFunctionTypes;
  functionName: string;
  messageType: string;
  parameterType?: string;
};
export interface TypeScriptChannelRenderType {
  payloadRender: TypeScriptPayloadRenderType;
  parameterRender: TypeScriptParameterRenderType;
  generator: TypeScriptChannelsGeneratorInternal;
  /**
   * All the rendered functions based on type.
   */
  renderedFunctions: Record<string, renderedFunctionType[]>;
  result: string
}

export enum ChannelFunctionTypes {
  NATS_JETSTREAM_PUBLISH = 'nats_jetstream_publish',
  NATS_JETSTREAM_PULL_SUBSCRIBE = 'nats_jetstream_pull_subscribe',
  NATS_JETSTREAM_PUSH_SUBSCRIBE = 'nats_jetstream_push_subscribe',
  NATS_SUBSCRIBE = 'nats_subscribe',
  NATS_PUBLISH = 'nats_publish',
  NATS_REQUEST = 'nats_request',
  NATS_REPLY = 'nats_reply'
}

export type SupportedProtocols = 'nats';