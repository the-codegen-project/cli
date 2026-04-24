/**
 * Playground page - Interactive code generator.
 * Allows users to input API specs and generate TypeScript code in real-time.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import { useConfigSync } from '../../hooks/useConfigSync';
import { useCodegen } from '../../hooks/useCodegen';
import Editor from '../../components/Playground/Editor';
import ConfigPanel from '../../components/Playground/ConfigPanel';
import OutputPanel from '../../components/Playground/OutputPanel';
import DownloadButton from '../../components/Playground/DownloadButton';
import { examples, getExample } from '../../components/Playground/examples';
import styles from '../../components/Playground/playground.module.css';

const DEFAULT_SPEC = examples[0].spec;

export default function PlaygroundPage(): JSX.Element {
  // Spec input state
  const [spec, setSpec] = useState(DEFAULT_SPEC);
  const [inputType, setInputType] = useState<'asyncapi' | 'openapi' | 'jsonschema'>('asyncapi');

  // Config state (synced between form and JSON)
  const {
    formState,
    setFormState,
    jsonCode,
    handleJsonChange,
    mode,
    setMode,
    hasManualEdits,
    forceFormMode,
  } = useConfigSync();

  // Codegen state
  const { generate, isGenerating, isReady, loadingPhase, output, error } = useCodegen();

  // Track if initial auto-generation has been triggered
  const hasInitiallyGeneratedRef = useRef(false);

  // UI error state for toast notifications
  const [uiError, setUiError] = useState<string | null>(null);

  // Auto-dismiss UI error after 5 seconds
  useEffect(() => {
    if (uiError) {
      const timeoutId = setTimeout(() => setUiError(null), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [uiError]);

  // Generated files
  const files = output?.files ?? {};
  const errors = output?.errors ?? [];
  const allErrors = error ? [error, ...errors] : errors;

  // Suppress ResizeObserver loop error (benign Monaco Editor issue)
  useEffect(() => {
    const resizeObserverError = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', resizeObserverError);
    return () => window.removeEventListener('error', resizeObserverError);
  }, []);

  // Sync inputType when form state changes
  useEffect(() => {
    if (formState.inputType !== inputType) {
      setInputType(formState.inputType);
    }
  }, [formState.inputType]);

  // Handle example selection
  const handleExampleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const example = getExample(e.target.value);
      if (example) {
        setSpec(example.spec);
        setInputType(example.inputType);
        // Update form state to match input type
        setFormState({
          ...formState,
          inputType: example.inputType,
        });
      }
    },
    [formState, setFormState]
  );

  // Handle generation
  const handleGenerate = useCallback(async () => {
    console.log('[Playground] handleGenerate called');
    console.log('[Playground] mode:', mode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let configToUse: any;

    if (mode === 'json') {
      // Parse JSON config using browser bundle's parseConfig
      console.log('[Playground] Parsing JSON config...');
      try {
        // Access parseConfig from the dynamically loaded browser bundle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const codegenModule = (window as any).__codegen_module;
        if (!codegenModule?.parseConfig) {
          setUiError('Codegen bundle not loaded. Please wait and try again.');
          return;
        }
        configToUse = codegenModule.parseConfig(jsonCode, 'json');
        console.log('[Playground] Parsed config:', configToUse);
      } catch (err) {
        console.error('[Playground] Config parse error:', err);
        setUiError(err instanceof Error ? err.message : 'Invalid JSON config');
        return;
      }
    } else {
      // Form mode - build config from form state
      console.log('[Playground] Using form state:', formState);
      const enabledGenerators = formState.generators
        .filter((g) => g.enabled)
        .map((g) => {
          const config: { preset: string; outputPath: string; protocols?: string[] } = {
            preset: g.preset,
            outputPath: g.outputPath,
          };

          // Add protocols for channels/client
          if (g.preset === 'channels' || g.preset === 'client') {
            config.protocols = formState.protocols;
          }

          return config;
        });

      console.log('[Playground] enabledGenerators:', enabledGenerators);

      if (enabledGenerators.length === 0) {
        setUiError('Please enable at least one generator');
        return;
      }

      configToUse = {
        inputType: formState.inputType,
        inputPath: './spec.yaml',
        language: 'typescript',
        generators: enabledGenerators,
      };
    }

    console.log('[Playground] Final config:', configToUse);
    await generate({
      spec,
      specFormat: configToUse.inputType,
      config: configToUse,
    });
    console.log('[Playground] Generate returned');
  }, [spec, formState, jsonCode, mode, generate]);

  // Handle ZIP download
  const handleDownload = useCallback(() => {
    // Download is handled by the DownloadButton component
  }, []);

  // Auto-generate on initial load when bundle is ready
  useEffect(() => {
    if (isReady && !hasInitiallyGeneratedRef.current && spec.trim()) {
      hasInitiallyGeneratedRef.current = true;
      // Small delay to ensure form state is fully initialized
      const timeoutId = setTimeout(() => {
        handleGenerate();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isReady, spec, handleGenerate]);

  return (
    <Layout
      title="Playground"
      description="Interactive code generator - Try The Codegen Project in your browser"
    >
      <div className={styles.playground}>
        <div className={styles.playgroundHeader}>
          <h1 className={styles.playgroundTitle}>Playground</h1>
          <div className={styles.playgroundActions}>
            <DownloadButton
              files={files}
              configContent={jsonCode}
              specContent={spec}
              disabled={isGenerating}
            />
            <button
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={loadingPhase !== 'idle' || !spec.trim()}
            >
              {loadingPhase === 'loading-bundle' ? 'Loading...' :
               loadingPhase !== 'idle' ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        <div className={styles.playgroundContent}>
          {/* Input Panel */}
          <div className={styles.inputPanel}>
            <div className={styles.inputHeader}>
              <span className={styles.panelTitle}>Input Specification</span>
              <div className={styles.inputTypeSelect}>
                <select
                  onChange={handleExampleChange}
                  className={styles.exampleSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Load example...
                  </option>
                  {examples.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.inputContent}>
              <Editor
                value={spec}
                onChange={setSpec}
                language={spec.trimStart().startsWith('{') ? 'json' : inputType === 'jsonschema' ? 'json' : 'yaml'}
                schemaType={inputType}
                placeholder="Paste your API specification here..."
              />
            </div>
          </div>

          {/* Config Panel */}
          <ConfigPanel
            formState={formState}
            onFormStateChange={setFormState}
            jsonCode={jsonCode}
            onJsonCodeChange={handleJsonChange}
            mode={mode}
            onModeChange={setMode}
            hasManualEdits={hasManualEdits}
            onForceFormMode={forceFormMode}
          />

          {/* Output Panel */}
          <OutputPanel
            files={files}
            isGenerating={isGenerating}
            loadingPhase={loadingPhase}
            errors={allErrors}
            onDownload={handleDownload}
          />
        </div>

        {/* Toast notification for UI errors */}
        {uiError && (
          <div className={styles.toast}>
            <span className={styles.toastIcon}>⚠️</span>
            <span className={styles.toastMessage}>{uiError}</span>
            <button
              className={styles.toastDismiss}
              onClick={() => setUiError(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
