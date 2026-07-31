/**
 * Shared helpers for deriving stable identifiers from OpenAPI operations.
 */
import {FormatHelpers} from '@asyncapi/modelina';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

/**
 * Modelina's name-hint extension. It has the lowest naming precedence
 * (`title || $id || x-modelgen-inferred-name`), so it never overrides names
 * the spec author already provided, and unlike `$id` it carries no base-URI
 * semantics that could confuse downstream JSON Schema tooling.
 */
const MODELINA_INFERRED_NAME = 'x-modelgen-inferred-name';

/**
 * Tag every component/definition schema with its component name so the name
 * survives dereferencing.
 *
 * Dereferencing inlines `$ref` targets by object reference, which means the
 * component names are otherwise lost and Modelina falls back to naming nested
 * models after the property path (e.g. every `items` array item becomes
 * `ItemsItem`). Different components then collide on the same model name and
 * silently overwrite each other's generated files. Because the inlined
 * occurrences share object identity with the component entry, tagging the
 * component here propagates the name to every usage site.
 *
 * Must be called on the *dereferenced* document.
 */
export function reflectComponentSchemaNames(
  document: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document
): void {
  const schemaMaps: Record<string, unknown>[] = [];
  if ('components' in document && document.components?.schemas) {
    schemaMaps.push(document.components.schemas);
  }
  if ('definitions' in document && document.definitions) {
    schemaMaps.push(document.definitions);
  }

  for (const schemas of schemaMaps) {
    const chosenNames = chooseComponentModelNames(Object.keys(schemas));
    for (const [componentName, schema] of Object.entries(schemas)) {
      if (
        schema &&
        typeof schema === 'object' &&
        !(MODELINA_INFERRED_NAME in schema)
      ) {
        // eslint-disable-next-line security/detect-object-injection
        (schema as Record<string, unknown>)[MODELINA_INFERRED_NAME] =
          chosenNames.get(componentName);
      }
    }
  }
}

/**
 * Pick a model name per component: the last dot-segment when it is
 * unambiguous across all components (`GetTransactions.Model.TransactionModel`
 * -> `TransactionModel`), otherwise the full component name. Namespaced
 * component names are common in generated specs (NSwag, Swashbuckle) and the
 * full name makes for unwieldy class names.
 */
export function chooseComponentModelNames(
  componentNames: string[]
): Map<string, string> {
  const fullNames = new Set(componentNames);
  const shortNameCounts = new Map<string, number>();
  const shortNameOf = (name: string): string => {
    const segments = name.split('.').filter((segment) => segment.length > 0);
    return segments.at(-1) ?? name;
  };

  for (const name of componentNames) {
    const short = shortNameOf(name);
    shortNameCounts.set(short, (shortNameCounts.get(short) ?? 0) + 1);
  }

  const chosen = new Map<string, string>();
  for (const name of componentNames) {
    const short = shortNameOf(name);
    const isUnambiguous =
      short === name ||
      (shortNameCounts.get(short) === 1 && !fullNames.has(short));
    chosen.set(name, isUnambiguous ? short : name);
  }
  return chosen;
}

/**
 * HTTP methods treated as operations on a path item. Explicit whitelist so
 * non-method keys (`parameters`, `servers`, `summary`, `description`, `$ref`)
 * are never mistaken for operations. `trace` is included for v3 tolerance.
 */
export const HTTP_METHODS = [
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
 * Whether a path item key names an operation rather than path-item metadata.
 */
export function isHttpMethod(key: string): boolean {
  return HTTP_METHODS.includes(key.toLowerCase());
}

/**
 * Merge a path item's shared `parameters` with an operation's own, as required
 * by the OpenAPI specification: parameters declared on the path item apply to
 * every operation under it, and an operation may override one by redeclaring
 * the same `name` + `in` pair.
 *
 * Without this, declaring a path parameter once on the path item - the
 * idiomatic way to avoid repeating it on every method - yields an operation
 * with no parameters at all, so `{petId}` is never substituted and the request
 * goes out with the literal placeholder in its URL.
 */
export function collectOperationParameters({
  pathItem,
  operation
}: {
  pathItem: unknown;
  operation: unknown;
}): any[] {
  const pathLevel = readParameters(pathItem);
  const operationLevel = readParameters(operation);

  if (pathLevel.length === 0) {
    return operationLevel;
  }

  // An operation-level parameter wins over the path-level one it shadows.
  const overridden = new Set(
    operationLevel.map((parameter: any) => parameterKey(parameter))
  );
  const inherited = pathLevel.filter(
    (parameter: any) => !overridden.has(parameterKey(parameter))
  );

  return [...inherited, ...operationLevel];
}

/**
 * Identity of a parameter for override purposes. Per the specification a
 * parameter is unique by the combination of `name` and `in`.
 */
function parameterKey(parameter: any): string {
  return `${parameter?.in}:${parameter?.name}`;
}

function readParameters(container: unknown): any[] {
  if (!container || typeof container !== 'object') {
    return [];
  }
  const parameters = (container as {parameters?: unknown}).parameters;
  return Array.isArray(parameters) ? parameters : [];
}

/**
 * Derive the operation identifier used to correlate payloads, parameters,
 * headers and channel functions for a single OpenAPI operation.
 *
 * When the spec provides an `operationId` it is used verbatim so generated
 * names stay predictable. Otherwise a name is synthesized from the HTTP method
 * and path segments, preserving word boundaries so it can be cased cleanly
 * (e.g. `GET /v2/connect/{referenceId}` -> `getV2ConnectReferenceId`) instead
 * of collapsing into an uncasable blob (`getv2connectreferenceId`).
 */
export function deriveOperationId({
  operationId,
  method,
  path
}: {
  operationId?: string;
  method: string;
  path: string;
}): string {
  if (operationId) {
    return operationId;
  }
  const segments = path
    .split('/')
    .map((segment) => segment.replace(/[{}]/g, ''))
    .filter((segment) => segment.length > 0);
  return FormatHelpers.toCamelCase([method, ...segments].join(' '));
}
