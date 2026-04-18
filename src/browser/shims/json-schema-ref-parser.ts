/* eslint-disable security/detect-object-injection */
/**
 * Browser shim for @apidevtools/json-schema-ref-parser.
 * The original library uses Node.js file system APIs for dereferencing.
 * In the browser, we provide implementations that resolve internal $ref
 * references (those starting with #/) without file system access.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = any;

/**
 * Resolve a JSON pointer (e.g., "#/components/messages/UserCreated") within a schema.
 */
function resolvePointer(schema: Schema, pointer: string): Schema | undefined {
  if (!pointer.startsWith('#/')) {
    return undefined; // External refs not supported in browser
  }

  const parts = pointer
    .slice(2)
    .split('/')
    .map((p) =>
      // Decode JSON pointer escape sequences
      p.replace(/~1/g, '/').replace(/~0/g, '~')
    );

  let current = schema;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Deep clone and dereference all internal $ref in a schema.
 */
function dereferenceInternalImpl(
  schema: Schema,
  root: Schema,
  visited = new Set<string>()
): Schema {
  if (schema === null || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => dereferenceInternalImpl(item, root, visited));
  }

  // Handle $ref
  if (
    schema.$ref &&
    typeof schema.$ref === 'string' &&
    schema.$ref.startsWith('#/')
  ) {
    const refPath = schema.$ref;

    // Prevent circular reference infinite loops
    if (visited.has(refPath)) {
      // Return a reference marker for circular refs
      return {...schema};
    }

    const resolved = resolvePointer(root, refPath);
    if (resolved !== undefined) {
      visited.add(refPath);
      // Recursively dereference the resolved schema
      const dereferenced = dereferenceInternalImpl(resolved, root, visited);
      visited.delete(refPath);
      return dereferenced;
    }
  }

  // Recursively process all properties
  const result: Schema = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = dereferenceInternalImpl(value, root, visited);
  }
  return result;
}

/**
 * Exported dereferenceInternal for @readme/openapi-parser compatibility.
 */
export async function dereferenceInternal(
  schema: Schema,
  _options?: object
): Promise<Schema> {
  return dereferenceInternalImpl(schema, schema);
}

/**
 * Browser-compatible dereference that resolves internal $ref references.
 */
export async function dereference(
  _basePathOrSchema: string | object,
  schemaOrOptions?: object,
  _options?: object
): Promise<object> {
  const schema =
    typeof _basePathOrSchema === 'object'
      ? _basePathOrSchema
      : schemaOrOptions ?? {};

  return dereferenceInternalImpl(schema, schema);
}

/**
 * Browser-compatible bundle that returns the input unchanged.
 */
export async function bundle(
  _basePathOrSchema: string | object,
  schemaOrOptions?: object,
  _options?: object
): Promise<object> {
  if (typeof _basePathOrSchema === 'object') {
    return _basePathOrSchema;
  }
  return schemaOrOptions ?? {};
}

/**
 * Browser-compatible parse that returns the input unchanged.
 */
export async function parse(
  _basePathOrSchema: string | object,
  schemaOrOptions?: object,
  _options?: object
): Promise<object> {
  if (typeof _basePathOrSchema === 'object') {
    return _basePathOrSchema;
  }
  return schemaOrOptions ?? {};
}

/**
 * Browser-compatible resolve that returns the input unchanged.
 */
export async function resolve(
  _basePathOrSchema: string | object,
  schemaOrOptions?: object,
  _options?: object
): Promise<object> {
  if (typeof _basePathOrSchema === 'object') {
    return _basePathOrSchema;
  }
  return schemaOrOptions ?? {};
}

/**
 * Stub for MissingPointerError
 */
export class MissingPointerError extends Error {
  constructor(message?: string) {
    super(message || 'Missing pointer');
    this.name = 'MissingPointerError';
  }
}

/**
 * Stub for $RefParser class used by @readme/openapi-parser and @apidevtools/swagger-parser
 * Must be a proper constructor function for util.inherits compatibility
 */
export function $RefParser(this: RefParserInstance) {
  this.schema = {};
  this.$refs = {
    circular: false,
    paths: () => [],
    values: () => ({}),
    get: () => undefined
  };
}

interface RefParserInstance {
  schema: Schema;
  $refs: {
    circular: boolean;
    paths: () => string[];
    values: () => Record<string, Schema>;
    get: (path: string) => Schema | undefined;
  };
}

$RefParser.prototype.parse = async function (
  schema: Schema | string,
  _options?: object
): Promise<Schema> {
  if (typeof schema === 'string') {
    try {
      this.schema = JSON.parse(schema);
    } catch {
      this.schema = {};
    }
  } else {
    this.schema = schema;
  }
  return this.schema;
};

$RefParser.prototype.resolve = async function (
  schema: Schema | string,
  _options?: object
): Promise<RefParserInstance> {
  await this.parse(schema, _options);
  return this;
};

$RefParser.prototype.bundle = async function (
  schema: Schema | string,
  _options?: object
): Promise<Schema> {
  await this.parse(schema, _options);
  return this.schema;
};

$RefParser.prototype.dereference = async function (
  schema: Schema | string,
  _options?: object
): Promise<Schema> {
  await this.parse(schema, _options);
  return this.schema;
};

/**
 * Get default options for json-schema-ref-parser
 */
export function getJsonSchemaRefParserDefaultOptions(): object {
  return {
    parse: {
      json: {order: 100},
      yaml: {order: 200},
      text: {order: 300},
      binary: {order: 400}
    },
    resolve: {
      file: {order: 100},
      http: {order: 200},
      external: true
    },
    dereference: {
      circular: true,
      excludedPathMatcher: () => false
    },
    continueOnError: false
  };
}

/**
 * Options constructor for swagger-parser compatibility
 * swagger-parser does: util.inherits(ParserOptions, $RefParserOptions)
 */
interface OptionsInstance {
  parse: object;
  resolve: object;
  dereference: object;
  [key: string]: unknown;
}

export function Options(this: OptionsInstance, options?: object) {
  const defaults = getJsonSchemaRefParserDefaultOptions() as OptionsInstance;
  Object.assign(this, defaults);
  if (options) {
    Object.assign(this, options);
  }
}

Options.prototype = {};

// Alias for backward compatibility
export {Options as $RefParserOptions};

/**
 * Normalize arguments for parser methods (used by swagger-parser)
 */
export function normalizeArgs(args: IArguments | unknown[]): {
  path: string;
  schema: Schema;
  options: object;
  callback?: (err: Error | null, result?: Schema) => void;
} {
  const argsArray = Array.from(args);
  let path = '';
  let schema: Schema = {};
  let options = {};
  let callback: ((err: Error | null, result?: Schema) => void) | undefined;

  // Parse arguments based on type
  for (const arg of argsArray) {
    if (typeof arg === 'string') {
      path = arg;
    } else if (typeof arg === 'function') {
      callback = arg as (err: Error | null, result?: Schema) => void;
    } else if (typeof arg === 'object' && arg !== null) {
      if (!schema || Object.keys(schema).length === 0) {
        schema = arg;
      } else {
        options = arg;
      }
    }
  }

  return {path, schema, options, callback};
}

// Default export - must be the $RefParser constructor for CommonJS compatibility
// swagger-parser does: const $RefParser = require('@apidevtools/json-schema-ref-parser')
export default $RefParser;
