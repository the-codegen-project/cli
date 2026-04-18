import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {TypescriptTypesGeneratorInternal} from '../../../generators/typescript/types';
import {GeneratedFile} from '../../../types';

export interface TypesGeneratorResult {
  result: string;
  /** Generated files with path and content */
  files: GeneratedFile[];
}

export async function generateAsyncAPITypes(
  asyncapiDocument: AsyncAPIDocumentInterface,
  generator: TypescriptTypesGeneratorInternal
): Promise<TypesGeneratorResult> {
  const allChannels = asyncapiDocument.allChannels().all();
  const channelAddressUnion = allChannels
    .map((channel) => {
      return `'${channel.address()}'`;
    })
    .join(' | ');

  let result = `export type Topics = ${channelAddressUnion};\n`;

  // For version 3.x+ we generate additional topic ID types and helper functions
  if (!asyncapiDocument.version().startsWith('2.')) {
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
    const topicsMap = `export const TopicsMap: Record<TopicIds, Topics> = {
${allChannels
  .map((channel) => {
    return `  '${channel.id()}': '${channel.address()}'`;
  })
  .join(', \n')}
};\n`;
    result += topicIdsPart + toTopicIdsPart + toTopicsPart + topicsMap;
  }

  const filePath = `${generator.outputPath}/Types.ts`;

  return {
    result,
    files: [{path: filePath, content: result}]
  };
}
