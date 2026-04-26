/**
 * Post-processors for `zod-to-json-schema`. Splits a single Zod source-of-truth
 * (markdown-enabled `.describe()` text) into two JSON Schema variants:
 * a clean one (markdown links stripped) and a markdown one (description
 * renamed to `markdownDescription` so Monaco renders it as markdown).
 */
import type {PostProcessCallback} from 'zod-to-json-schema';

const MD_LINK_RE = /\[([^\]]+)\]\(https?:\/\/[^)]+\)/g;

/**
 * Replace markdown links of the form `[text](https://...)` with their link
 * text. Leaves plain bracketed text (e.g. `[string]`) untouched because the
 * expression requires `(http://` or `(https://` immediately after.
 */
export function stripMarkdownLinks(text: string): string {
  return text.replace(MD_LINK_RE, '$1');
}

/**
 * Strip markdown link wrappers from a JSON Schema node's description.
 * Used to produce the canonical schema consumed by CLI validation and IDEs
 * that don't understand markdown.
 */
export const postProcessClean: PostProcessCallback = (out) => {
  if (out && typeof (out as any).description === 'string') {
    (out as any).description = stripMarkdownLinks(
      (out as any).description as string
    );
  }
  return out;
};

/**
 * Rename a JSON Schema node's `description` to `markdownDescription` so
 * Monaco-based editors render the text as markdown (and links become
 * clickable) in hover tooltips.
 */
export const postProcessMarkdown: PostProcessCallback = (out) => {
  if (out && typeof (out as any).description === 'string') {
    (out as any).markdownDescription = (out as any).description;
    delete (out as any).description;
  }
  return out;
};
