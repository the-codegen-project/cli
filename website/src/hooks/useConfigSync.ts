/**
 * Hook to sync config form state with TypeScript code.
 * Provides bidirectional sync between visual form and code editor.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ConfigFormState } from '../utils/configCodegen';
import { generateTsConfig, getDefaultFormState, getDefaultTsConfig } from '../utils/configCodegen';
import { parseTsConfig } from '../utils/configParser';

export type ConfigMode = 'form' | 'typescript';

export interface UseConfigSyncResult {
  /** Current form state */
  formState: ConfigFormState;
  /** Update form state (triggers TS regeneration) */
  setFormState: (state: ConfigFormState) => void;
  /** Current TypeScript config code */
  tsCode: string;
  /** Handle TypeScript code change (parses back to form) */
  handleTsChange: (code: string) => void;
  /** Current mode (form or typescript) */
  mode: ConfigMode;
  /** Switch between modes */
  setMode: (mode: ConfigMode) => void;
  /** Parse error if TypeScript is invalid */
  parseError: string | null;
}

export function useConfigSync(): UseConfigSyncResult {
  const [formState, setFormStateInternal] = useState<ConfigFormState>(getDefaultFormState);
  const [tsCode, setTsCode] = useState<string>(getDefaultTsConfig);
  const [mode, setMode] = useState<ConfigMode>('form');
  const [parseError, setParseError] = useState<string | null>(null);

  // When form state changes in form mode, regenerate TypeScript
  const setFormState = useCallback((state: ConfigFormState) => {
    setFormStateInternal(state);
    if (mode === 'form') {
      setTsCode(generateTsConfig(state));
      setParseError(null);
    }
  }, [mode]);

  // When TypeScript changes, try to parse back to form
  const handleTsChange = useCallback((code: string) => {
    setTsCode(code);

    const result = parseTsConfig(code);
    if (result.success && result.data) {
      setFormStateInternal(result.data);
      setParseError(null);
    } else {
      // Keep old form state, show error
      setParseError(result.error || 'Invalid config');
    }
  }, []);

  // When switching modes, sync state
  useEffect(() => {
    if (mode === 'form') {
      // Regenerate TypeScript from form state
      setTsCode(generateTsConfig(formState));
      setParseError(null);
    }
    // When switching to TypeScript mode, keep current code
  }, [mode]);

  return {
    formState,
    setFormState,
    tsCode,
    handleTsChange,
    mode,
    setMode,
    parseError,
  };
}
