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
