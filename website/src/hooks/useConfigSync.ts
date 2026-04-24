/**
 * Hook to sync config form state with JSON code.
 * Form mode generates JSON. JSON mode allows free editing.
 * Tracks manual edits to warn users before switching back to form mode.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ConfigFormState } from '../utils/configCodegen';
import { generateJsonConfig, getDefaultFormState, getDefaultJsonConfig } from '../utils/configCodegen';

export type ConfigMode = 'form' | 'json';

/**
 * Normalize code by removing all whitespace for comparison.
 * This allows us to detect meaningful changes while ignoring formatting.
 */
function normalizeForComparison(code: string): string {
  return code.replace(/\s+/g, '');
}

/**
 * Simple hash function for string comparison.
 * Uses djb2 algorithm for fast, reasonable distribution.
 */
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Compare two code strings by hashing their whitespace-stripped versions.
 */
function codeHashesMatch(code1: string, code2: string): boolean {
  return hashCode(normalizeForComparison(code1)) === hashCode(normalizeForComparison(code2));
}

export interface UseConfigSyncResult {
  /** Current form state */
  formState: ConfigFormState;
  /** Update form state (triggers JSON regeneration) */
  setFormState: (state: ConfigFormState) => void;
  /** Current JSON config code */
  jsonCode: string;
  /** Handle JSON code change */
  handleJsonChange: (code: string) => void;
  /** Current mode (form or json) */
  mode: ConfigMode;
  /** Switch between modes */
  setMode: (mode: ConfigMode) => void;
  /** Whether user has manually edited JSON code */
  hasManualEdits: boolean;
  /** Force switch to form mode, discarding manual edits */
  forceFormMode: () => void;
}

export function useConfigSync(): UseConfigSyncResult {
  const [formState, setFormStateInternal] = useState<ConfigFormState>(getDefaultFormState);
  const [jsonCode, setJsonCode] = useState<string>(getDefaultJsonConfig);
  const [mode, setMode] = useState<ConfigMode>('form');

  // Track the last generated JSON code (from form state)
  // This is used to detect manual edits
  const [generatedJsonCode, setGeneratedJsonCode] = useState<string>(getDefaultJsonConfig);

  // Check if current JSON code differs from what was generated
  const hasManualEdits = useMemo(() => {
    if (mode === 'form') return false;
    return !codeHashesMatch(jsonCode, generatedJsonCode);
  }, [mode, jsonCode, generatedJsonCode]);

  // When form state changes in form mode, regenerate JSON
  const setFormState = useCallback((state: ConfigFormState) => {
    setFormStateInternal(state);
    if (mode === 'form') {
      const generated = generateJsonConfig(state);
      setJsonCode(generated);
      setGeneratedJsonCode(generated);
    }
  }, [mode]);

  // When JSON changes, just store it (no parsing)
  const handleJsonChange = useCallback((code: string) => {
    setJsonCode(code);
  }, []);

  // Handle mode changes - only auto-regenerate when switching to form
  // if there are no manual edits (otherwise ConfigPanel handles confirmation)
  const handleSetMode = useCallback((newMode: ConfigMode) => {
    if (newMode === 'form' && mode === 'json') {
      // When switching to form mode, regenerate from form state
      const generated = generateJsonConfig(formState);
      setJsonCode(generated);
      setGeneratedJsonCode(generated);
    } else if (newMode === 'json' && mode === 'form') {
      // When switching to JSON mode, update the baseline
      const generated = generateJsonConfig(formState);
      setGeneratedJsonCode(generated);
    }
    setMode(newMode);
  }, [mode, formState]);

  // Force switch to form mode, explicitly discarding manual edits
  const forceFormMode = useCallback(() => {
    const generated = generateJsonConfig(formState);
    setJsonCode(generated);
    setGeneratedJsonCode(generated);
    setMode('form');
  }, [formState]);

  return {
    formState,
    setFormState,
    jsonCode,
    handleJsonChange,
    mode,
    setMode: handleSetMode,
    hasManualEdits,
    forceFormMode,
  };
}
