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
import {
  registerSchema,
  setMonaco,
  unregisterSchema,
} from './monacoSchemaRegistry';

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
  /**
   * Stable model URI for this editor instance. Used both as the Monaco
   * model path and as the JSON schema's fileMatch entry, so each editor's
   * validation is partitioned by URI instead of clashing on the global
   * jsonDefaults singleton. If omitted, falls back to a deterministic
   * URI derived from schemaType.
   */
  path?: string;
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
  path,
}: EditorProps): JSX.Element {
  const { colorMode } = useColorMode();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);

  const resolvedPath =
    path ??
    (schemaType ? `inmemory://playground/${schemaType}.json` : undefined);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      setMonaco(monaco);

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
        // Render hover/suggest widgets into a body-level overflow root so
        // they aren't clipped by narrow panel ancestors (e.g. the 320px
        // Configuration panel) and float above sibling panels instead.
        fixedOverflowWidgets: true,
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

  // Register this editor's JSON schema with the singleton registry whenever
  // the relevant inputs change. The registry merges entries across all
  // <Editor> instances and scopes each schema's fileMatch to the editor's
  // own model URI, so editors no longer clobber each other's diagnostics.
  // Detects version from content; only applies to JSON content.
  useEffect(() => {
    if (!resolvedPath || !schemaType || language !== 'json') return;
    const schema = detectSchema(value, schemaType as SchemaType);
    if (!schema) return;
    const schemaUri = `file:///${schemaType}-schema.json`;
    registerSchema(resolvedPath, schemaUri, schema);
  }, [value, language, schemaType, resolvedPath]);

  // Remove this editor's entry from the registry on unmount (or when its
  // model URI changes), so stale schemas don't keep validating models
  // that no longer exist.
  useEffect(() => {
    if (!resolvedPath) return undefined;
    return () => {
      unregisterSchema(resolvedPath);
    };
  }, [resolvedPath]);

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
        path={resolvedPath}
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
