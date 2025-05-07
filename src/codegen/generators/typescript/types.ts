import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, TypesRenderType} from '../../types';
import {z} from 'zod';
import path from 'path';
import {mkdir, writeFile} from 'fs/promises';

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
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypescriptTypesGeneratorInternal;
}

export type TypeScriptTypesRenderType =
  TypesRenderType<TypescriptTypesGeneratorInternal>;

export async function generateTypescriptTypes(
  context: TypescriptTypesContext
): Promise<TypeScriptTypesRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  const allChannels = asyncapiDocument!.allChannels().all();
  const channelAddressUnion = allChannels
    .map((channel) => {
      return `'${channel.address()}'`;
    })
    .join(' | ');
  const channelIdUnion = allChannels
    .map((channel) => {
      return `'${channel.id()}'`;
    })
    .join(' | ');
  const channelIdSwitch = allChannels
    .map((channel) => {
      return `case '${channel.id()}':
    return '${channel.address()}';`;
    })
    .join('\n  ');
  const channelAddressSwitch = allChannels
    .map((channel) => {
      return `case '${channel.address()}':
    return '${channel.id()}';`;
    })
    .join('\n  ');

  await mkdir(context.generator.outputPath, {recursive: true});
  let result = `export type Topics = ${channelAddressUnion};\n`;
  // For version 2.x we only need to generate topics
  if (!asyncapiDocument!.version().startsWith('2.')) {
    const topicIdsPart = `export type TopicIds = ${channelIdUnion};\n`;
    const toTopicIdsPart = `export function ToTopicIds(topic: Topics): TopicIds {
  switch (topic) {
    ${channelAddressSwitch}
    default:
      throw new Error('Unknown topic: ' + topic);
  }
}\n`;
    const toTopicsPart = `export function ToTopics(topicId: TopicIds): Topics {
  switch (topicId) {
    ${channelIdSwitch}
    default:
      throw new Error('Unknown topic ID: ' + topicId);
  }
}\n`;

    result += topicIdsPart + toTopicIdsPart + toTopicsPart;
  }
  await writeFile(
    path.resolve(context.generator.outputPath, 'Types.ts'),
    result,
    {}
  );
  return {
    result,
    generator
  };
}
