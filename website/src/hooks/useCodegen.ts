/**
 * Hook to use the browser codegen bundle.
 * Provides generation functions and manages loading/error states.
 *
 * NOTE: The browser bundle must be available at /codegen.browser.mjs
 * in the static folder. Copy it there during build.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/** Loading phase for progress indication */
export type LoadingPhase =
  | 'idle'
  | 'loading-bundle'
  | 'parsing-spec'
  | 'generating'
  | 'complete';

export interface GenerateInput {
  /** API specification content (AsyncAPI/OpenAPI/JSON Schema) */
  spec: string;
  /** Format of the spec ('asyncapi' | 'openapi' | 'jsonschema') */
  specFormat: 'asyncapi' | 'openapi' | 'jsonschema';
  /** Generator configuration */
  config: {
    inputType: string;
    generators: Array<{
      preset: string;
      outputPath: string;
      [key: string]: unknown;
    }>;
  };
}

export interface GenerateOutput {
  /** Generated files (path → content) */
  files: Record<string, string>;
  /** Any errors that occurred */
  errors: string[];
}

export interface UseCodegenResult {
  /** Generate code from spec and config */
  generate: (input: GenerateInput) => Promise<GenerateOutput>;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether the bundle is loaded and ready */
  isReady: boolean;
  /** Current loading phase for progress indication */
  loadingPhase: LoadingPhase;
  /** Last generation output */
  output: GenerateOutput | null;
  /** Last error */
  error: string | null;
  /** Clear output and error */
  clear: () => void;
}

// Type for the browser bundle module
interface BrowserCodegen {
  generate: (input: {
    spec: string;
    specFormat: string;
    config: unknown;
  }) => Promise<{
    files: Record<string, string>;
    errors: string[];
  }>;
}

// Global reference to loaded module (survives component re-renders)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: Window & { __codegen_module?: BrowserCodegen };

/**
 * Normalize a file path by removing leading ./ and extra slashes.
 */
function normalizePath(path: string): string {
  // Remove leading ./ or ././ etc
  let normalized = path.replace(/^(\.\/)+/, '');
  // Remove any double slashes
  normalized = normalized.replace(/\/+/g, '/');
  // Remove leading slash
  normalized = normalized.replace(/^\//, '');
  return normalized;
}

/**
 * Normalize all file paths in the output.
 */
function normalizeFilePaths(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    const normalizedPath = normalizePath(path);
    if (normalizedPath) {
      normalized[normalizedPath] = content;
    }
  }
  return normalized;
}

export function useCodegen(): UseCodegenResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const [output, setOutput] = useState<GenerateOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  // Load module on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__codegen_module) {
      setIsReady(true);
      return;
    }
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoadingPhase('loading-bundle');

    // Use Function constructor to create a dynamic import that Webpack won't analyze
    const loadBundle = async () => {
      try {
        // Load the bundle using a script tag to avoid Webpack analysis
        const bundleUrl = '/codegen.browser.mjs';

        // For ESM modules, we need to use dynamic import
        // We use new Function to avoid Webpack static analysis
        const dynamicImport = new Function('url', 'return import(url)');
        const module = await dynamicImport(bundleUrl);

        window.__codegen_module = module;
        setIsReady(true);
        setLoadingPhase('idle');
      } catch (err) {
        console.error('Failed to load codegen bundle:', err);
        setError('Failed to load codegen bundle. The playground requires the browser bundle to be built and available.');
        setLoadingPhase('idle');
      }
    };

    loadBundle();
  }, []);

  const generate = useCallback(
    async (input: GenerateInput): Promise<GenerateOutput> => {
      if (!window.__codegen_module) {
        console.error('[useCodegen] Bundle not loaded');
        const errorOutput: GenerateOutput = {
          files: {},
          errors: ['Codegen bundle not loaded. Please wait for it to load or refresh the page.']
        };
        setError(errorOutput.errors[0]);
        setOutput(errorOutput);
        return errorOutput;
      }

      setIsGenerating(true);
      setLoadingPhase('parsing-spec');
      setError(null);

      try {
        setLoadingPhase('generating');
        const result = await window.__codegen_module.generate({
          spec: input.spec,
          specFormat: input.specFormat,
          config: {
            inputType: input.config.inputType,
            inputPath: './spec.yaml', // Virtual path
            language: 'typescript',
            generators: input.config.generators,
          },
        });

        // Normalize file paths to remove leading ./ and fix double slashes
        const normalizedResult: GenerateOutput = {
          files: normalizeFilePaths(result.files),
          errors: result.errors
        };
        setOutput(normalizedResult);
        setLoadingPhase('complete');
        // Brief completion state before returning to idle
        setTimeout(() => setLoadingPhase('idle'), 500);
        return normalizedResult;
      } catch (err) {
        console.error('[useCodegen] Generation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Generation failed';
        setError(errorMessage);
        const errorOutput: GenerateOutput = { files: {}, errors: [errorMessage] };
        setOutput(errorOutput);
        setLoadingPhase('idle');
        return errorOutput;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setOutput(null);
    setError(null);
  }, []);

  return {
    generate,
    isGenerating,
    isReady,
    loadingPhase,
    output,
    error,
    clear,
  };
}
