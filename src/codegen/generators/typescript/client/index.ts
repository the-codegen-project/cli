/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {GenericCodegenContext, TheCodegenConfiguration} from '../../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {defaultTypeScriptChannelsGenerator, TypeScriptChannelsGenerator} from '../channels';
import {generateNatsClient} from './protocols/nats';
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

export const defaultTypeScriptClientGenerator: TypeScriptClientGenerator =
  zodTypescriptClientGenerator.parse({});

export interface TypeScriptClientContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptClientGeneratorInternal;
}

export async function generateTypeScriptClient(
  context: TypeScriptClientContext
) {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }

  await mkdir(context.generator.outputPath, {recursive: true});

  for (const protocol of generator.protocols) {
    switch (protocol) {
      case 'nats':
        await writeFile(
          path.resolve(context.generator.outputPath, 'NatsClient.ts'),
          await generateNatsClient(context)
        );
        break;

      default:
        break;
    }
  }
}

/**
 * Make sure we include all dependencies, if not added manually, is added to the generators.
 */
export function includeTypeScriptClientDependencies(
  config: TheCodegenConfiguration,
  generator: TypeScriptClientGenerator
) {
  const newGenerators: any[] = [];
  const channelsGeneratorId = generator.channelsGeneratorId;
  const hasChannelsGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === channelsGeneratorId
    ) !== undefined;
  if (!hasChannelsGenerator) {
    const defaultClientPayloadGenerator: TypeScriptChannelsGenerator = {
      ...defaultTypeScriptChannelsGenerator, 
      outputPath: path.resolve(generator.outputPath ?? '', './channels') 
    };
    newGenerators.push(defaultClientPayloadGenerator);
  }
  return newGenerators;
}
