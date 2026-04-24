/**
 * Config panel with dual-mode toggle (Form / JSON).
 * Syncs state between visual form and code editor.
 * Warns users before discarding manual JSON edits.
 */

import React, { useState, useCallback } from 'react';
import type { ConfigMode } from '../../hooks/useConfigSync';
import type { ConfigFormState } from '../../utils/configCodegen';
import ConfigForm from './ConfigForm';
import ConfigEditor from './ConfigEditor';
import styles from './playground.module.css';

export interface ConfigPanelProps {
  /** Current form state */
  formState: ConfigFormState;
  /** Update form state */
  onFormStateChange: (state: ConfigFormState) => void;
  /** JSON config code */
  jsonCode: string;
  /** Handle JSON code change */
  onJsonCodeChange: (code: string) => void;
  /** Current mode */
  mode: ConfigMode;
  /** Switch between modes */
  onModeChange: (mode: ConfigMode) => void;
  /** Whether user has manually edited JSON code */
  hasManualEdits: boolean;
  /** Force switch to form mode, discarding manual edits */
  onForceFormMode: () => void;
}

export default function ConfigPanel({
  formState,
  onFormStateChange,
  jsonCode,
  onJsonCodeChange,
  mode,
  onModeChange,
  hasManualEdits,
  onForceFormMode,
}: ConfigPanelProps): JSX.Element {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFormModeClick = useCallback(() => {
    if (mode === 'json' && hasManualEdits) {
      setShowConfirmDialog(true);
    } else {
      onModeChange('form');
    }
  }, [mode, hasManualEdits, onModeChange]);

  const handleConfirmReset = useCallback(() => {
    setShowConfirmDialog(false);
    onForceFormMode();
  }, [onForceFormMode]);

  const handleCancelReset = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <span className={styles.panelTitle}>Configuration</span>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${mode === 'form' ? styles.active : ''}`}
            onClick={handleFormModeClick}
            title="Visual form mode"
          >
            Form
          </button>
          <button
            className={`${styles.modeButton} ${mode === 'json' ? styles.active : ''}`}
            onClick={() => onModeChange('json')}
            title="JSON code mode"
          >
            JSON
          </button>
        </div>
      </div>

      <div className={styles.configContent}>
        {mode === 'form' ? (
          <ConfigForm
            formState={formState}
            onFormStateChange={onFormStateChange}
          />
        ) : (
          <ConfigEditor
            value={jsonCode}
            onChange={onJsonCodeChange}
          />
        )}
      </div>

      {showConfirmDialog && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmTitle}>Reset Configuration?</div>
            <p className={styles.confirmMessage}>
              You have manually edited the JSON configuration.
              Switching to Form mode will reset it to match the form settings.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancel}
                onClick={handleCancelReset}
              >
                Stay on JSON
              </button>
              <button
                className={styles.confirmReset}
                onClick={handleConfirmReset}
              >
                Reset to Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
