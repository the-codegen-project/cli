/**
 * ESBuild configuration for browser bundle.
 * Creates a browser-compatible bundle of the codegen library.
 */
import * as esbuild from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

// Custom plugin to alias fs to our browser shim
const fsShimPlugin = {
  name: 'fs-shim',
  setup(build) {
    const shimPath = path.resolve(__dirname, 'src/browser/shims/fs.ts');

    // Intercept fs imports
    build.onResolve({ filter: /^(node:)?fs$/ }, () => {
      return { path: shimPath };
    });

    // Also handle fs/promises
    build.onResolve({ filter: /^(node:)?fs\/promises$/ }, () => {
      return { path: shimPath };
    });
  },
};

// Custom plugin to redirect lodash to lodash-es for proper ESM support
// The @stoplight/spectral libraries use lodash but expect ES module named exports
const lodashEsPlugin = {
  name: 'lodash-es',
  setup(build) {
    const lodashEsPath = path.dirname(require.resolve('lodash-es/package.json'));

    // Redirect all lodash imports to lodash-es
    build.onResolve({ filter: /^lodash$/ }, () => {
      return { path: path.join(lodashEsPath, 'lodash.js') };
    });

    // Also handle lodash/xxx imports -> lodash-es/xxx
    build.onResolve({ filter: /^lodash\/(.+)$/ }, (args) => {
      const subpath = args.path.replace('lodash/', '');
      return { path: path.join(lodashEsPath, `${subpath}.js`) };
    });
  },
};

// Custom plugin to shim @apidevtools/json-schema-ref-parser for browser
// The library uses Node.js file system APIs that don't work in browsers
const jsonSchemaRefParserShimPlugin = {
  name: 'json-schema-ref-parser-shim',
  setup(build) {
    const shimPath = path.resolve(__dirname, 'src/browser/shims/json-schema-ref-parser.ts');

    // Intercept @apidevtools/json-schema-ref-parser imports (main and sub-paths)
    build.onResolve({ filter: /^@apidevtools\/json-schema-ref-parser(\/.*)?$/ }, () => {
      return { path: shimPath };
    });
  },
};

// Custom plugin to shim @apidevtools/swagger-parser for browser
// We don't use swagger-parser directly - we use @readme/openapi-parser
const swaggerParserShimPlugin = {
  name: 'swagger-parser-shim',
  setup(build) {
    const shimPath = path.resolve(__dirname, 'src/browser/shims/swagger-parser.ts');

    // Intercept @apidevtools/swagger-parser imports
    build.onResolve({ filter: /^@apidevtools\/swagger-parser(\/.*)?$/ }, () => {
      return { path: shimPath };
    });
  },
};

// Custom plugin to properly handle the @asyncapi/parser/browser UMD bundle
// The browser bundle needs special handling because it's UMD and exports differently
const asyncapiParserBrowserPlugin = {
  name: 'asyncapi-parser-browser',
  setup(build) {
    const browserBundlePath = require.resolve('@asyncapi/parser/browser/index.js');

    // Handle the browser bundle import in our shim
    build.onResolve({ filter: /^@asyncapi\/parser\/browser$/ }, () => {
      return { path: browserBundlePath };
    });

    // Transform the UMD bundle to properly export Parser for ESM
    build.onLoad({ filter: /parser[\\/]browser[\\/]index\.js$/ }, async (args) => {
      const fs = await import('fs');
      const contents = fs.readFileSync(args.path, 'utf8');

      // The UMD bundle pattern: sets module.exports in CommonJS, global in browser
      // We need to create a proper ESM wrapper that captures the exports
      return {
        contents: `
          // Create fake module/exports for the UMD bundle to write to
          var module = { exports: {} };
          var exports = module.exports;

          // The original UMD bundle
          ${contents}

          // Extract the AsyncAPIParser object that was set on module.exports
          var AsyncAPIParserExports = module.exports;

          // Re-export Parser for ESM consumption
          export var Parser = AsyncAPIParserExports.Parser;
          export default AsyncAPIParserExports;
        `,
        loader: 'js',
      };
    });
  },
};

// Custom plugin to add SlowBuffer to the buffer module (for avsc compatibility)
// The polyfill uses @jspm/core which wraps buffer but doesn't export SlowBuffer
const slowBufferPlugin = {
  name: 'slowbuffer-patch',
  setup(build) {
    // Patch the @jspm/core buffer wrapper to export SlowBuffer
    build.onLoad({ filter: /@jspm[\\/]core[\\/]nodelibs[\\/]browser[\\/]buffer\.js$/ }, async (args) => {
      const fs = await import('fs');
      let contents = fs.readFileSync(args.path, 'utf8');

      // Add SlowBuffer variable declaration after Buffer
      // Original: var Buffer = exports.Buffer;
      // Target: var Buffer = exports.Buffer;
      //         var SlowBuffer = exports.SlowBuffer;
      contents = contents.replace(
        'var Buffer = exports.Buffer;',
        'var Buffer = exports.Buffer;\nvar SlowBuffer = exports.SlowBuffer;'
      );

      // Add SlowBuffer to the named exports
      // Original: export { Buffer, INSPECT_MAX_BYTES, exports as default, kMaxLength };
      // Target: export { Buffer, SlowBuffer, INSPECT_MAX_BYTES, exports as default, kMaxLength };
      contents = contents.replace(
        'export { Buffer,',
        'export { Buffer, SlowBuffer,'
      );

      return { contents, loader: 'js' };
    });
  },
};

const buildOptions = {
  entryPoints: ['src/browser/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/browser/codegen.browser.mjs',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: isMinify,
  plugins: [
    // Our custom shims must come first
    fsShimPlugin,
    // Shim json-schema-ref-parser for browser (no Node.js file system)
    jsonSchemaRefParserShimPlugin,
    // Shim swagger-parser (we use @readme/openapi-parser instead)
    swaggerParserShimPlugin,
    // Handle @asyncapi/parser/browser UMD bundle properly
    asyncapiParserBrowserPlugin,
    // Redirect lodash to lodash-es for proper ESM support
    lodashEsPlugin,
    // Add SlowBuffer to buffer module for avsc compatibility
    slowBufferPlugin,
    // Polyfill other Node.js built-in modules
    polyfillNode({
      globals: {
        process: true,
        Buffer: true,
        global: true,
      },
      polyfills: {
        assert: true,
        buffer: true,
        crypto: true,
        events: true,
        // fs is handled by our custom shim
        fs: false,
        http: true,
        https: true,
        os: true,
        path: true,
        process: true,
        stream: true,
        string_decoder: true,
        url: true,
        util: true,
        zlib: true,
      },
    }),
  ],
  external: [
    // Only mark things that truly can't be polyfilled
    'inspector',
    'node:inspector',
    // JSON file that has import issues
    'ajv/lib/refs/json-schema-draft-04.json',
  ],
  // Define browser-friendly replacements
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'globalThis',
  },
  // Configure main fields resolution - prefer browser field
  mainFields: ['browser', 'module', 'main'],
  // Resolve extensions
  resolveExtensions: ['.ts', '.js', '.mjs', '.cjs', '.json'],
  // Handle the banner for ESM
  // webapi-parser expects Ajv to be a global variable
  banner: {
    js: `// Browser bundle for The Codegen Project
// Generated by esbuild with Node.js polyfills

// Global Ajv placeholder for webapi-parser (will be set by require_ajv4)
var Ajv;
`
  },
  logLevel: 'info',
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      const result = await esbuild.build(buildOptions);
      console.log('Browser bundle built successfully');
      if (result.metafile) {
        console.log(await esbuild.analyzeMetafile(result.metafile));
      }
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
