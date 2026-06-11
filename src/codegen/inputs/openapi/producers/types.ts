/**
 * OpenAPI producer for the TypeScript types generator.
 *
 * Walks the document's `paths`, collects operation ids per path, and
 * emits the data the generator needs to render `Paths`/`OperationIds`/
 * `ToPath`/`ToOperationIds`/`PathsMap`.
 *
 * Rendering happens in the generator (see
 * `generators/typescript/types.ts`).
 */
/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {TypesGeneratorInput} from '../../../generators/typescript/types.input';

export function produceOpenAPITypesInput(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): TypesGeneratorInput {
  const paths = openapiDocument.paths ?? {};
  const addresses: TypesGeneratorInput['addresses'] = [];
  let emitIds = false;

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    const ids: string[] = [];
    if (pathItem) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          operation &&
          typeof operation === 'object' &&
          method !== 'parameters'
        ) {
          const operationObj = operation as
            | OpenAPIV3.OperationObject
            | OpenAPIV2.OperationObject
            | OpenAPIV3_1.OperationObject;
          const operationId =
            operationObj.operationId ??
            `${method}${pathStr.replace(/[^a-zA-Z0-9]/g, '')}`;
          ids.push(operationId);
        }
      }
    }
    addresses.push({address: pathStr, ids});
    if (ids.length > 0) {
      emitIds = true;
    }
  }

  return {
    outputStyle: 'paths',
    emitIds,
    addresses
  };
}
