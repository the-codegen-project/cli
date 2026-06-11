/* eslint-disable security/detect-object-injection */
/**
 * TypeScript types generator.
 *
 * Consumes `TypesGeneratorInput` (a normalized address/id list with
 * an output-style tag) and renders the matching union types and
 * helper functions. The producer extracts the data; the generator
 * owns string rendering.
 */
import {
  GenericCodegenContext,
  TypesRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {TypesGeneratorInput} from './types.input';

export {
  TypesGeneratorInput,
  TypesAddressEntry,
  TypesOutputStyle
} from './types.input';

export const zodTypescriptTypesGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('types-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  preset: z
    .literal('types')
    .default('types')
    .describe(
      'Generates simple type aliases and enum definitions derived from the input document. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__')
    .describe(
      'The directory path where the generated type definitions will be written. [Read more about the types generator here](https://the-codegen-project.org/docs/generators/types)'
    ),
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
  /** Normalized types input produced by an input-format producer. */
  input: TypesGeneratorInput;
  generator: TypescriptTypesGeneratorInternal;
}

export type TypeScriptTypesRenderType =
  TypesRenderType<TypescriptTypesGeneratorInternal>;

/**
 * Render the AsyncAPI-style output: `Topics`, optionally `TopicIds`,
 * `ToTopicIds`, `ToTopics`, `TopicsMap`. Byte-identical to the
 * pre-refactor `generateAsyncAPITypes` output.
 */
function renderTopicsStyle(input: TypesGeneratorInput): string {
  const channelAddressUnion = input.addresses
    .map((entry) => `'${entry.address}'`)
    .join(' | ');

  let result = `export type Topics = ${channelAddressUnion};\n`;

  if (input.emitIds) {
    // For AsyncAPI v3 each channel has a single id. We expand `ids[]`
    // here for forward-compat but the AsyncAPI producer always emits
    // exactly one id per address.
    const channelIdUnion = input.addresses
      .flatMap((entry) => entry.ids)
      .map((id) => `'${id}'`)
      .join(' | ');

    const channelIdSwitch = input.addresses
      .flatMap((entry) => entry.ids.map((id) => ({id, address: entry.address})))
      .map((pair) => {
        return `case '${pair.id}':
    return '${pair.address}';`;
      })
      .join('\n  ');

    const channelAddressSwitch = input.addresses
      .map((entry) => {
        const firstId = entry.ids[0];
        return `case '${entry.address}':
    return '${firstId}';`;
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
${input.addresses
  .flatMap((entry) => entry.ids.map((id) => ({id, address: entry.address})))
  .map((pair) => {
    return `  '${pair.id}': '${pair.address}'`;
  })
  .join(', \n')}
};\n`;
    result += topicIdsPart + toTopicIdsPart + toTopicsPart + topicsMap;
  }

  return result;
}

/**
 * Render the OpenAPI-style output: `Paths`, optionally `OperationIds`,
 * `ToPath`, `ToOperationIds`, `PathsMap`. Byte-identical to the
 * pre-refactor `generateOpenAPITypes` output.
 */
function renderPathsStyle(input: TypesGeneratorInput): string {
  const pathsUnion = input.addresses
    .map((entry) => `'${entry.address}'`)
    .join(' | ');

  let result = `export type Paths = ${pathsUnion};\n`;

  if (input.emitIds) {
    const allOperationIds = input.addresses.flatMap((entry) => entry.ids);
    const operationIdsUnion = allOperationIds
      .map((id) => `'${id}'`)
      .join(' | ');

    result += `export type OperationIds = ${operationIdsUnion};\n`;

    // ToPath(operationId): each operationId → its path. Iteration is
    // insertion order over (path, operationId) pairs to mirror the
    // pre-refactor `Object.entries(operationIdToPathMap)` order.
    const operationIdToPathSwitch = input.addresses
      .flatMap((entry) =>
        entry.ids.map((id) => ({operationId: id, pathStr: entry.address}))
      )
      .map((pair) => {
        return `case '${pair.operationId}':
    return '${pair.pathStr}';`;
      })
      .join('\n  ');

    const toPathPart = `export function ToPath(operationId: OperationIds): Paths {
  switch (operationId) {
    ${operationIdToPathSwitch}
    default:
      throw new Error('Unknown operation ID: ' + operationId);
  }
}\n`;

    // ToOperationIds(path): each path → list of operationIds at that path.
    // Filter to addresses that actually have operationIds — matches the
    // pre-refactor `pathOperationIds.length > 0` guard.
    const pathToOperationIdSwitch = input.addresses
      .filter((entry) => entry.ids.length > 0)
      .map((entry) => {
        const operationIdsArray = entry.ids.map((id) => `'${id}'`).join(', ');
        return `case '${entry.address}':
    return [${operationIdsArray}];`;
      })
      .join('\n  ');

    const toOperationIdsPart = `export function ToOperationIds(path: Paths): OperationIds[] {
  switch (path) {
    ${pathToOperationIdSwitch}
    default:
      throw new Error('Unknown path: ' + path);
  }
}\n`;

    const pathsMap = `export const PathsMap: Record<OperationIds, Paths> = {
${input.addresses
  .flatMap((entry) =>
    entry.ids.map((id) => ({operationId: id, pathStr: entry.address}))
  )
  .map((pair) => {
    return `  '${pair.operationId}': '${pair.pathStr}'`;
  })
  .join(',\n')}
};\n`;

    result += toPathPart + toOperationIdsPart + pathsMap;
  }

  return result;
}

export async function generateTypescriptTypes(
  context: TypescriptTypesContext
): Promise<TypeScriptTypesRenderType> {
  const {input, generator} = context;

  const result =
    input.outputStyle === 'topics'
      ? renderTopicsStyle(input)
      : renderPathsStyle(input);

  const filePath = `${generator.outputPath}/Types.ts`;
  const files: GeneratedFile[] = [{path: filePath, content: result}];

  return {
    result,
    generator,
    files
  };
}
