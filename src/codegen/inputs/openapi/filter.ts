/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {
  InputFilter,
  matchesFilter,
  normalizeFilter,
  collectExtensionValues
} from '../../filter';
import {chooseComponentModelNames, deriveOperationId} from './utils';
import {Logger} from '../../../LoggingInterface';

type OpenAPIDocument =
  | OpenAPIV3.Document
  | OpenAPIV2.Document
  | OpenAPIV3_1.Document;

const MODELINA_INFERRED_NAME = 'x-modelgen-inferred-name';

/**
 * HTTP methods treated as operations on a path item. Explicit whitelist so
 * non-method keys (`parameters`, `servers`, `summary`, `description`) are never
 * mistaken for operations. `trace` is included for v3 tolerance; deleting a
 * method key that is not present is a no-op.
 */
const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace'
];

/**
 * Locate the component-schema map for the document version: `components.schemas`
 * for OpenAPI 3.x, `definitions` for Swagger/OpenAPI 2.0.
 */
function getSchemaMap(
  document: OpenAPIDocument
): Record<string, any> | undefined {
  if (
    'components' in document &&
    document.components &&
    document.components.schemas
  ) {
    return document.components.schemas as Record<string, any>;
  }
  if ('definitions' in document && document.definitions) {
    return document.definitions as Record<string, any>;
  }
  return undefined;
}

/**
 * Delete component schemas/definitions no longer reachable from the retained
 * paths. Reachability is keyed on `x-modelgen-inferred-name`, which
 * dereferencing stamps on each component schema and its inlined usages. Mutates
 * the document in place. Only ever called when a filter is active, so the
 * no-filter path never prunes.
 */
function pruneOrphanSchemas(document: OpenAPIDocument): void {
  const schemas = getSchemaMap(document);
  if (!schemas) {
    return;
  }
  const reachable = new Set<string>();
  collectExtensionValues({
    node: document.paths,
    key: MODELINA_INFERRED_NAME,
    accumulator: reachable
  });
  const chosenNames = chooseComponentModelNames(Object.keys(schemas));
  const pruned: string[] = [];
  for (const componentName of Object.keys(schemas)) {
    const modelName = chosenNames.get(componentName) ?? componentName;
    if (!reachable.has(modelName)) {
      delete schemas[componentName];
      pruned.push(componentName);
    }
  }
  if (pruned.length > 0) {
    Logger.debug(
      `Filter pruned orphaned OpenAPI component schemas: ${pruned.join(', ')}`
    );
  }
}

/**
 * Filter one path item's methods in place, deleting operations that do not
 * match. Returns whether the path should be retained (it matched directly or
 * kept at least one method).
 */
function retainPathItem({
  pathKey,
  pathItem,
  filter
}: {
  pathKey: string;
  pathItem: Record<string, any>;
  filter: InputFilter;
}): boolean {
  const {include, exclude} = filter;
  const keepPathDirect = matchesFilter({
    candidates: [pathKey],
    include,
    exclude
  });
  let keepAnyMethod = false;
  for (const method of HTTP_METHODS) {
    const operation = pathItem[method];
    if (!operation) {
      continue;
    }
    const operationId = deriveOperationId({
      operationId: operation.operationId,
      method,
      path: pathKey
    });
    const keepMethod = matchesFilter({
      candidates: [pathKey, operationId],
      include,
      exclude
    });
    if (keepMethod) {
      keepAnyMethod = true;
    } else {
      delete pathItem[method];
    }
  }
  return keepPathDirect || keepAnyMethod;
}

/**
 * Filter a dereferenced OpenAPI document down to the paths/operations selected
 * by `filter`, mutating it in place. Matching candidates:
 * - path: the path template
 * - operation: the path template + its (derived) operationId
 *
 * A path is retained when it matches directly or has ≥1 retained method. Methods
 * that do not match are deleted; non-method path-item keys are preserved. Any
 * component schema left orphaned by the removals is pruned.
 */
export function filterOpenapiDocument({
  document,
  filter
}: {
  document: OpenAPIDocument;
  filter: InputFilter;
}): void {
  const normalizedFilter = normalizeFilter(filter);
  // No-op on the no-filter path — never mutate, never prune.
  if (
    normalizedFilter.include.length === 0 &&
    normalizedFilter.exclude.length === 0
  ) {
    return;
  }

  const paths = (document.paths ?? {}) as Record<string, any>;
  for (const pathKey of Object.keys(paths)) {
    const pathItem = paths[pathKey];
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    if (!retainPathItem({pathKey, pathItem, filter: normalizedFilter})) {
      delete paths[pathKey];
    }
  }

  pruneOrphanSchemas(document);
}
