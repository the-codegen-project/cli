/* eslint-disable no-undef, no-console */
/**
 * Shim for @asyncapi/parser that works in both Node.js and browser environments.
 *
 * - In Node.js (tests): Uses the regular @asyncapi/parser package
 * - In browser (bundled): Uses @asyncapi/parser/browser which has proper $ref resolution
 *
 * The esbuild plugin (asyncapiParserBrowserPlugin) transforms the browser bundle
 * to properly export the Parser class.
 */

// Type definitions for AsyncAPIDocumentInterface
// These match the interface from @asyncapi/parser
export interface AsyncAPIDocumentInterface {
  version(): string;
  info(): unknown;
  servers(): unknown;
  channels(): unknown;
  operations(): unknown;
  messages(): unknown;
  schemas(): unknown;
  securitySchemes(): unknown;
  components(): unknown;
  allServers(): unknown;
  allChannels(): unknown;
  allOperations(): unknown;
  allMessages(): unknown;
  allSchemas(): unknown;
  extensions(): unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json<T = any>(): T;
}

// Detect environment - if we have window/document, we're in browser
const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ParserClass: any;

if (isBrowser) {
  // In browser: use the browser bundle
  // The esbuild plugin transforms this to properly export Parser
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const browserBundle = require('@asyncapi/parser/browser');

  // Debug: log the bundle structure to help diagnose issues
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      '[AsyncAPI Parser Shim] Bundle keys:',
      Object.keys(browserBundle)
    );
    console.debug(
      '[AsyncAPI Parser Shim] Parser type:',
      typeof browserBundle.Parser
    );
    console.debug(
      '[AsyncAPI Parser Shim] default type:',
      typeof browserBundle.default
    );
    if (browserBundle.default) {
      console.debug(
        '[AsyncAPI Parser Shim] default.Parser type:',
        typeof browserBundle.default?.Parser
      );
    }
  }

  ParserClass =
    browserBundle.Parser ||
    browserBundle.default?.Parser ||
    browserBundle.default;

  if (!ParserClass || typeof ParserClass !== 'function') {
    console.error(
      'AsyncAPI Parser browser bundle structure:',
      Object.keys(browserBundle)
    );
    console.error('Parser value:', browserBundle.Parser);
    console.error('default value:', browserBundle.default);
    throw new Error(
      `Could not find Parser constructor in @asyncapi/parser/browser bundle. ` +
        `Parser type: ${typeof ParserClass}`
    );
  }
} else {
  // In Node.js: use the regular parser
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const parserModule = require('@asyncapi/parser');
  ParserClass = parserModule.Parser;
}

// Export Parser as both named and default export
export const Parser = ParserClass;
export default ParserClass;
