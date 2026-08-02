/* eslint-disable security/detect-object-injection */
import {AsyncAPIInputProcessor} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';

const COMPONENT_POINTER_PREFIX = '#/components/schemas/';

/**
 * Cheap pre-scan: does this fragment contain any pointer the rewrite would act
 * on? Fragments without one are returned by identity so documents that never
 * hit the circular-reference case take a byte-identical path.
 */
function hasComponentPointer(node: any): boolean {
  if (Array.isArray(node)) {
    return node.some((entry) => hasComponentPointer(entry));
  }
  if (node === null || typeof node !== 'object') {
    return false;
  }
  const ref = node['$ref'];
  if (typeof ref === 'string' && ref.startsWith(COMPONENT_POINTER_PREFIX)) {
    return true;
  }
  return Object.values(node).some((value) => hasComponentPointer(value));
}

/**
 * Inlined-target map for a fragment whose root *is* the extracted schema — a
 * pointer back to it resolves as `#`.
 */
export function inlinedRootTarget(fragment: any): Map<string, string> {
  const parserSchemaId = fragment?.['x-parser-schema-id'];
  return typeof parserSchemaId === 'string'
    ? new Map([[parserSchemaId, '#']])
    : new Map();
}

/**
 * Inlined-target map for an assembled `oneOf` union — each member is inlined at
 * its own slot, so a pointer to one resolves as `#/oneOf/<index>`. Boolean
 * members carry no schema id and are skipped.
 */
export function inlinedUnionTargets(members: any[]): Map<string, string> {
  const targets = new Map<string, string>();
  members.forEach((member, index) => {
    const parserSchemaId = member?.['x-parser-schema-id'];
    if (typeof parserSchemaId === 'string') {
      targets.set(parserSchemaId, `#/oneOf/${index}`);
    }
  });
  return targets;
}

interface RewriteContext {
  /** Component name → the parsed component schema model. */
  components: Map<string, any>;
  /** Component name → local JSON pointer of the copy inlined in the fragment. */
  inlinedTargets: Map<string, string>;
  /** Accumulated `definitions` block, attached to the fragment root at the end. */
  definitions: Record<string, any>;
  /** Components already hoisted, so a cycle terminates. */
  hoistedComponents: Set<string>;
}

/** Convert a component and add it to `definitions`, once per component. */
function hoistComponent({
  componentName,
  context
}: {
  componentName: string;
  context: RewriteContext;
}): void {
  if (context.hoistedComponents.has(componentName)) {
    return;
  }
  // Marked before the recursive walk so a cycle back to this component
  // terminates instead of hoisting forever.
  context.hoistedComponents.add(componentName);
  const converted = AsyncAPIInputProcessor.convertToInternalSchema(
    context.components.get(componentName)
  );
  context.definitions[componentName] = {
    ...rewriteNode({node: converted, context}),
    $id: componentName
  };
}

/** Resolve a single surviving `#/components/schemas/X` pointer. */
function rewriteRef({
  node,
  ref,
  context
}: {
  node: any;
  ref: string;
  context: RewriteContext;
}): any {
  const componentName = ref.slice(COMPONENT_POINTER_PREFIX.length);
  const inlinedPointer = context.inlinedTargets.get(componentName);
  if (inlinedPointer !== undefined) {
    return {...node, $ref: inlinedPointer};
  }
  if (context.components.has(componentName)) {
    hoistComponent({componentName, context});
    return {...node, $ref: `#/definitions/${componentName}`};
  }
  // Unknown component — leave the pointer alone so the existing dereference
  // error surfaces rather than a silently wrong model.
  return node;
}

/**
 * Rebuild the node when — and only when — something below it changed. Nested
 * nodes are shared with the parser's document tree (the extraction sites copy
 * only the top level), so rewriting in place would corrupt every other
 * extraction site; returning the original reference when nothing changed is
 * what keeps untouched fragments identical.
 */
function rewriteNode({
  node,
  context
}: {
  node: any;
  context: RewriteContext;
}): any {
  if (Array.isArray(node)) {
    let changed = false;
    const rewrittenEntries = node.map((entry) => {
      const rewrittenEntry = rewriteNode({node: entry, context});
      changed ||= rewrittenEntry !== entry;
      return rewrittenEntry;
    });
    return changed ? rewrittenEntries : node;
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }

  const ref = node['$ref'];
  if (typeof ref === 'string' && ref.startsWith(COMPONENT_POINTER_PREFIX)) {
    return rewriteRef({node, ref, context});
  }

  let changed = false;
  const rewrittenNode: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    const rewrittenValue = rewriteNode({node: value, context});
    changed ||= rewrittenValue !== value;
    rewrittenNode[key] = rewrittenValue;
  }
  return changed ? rewrittenNode : node;
}

/**
 * Rewrite `#/components/schemas/X` pointers that survived parsing so they
 * resolve inside an extracted fragment.
 *
 * `@asyncapi/parser` inlines every non-circular `$ref`, but leaves a cycle as a
 * literal `{"$ref": "#/components/schemas/X"}`. The extraction sites re-root a
 * single message payload/headers schema as a standalone draft-07 document,
 * which carries no `components` section — so the surviving pointer dangles and
 * Modelina's dereference step fails with
 * `Could not dereference $ref in input`.
 *
 * Each surviving pointer is resolved one of two ways, and both halves are
 * load-bearing:
 *
 * - **Already inlined in this fragment** → rewritten to that copy's local JSON
 *   pointer. Hoisting it into `definitions` instead makes Modelina name the
 *   dereferenced copy after the *use site*, emitting a second class for the
 *   same schema (self-recursion yields `Node` *and* `NodeChildrenItem`).
 * - **Not inlined anywhere in this fragment** → hoisted into `definitions` with
 *   `$id` stamped, and recursed into so transitive targets come along. Without
 *   the `$id`, Modelina again names the model after the referencing property
 *   (mutual recursion yields `Ab` instead of `B`).
 *
 * `fragment` and the return value are `any` because the extracted schemas are
 * untyped JSON Schema objects throughout the AsyncAPI input path (see
 * `ProcessedPayloadSchemaData`).
 *
 * @param fragment the assembled, re-rooted schema fragment
 * @param asyncapiDocument the parsed document the fragment was extracted from
 * @param inlinedTargets `x-parser-schema-id` → local JSON pointer of the copy
 * already inlined in this fragment (`#` for a single-message root,
 * `#/oneOf/<i>` for a union member)
 */
export function resolveAsyncapiComponentRefs({
  fragment,
  asyncapiDocument,
  inlinedTargets
}: {
  fragment: any;
  asyncapiDocument: AsyncAPIDocumentInterface;
  inlinedTargets: Map<string, string>;
}): any {
  if (!hasComponentPointer(fragment)) {
    return fragment;
  }

  const components = new Map<string, any>();
  for (const componentSchema of asyncapiDocument.components().schemas().all()) {
    components.set(componentSchema.id(), componentSchema);
  }

  const context: RewriteContext = {
    components,
    inlinedTargets,
    definitions: {},
    hoistedComponents: new Set<string>()
  };

  const rewrittenFragment = rewriteNode({node: fragment, context});
  if (Object.keys(context.definitions).length === 0) {
    return rewrittenFragment;
  }
  return {
    ...rewrittenFragment,
    definitions: {...rewrittenFragment.definitions, ...context.definitions}
  };
}
