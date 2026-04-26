/**
 * JSON config editor for advanced users.
 * Features Monaco editor with built-in JSON validation.
 */

import React from 'react';
import Editor from './Editor';
import styles from './playground.module.css';

export interface ConfigEditorProps {
  /** JSON config code */
  value: string;
  /** Called when code changes */
  onChange: (value: string) => void;
}

export default function ConfigEditor({
  value,
  onChange,
}: ConfigEditorProps): JSX.Element {
  return (
    <div className={styles.configEditor}>
      <Editor
        value={value}
        onChange={onChange}
        language="json"
        height="100%"
        placeholder="// Configure your generators here..."
        schemaType="configuration"
        path="inmemory://playground/configuration.json"
      />
    </div>
  );
}
