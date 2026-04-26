/**
 * Browser shim for @apidevtools/swagger-parser.
 * We don't actually use swagger-parser in the browser - we use @readme/openapi-parser.
 * This shim prevents bundling issues from transitive dependencies.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = any;

/**
 * Stub SwaggerParser that does nothing
 */
export function SwaggerParser() {
  // Empty constructor
}

SwaggerParser.prototype = {
  schema: {},
  api: {},
  $refs: {
    circular: false,
    paths: () => [],
    values: () => ({}),
    get: () => undefined
  },
  parse: async (schema: Schema) => schema,
  async resolve() {
    return this;
  },
  bundle: async (schema: Schema) => schema,
  dereference: async (schema: Schema) => schema,
  validate: async (schema: Schema) => schema
};

// Static methods
SwaggerParser.parse = async (schema: Schema) => schema;
SwaggerParser.resolve = async (schema: Schema) => ({schema, $refs: {}});
SwaggerParser.bundle = async (schema: Schema) => schema;
SwaggerParser.dereference = async (schema: Schema) => schema;
SwaggerParser.validate = async (schema: Schema) => schema;

// Default export
export default SwaggerParser;
