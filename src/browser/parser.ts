/**
 * Browser-specific AsyncAPI parser.
 *
 * This module provides the same interface as the Node.js parser but is designed
 * to work correctly when bundled for browser environments.
 *
 * When bundled with esbuild for browser:
 * - Uses the shim which loads @asyncapi/parser/browser with proper $ref resolution
 *
 * When running in Node.js (tests):
 * - Uses the regular @asyncapi/parser which works correctly
 *
 * Reference: https://github.com/asyncapi/parser-js#using-in-the-browserspa-applications
 */
import {createInputDocumentError} from '../codegen/errors';
import {Parser, AsyncAPIDocumentInterface} from './shims/asyncapi-parser';

/**
 * Browser parser instance.
 * Configured without linting rules for faster parsing.
 * The Parser is loaded from our shim which handles browser vs Node.js environments.
 */
const parser = new Parser({
  ruleset: {
    core: false,
    recommended: false
  }
});

/**
 * Load an AsyncAPI document from a string in the browser environment.
 * Uses the browser-specific parser that properly handles $ref resolution.
 *
 * @param input - The AsyncAPI document as a YAML or JSON string
 * @returns The parsed AsyncAPI document
 */
export async function loadAsyncapiFromMemoryBrowser(
  input: string
): Promise<AsyncAPIDocumentInterface> {
  const result = await parser.parse(input);

  // Check for errors (severity 0 = error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors = (result as any).diagnostics?.filter(
    (d: {severity: number}) => d.severity === 0
  );

  if (errors && errors.length > 0) {
    throw createInputDocumentError({
      inputPath: 'memory',
      inputType: 'asyncapi',
      errorMessage: JSON.stringify(errors, null, 2)
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(result as any).document) {
    throw createInputDocumentError({
      inputPath: 'memory',
      inputType: 'asyncapi',
      errorMessage: 'Failed to parse AsyncAPI document'
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any).document;
}
