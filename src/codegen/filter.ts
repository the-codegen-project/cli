import {minimatch} from 'minimatch';
import {InputFilter} from './types';

export {InputFilter};

/**
 * Determine whether a document surface (channel, operation, path, ...) should be
 * retained given an include/exclude glob filter.
 *
 * A surface is described by one or more `candidates` — e.g. an AsyncAPI channel
 * contributes its address and id, an operation additionally contributes its
 * operationId. The surface matches an include/exclude pattern when *any* of its
 * candidates matches the pattern (minimatch semantics).
 *
 * Semantics:
 * - Empty `include` includes everything.
 * - `exclude` is applied after `include`; an excluded surface is always dropped.
 * - Empty `exclude` excludes nothing.
 *
 * @returns `true` when the surface should be kept, `false` when it should be dropped.
 */
export function matchesFilter({
  candidates,
  include,
  exclude
}: {
  candidates: string[];
  include: string[];
  exclude: string[];
}): boolean {
  const included =
    include.length === 0 ||
    include.some((pattern) => candidates.some((c) => minimatch(c, pattern)));
  const excluded = exclude.some((pattern) =>
    candidates.some((c) => minimatch(c, pattern))
  );
  return included && !excluded;
}

/**
 * Coerce a possibly-partial filter into `{include, exclude}` with both lists
 * present. Root-level config fields are validated but not re-materialized with
 * Zod defaults (see `realizeConfiguration`), so `include`/`exclude` can be
 * `undefined` at runtime even though the inferred type says otherwise.
 */
export function normalizeFilter(filter?: InputFilter): {
  include: string[];
  exclude: string[];
} {
  return {
    include: filter?.include ?? [],
    exclude: filter?.exclude ?? []
  };
}

/**
 * Whether a filter actually restricts anything. When both lists are empty the
 * loaders short-circuit and leave the document untouched, guaranteeing the
 * no-filter path is byte-identical to today.
 */
export function isFilterActive(filter?: InputFilter): boolean {
  const {include, exclude} = normalizeFilter(filter);
  return include.length > 0 || exclude.length > 0;
}

/**
 * Recursively collect every string value stored under `key` anywhere within
 * `node`. Used by both input filters to determine which component
 * schemas/messages remain reachable after channels/operations/paths have been
 * removed: parsers tag component definitions (and their inlined usages) with a
 * name extension (`x-parser-schema-id`, `x-modelgen-inferred-name`), so the set
 * of values found under the retained surfaces is exactly what is still in use.
 *
 * Dereferenced OpenAPI documents contain genuine circular object references for
 * recursive schemas (a `$ref` cycle is inlined by shared object identity), so
 * the walk tracks visited objects in a `WeakSet` to avoid infinite recursion.
 */
export function collectExtensionValues({
  node,
  key,
  accumulator,
  seen = new WeakSet<object>()
}: {
  node: unknown;
  key: string;
  accumulator: Set<string>;
  seen?: WeakSet<object>;
}): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (seen.has(node)) {
    return;
  }
  seen.add(node);
  if (Array.isArray(node)) {
    for (const value of node) {
      collectExtensionValues({node: value, key, accumulator, seen});
    }
    return;
  }
  const record = node as Record<string, unknown>;
  // eslint-disable-next-line security/detect-object-injection
  const value = record[key];
  if (typeof value === 'string') {
    accumulator.add(value);
  }
  for (const child of Object.values(record)) {
    collectExtensionValues({node: child, key, accumulator, seen});
  }
}
