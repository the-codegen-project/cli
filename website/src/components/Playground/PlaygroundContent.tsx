/**
 * Playground page content - Interactive code generator.
 *
 * Extracted into its own module so it can be loaded exclusively on the client
 * via `@docusaurus/BrowserOnly`. Monaco Editor (and the browser codegen bundle)
 * touch `window` during module initialisation, which breaks Docusaurus SSR.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useConfigSync } from '../../hooks/useConfigSync';
import { useCodegen } from '../../hooks/useCodegen';
import Editor from './Editor';
import ConfigPanel from './ConfigPanel';
import OutputPanel from './OutputPanel';
import DownloadButton from './DownloadButton';
import { examples, getExample } from './examples';
import { detectInputType } from '../../schemas';
import { getDefaultFormStateForInputType } from '../../utils/configCodegen';
import styles from './playground.module.css';

const DEFAULT_SPEC = examples[0].spec;

export default function PlaygroundContent(): JSX.Element {
  // Spec input state
  const [spec, setSpec] = useState(DEFAULT_SPEC);

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

  // Mobile single-panel-at-a-time switcher state
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobilePanel, setMobilePanel] = useState<'spec' | 'config' | 'output'>('spec');

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

  // On mobile, hide non-active panels via CSS so editor/file-explorer state
  // is preserved across tab switches (panels stay mounted).
  const hideOnMobile = (panel: 'spec' | 'config' | 'output') =>
    isMobile && mobilePanel !== panel ? styles.hiddenOnMobile : undefined;

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

  // Auto-detect input type from spec content; debounce to avoid flipping form
  // state mid-keystroke. Only rebuild when detection differs from current
  // formState so custom edits aren't clobbered on every render.
  useEffect(() => {
    const handle = setTimeout(() => {
      const detected = detectInputType(spec);
      if (detected && detected !== formState.inputType) {
        setFormState(getDefaultFormStateForInputType(detected));
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [spec, formState.inputType, setFormState]);

  // Handle example selection
  const handleExampleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const example = getExample(e.target.value);
      if (example) {
        setSpec(example.spec);
        setFormState(getDefaultFormStateForInputType(example.inputType));
      }
    },
    [setFormState]
  );

  // Handle generation
  const handleGenerate = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let configToUse: any;

    if (mode === 'json') {
      // Parse JSON config using browser bundle's parseConfig
      try {
        // Access parseConfig from the dynamically loaded browser bundle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const codegenModule = (window as any).__codegen_module;
        if (!codegenModule?.parseConfig) {
          setUiError('Codegen bundle not loaded. Please wait and try again.');
          return;
        }
        configToUse = codegenModule.parseConfig(jsonCode, 'json');
      } catch (err) {
        console.error('[Playground] Config parse error:', err);
        setUiError(err instanceof Error ? err.message : 'Invalid JSON config');
        return;
      }
    } else {
      // Form mode - build config from form state
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

    await generate({
      spec,
      specFormat: configToUse.inputType,
      config: configToUse,
    });
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
        {/* Mobile-only segmented switcher (hidden via CSS at >768px) */}
        <div className={styles.mobileTabBar} role="tablist" aria-label="Playground sections">
          {(['spec', 'config', 'output'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={mobilePanel === p}
              className={clsx(styles.mobileTab, mobilePanel === p && styles.mobileTabActive)}
              onClick={() => setMobilePanel(p)}
            >
              {p === 'spec' ? 'Spec' : p === 'config' ? 'Config' : 'Output'}
            </button>
          ))}
        </div>

        {/* Input Panel */}
        <div className={clsx(styles.inputPanel, hideOnMobile('spec'))}>
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
              language={spec.trimStart().startsWith('{') ? 'json' : formState.inputType === 'jsonschema' ? 'json' : 'yaml'}
              schemaType={formState.inputType}
              placeholder="Paste your API specification here..."
              path={`inmemory://playground/spec.${
                spec.trimStart().startsWith('{') || formState.inputType === 'jsonschema'
                  ? 'json'
                  : 'yaml'
              }`}
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
          className={hideOnMobile('config')}
        />

        {/* Output Panel */}
        <OutputPanel
          files={files}
          isGenerating={isGenerating}
          loadingPhase={loadingPhase}
          errors={allErrors}
          onDownload={handleDownload}
          className={hideOnMobile('output')}
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
  );
}
