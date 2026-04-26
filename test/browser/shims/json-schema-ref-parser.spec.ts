/**
 * Unit tests for the browser shim of @apidevtools/json-schema-ref-parser.
 *
 * These tests exercise the prototype methods directly because that is the
 * code path used in the real browser bundle (the npm package is replaced
 * by this shim via esbuild). Jest does not apply the esbuild plugin, so
 * test/browser/generate.spec.ts hits the real package — only this file
 * actually guards the shim.
 */
import $RefParserDefault, {
  dereferenceInternal,
  normalizeArgs
} from '../../../src/browser/shims/json-schema-ref-parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const $RefParser = $RefParserDefault as any;

describe('$RefParser shim', () => {
  describe('@readme/openapi-parser call shape: (path, schema, options)', () => {
    it('parse(path, schema, options) stores the second argument as the schema', async () => {
      const parser = new $RefParser();
      const doc = {openapi: '3.0.3', info: {title: 't', version: '1'}, paths: {}};

      const result = await parser.parse('', doc, {});

      expect(result).toBe(doc);
      expect(parser.schema).toBe(doc);
    });

    it('dereference(path, schema, options) inlines internal $refs', async () => {
      const parser = new $RefParser();
      const doc = {
        openapi: '3.0.3',
        info: {title: 't', version: '1'},
        paths: {
          '/pets': {
            get: {
              responses: {
                200: {$ref: '#/components/responses/Ok'}
              }
            }
          }
        },
        components: {
          responses: {
            Ok: {description: 'ok'}
          }
        }
      };

      await parser.dereference('', doc, {});

      expect(parser.schema.paths['/pets'].get.responses['200']).toEqual({
        description: 'ok'
      });
    });

    it('bundle(path, schema, options) populates this.schema with the document', async () => {
      const parser = new $RefParser();
      const doc = {openapi: '3.0.3', paths: {}};

      const result = await parser.bundle('', doc, {});

      expect(result).toBe(doc);
      expect(parser.schema).toBe(doc);
    });

    it('resolve(path, schema, options) populates this.schema and returns the parser instance', async () => {
      const parser = new $RefParser();
      const doc = {openapi: '3.0.3', paths: {}};

      const result = await parser.resolve('', doc, {});

      expect(result).toBe(parser);
      expect(parser.schema).toBe(doc);
    });
  });

  describe('legacy single-argument call shapes', () => {
    it('parse(jsonString) parses a JSON string into an object', async () => {
      const parser = new $RefParser();

      const result = await parser.parse('{"a":1}');

      expect(result).toEqual({a: 1});
      expect(parser.schema).toEqual({a: 1});
    });

    it('parse(nonJsonString) falls back to {} (preserves existing tolerance)', async () => {
      const parser = new $RefParser();

      const result = await parser.parse('not-json');

      expect(result).toEqual({});
      expect(parser.schema).toEqual({});
    });

    it('parse(object) stores the object as the schema', async () => {
      const parser = new $RefParser();
      const doc = {openapi: '3.0.3', paths: {}};

      const result = await parser.parse(doc);

      expect(result).toBe(doc);
      expect(parser.schema).toBe(doc);
    });
  });

  describe('helpers', () => {
    it('dereferenceInternal resolves internal $refs', async () => {
      const doc = {
        a: {$ref: '#/b'},
        b: {value: 42}
      };

      const result = await dereferenceInternal(doc);

      expect(result.a).toEqual({value: 42});
    });

    it('normalizeArgs is still exported (used by swagger-parser)', () => {
      const args = normalizeArgs(['path/to/spec', {a: 1}, {opt: true}]);

      expect(args.path).toBe('path/to/spec');
      expect(args.schema).toEqual({a: 1});
      expect(args.options).toEqual({opt: true});
    });
  });
});
