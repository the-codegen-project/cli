/**
 * Monaco editor wrapper component.
 * Handles theme, language detection, and common editor options.
 * Supports JSON Schema validation for JSON content.
 * Note: YAML autocomplete is not supported due to bundler limitations.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import MonacoEditor, { OnMount, OnChange } from '@monaco-editor/react';
import { useColorMode } from '@docusaurus/theme-common';
import type { editor } from 'monaco-editor';
import { detectSchema, type SchemaType } from '../../schemas';

export interface EditorProps {
  /** Editor content */
  value: string;
  /** Called when content changes */
  onChange?: (value: string) => void;
  /** Language for syntax highlighting */
  language?: 'typescript' | 'json' | 'yaml' | 'javascript';
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Height of the editor */
  height?: string | number;
  /** Called when editor mounts */
  onMount?: OnMount;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Additional class name */
  className?: string;
  /** Schema type for JSON validation */
  schemaType?: 'asyncapi' | 'openapi' | 'jsonschema' | 'configuration';
}

export default function Editor({
  value,
  onChange,
  language = 'typescript',
  readOnly = false,
  height = '100%',
  onMount,
  placeholder,
  className,
  schemaType,
}: EditorProps): JSX.Element {
  const { colorMode } = useColorMode();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Configure editor options
      editor.updateOptions({
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        // Enable markdown rendering in hover widgets
        hover: {
          enabled: true,
          delay: 300,
        },
      });

      // Call custom onMount if provided
      onMount?.(editor, monaco);
    },
    [onMount]
  );

  // Track the last configured schema to avoid reconfiguring on every keystroke
  const lastSchemaRef = useRef<{ type: string; schema: object } | null>(null);

  // Configure JSON schema when schemaType changes
  // Detects version from content and uses appropriate local schema
  // Note: Only works for JSON content, not YAML
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !schemaType || language !== 'json') return;

    // Detect the appropriate schema based on content and type
    const schema = detectSchema(value, schemaType as SchemaType);
    if (!schema) return;

    // Skip if schema hasn't changed
    if (
      lastSchemaRef.current &&
      lastSchemaRef.current.type === schemaType &&
      lastSchemaRef.current.schema === schema
    ) {
      return;
    }

    lastSchemaRef.current = { type: schemaType, schema };
    const schemaUri = `file:///${schemaType}-schema.json`;

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: false,
      schemas: [
        {
          uri: schemaUri,
          fileMatch: ['*'],
          schema,
        },
      ],
    });
  }, [value, language, schemaType]);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange?.(newValue || '');
    },
    [onChange]
  );

  // Show placeholder if value is empty
  const showPlaceholder = !value && placeholder;

  return (
    <div className={className} style={{ position: 'relative', height }}>
      {showPlaceholder && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 60, // Account for line numbers
            color: 'var(--ifm-color-emphasis-500)',
            pointerEvents: 'none',
            zIndex: 1,
            padding: '0 12px',
            fontFamily: 'monospace',
            fontSize: 14,
            lineHeight: '19px',
          }}
        >
          {placeholder}
        </div>
      )}
      <MonacoEditor
        value={value}
        onChange={handleChange}
        language={language}
        theme={colorMode === 'dark' ? 'vs-dark' : 'light'}
        height={height}
        onMount={handleMount}
        options={{
          readOnly,
          domReadOnly: readOnly,
        }}
      />
    </div>
  );
}
