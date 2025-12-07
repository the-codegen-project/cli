/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {TypescriptTypesGeneratorInternal} from '../../../generators/typescript/types';
import path from 'path';
import {mkdir, writeFile} from 'fs/promises';

export async function generateOpenAPITypes(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document,
  generator: TypescriptTypesGeneratorInternal
): Promise<string> {
  const paths = openapiDocument.paths ?? {};
  const allPaths = Object.keys(paths);

  // Generate union type for all paths
  const pathsUnion = allPaths
    .map((pathStr) => {
      return `'${pathStr}'`;
    })
    .join(' | ');

  let result = `export type Paths = ${pathsUnion};\n`;

  // Generate operation IDs and their corresponding paths
  const operationIds: string[] = [];
  const operationIdToPathMap: Record<string, string> = {};
  const pathToOperationIdMap: Record<string, string[]> = {};

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    const pathOperationIds: string[] = [];

    for (const [method, operation] of Object.entries(pathItem)) {
      const operationObj = operation as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject;

      if (
        operationObj &&
        typeof operationObj === 'object' &&
        method !== 'parameters'
      ) {
        const operationId =
          operationObj.operationId ??
          `${method}${pathStr.replace(/[^a-zA-Z0-9]/g, '')}`;
        operationIds.push(operationId);
        operationIdToPathMap[operationId] = pathStr;
        pathOperationIds.push(operationId);
      }
    }

    if (pathOperationIds.length > 0) {
      pathToOperationIdMap[pathStr] = pathOperationIds;
    }
  }

  // Generate operation IDs union type
  if (operationIds.length > 0) {
    const operationIdsUnion = operationIds.map((id) => `'${id}'`).join(' | ');

    result += `export type OperationIds = ${operationIdsUnion};\n`;

    // Generate helper function to get path from operation ID
    const operationIdToPathSwitch = Object.entries(operationIdToPathMap)
      .map(([operationId, pathStr]) => {
        return `case '${operationId}':
    return '${pathStr}';`;
      })
      .join('\n  ');

    const toPathPart = `export function ToPath(operationId: OperationIds): Paths {
  switch (operationId) {
    ${operationIdToPathSwitch}
    default:
      throw new Error('Unknown operation ID: ' + operationId);
  }
}\n`;

    // Generate helper function to get operation IDs from path
    const pathToOperationIdSwitch = Object.entries(pathToOperationIdMap)
      .map(([pathStr, operationIds]) => {
        const operationIdsArray = operationIds
          .map((id) => `'${id}'`)
          .join(', ');
        return `case '${pathStr}':
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
${Object.entries(operationIdToPathMap).map(([operationId, pathStr]) => {
  return `  '${operationId}': '${pathStr}'`;
}).join(',\n')}
};\n`;

    result += toPathPart + toOperationIdsPart + pathsMap;
  }

  await mkdir(generator.outputPath, {recursive: true});
  await writeFile(path.resolve(generator.outputPath, 'Types.ts'), result, {});

  return result;
}
