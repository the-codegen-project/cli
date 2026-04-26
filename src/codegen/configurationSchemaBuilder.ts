/**
 * Builds the public configuration JSON Schema from the Zod source of truth.
 * Filters disabled presets out of every top-level configuration branch and
 * keeps the schema's $ref graph internally consistent.
 */
import {zodToJsonSchema, type PostProcessCallback} from 'zod-to-json-schema';
import {
  zodTheCodegenConfiguration,
  zodAsyncAPICodegenConfiguration
} from './types';

const DEFAULT_DISABLED_PRESETS: readonly string[] = ['custom'];

const ASYNCAPI_REF_PREFIX =
  '#/definitions/AsyncAPICodegenConfiguration/properties/generators/items/anyOf/';

/**
 * Note: removing entries from a `anyOf` array shifts the indices of the
 * remaining entries, which would invalidate any sibling `$ref` that points to
 * a later index. The current default `disabledPresets = ['custom']` is safe
 * because `custom` sits at the highest index in every union (AsyncAPI 7,
 * OpenAPI 6, JSON Schema 1) — there are no later indices to break. A future
 * maintainer disabling a non-last preset must add index renumbering here.
 */
export function buildConfigurationSchema(
  postProcess: PostProcessCallback,
  disabledPresets: readonly string[] = DEFAULT_DISABLED_PRESETS
): Record<string, unknown> {
  const schema: any = zodToJsonSchema(zodTheCodegenConfiguration, {
    definitions: {
      AsyncAPICodegenConfiguration: zodAsyncAPICodegenConfiguration
    },
    postProcess
  });

  const asyncapiAnyOf: any[] =
    schema.definitions.AsyncAPICodegenConfiguration.properties.generators.items
      .anyOf;

  const disabledRefs = new Set<string>();
  asyncapiAnyOf.forEach((entry, i) => {
    if (disabledPresets.includes(entry?.properties?.preset?.const)) {
      disabledRefs.add(`${ASYNCAPI_REF_PREFIX}${i}`);
    }
  });

  const isDisabled = (entry: any): boolean =>
    disabledPresets.includes(entry?.properties?.preset?.const) ||
    (typeof entry?.$ref === 'string' && disabledRefs.has(entry.$ref));

  for (const branch of schema.anyOf ?? []) {
    const items = branch?.properties?.generators?.items;
    if (Array.isArray(items?.anyOf)) {
      items.anyOf = items.anyOf.filter((entry: any) => !isDisabled(entry));
    }
  }

  schema.definitions.AsyncAPICodegenConfiguration.properties.generators.items.anyOf =
    asyncapiAnyOf.filter((entry) => !isDisabled(entry));

  return schema;
}
