/**
 * Download button component.
 * Creates a ZIP archive of generated files.
 */

import React, { useCallback, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import styles from './playground.module.css';

export interface DownloadButtonProps {
  /** Generated files (path → content) */
  files: Record<string, string>;
  /** Optional config content to include */
  configContent?: string;
  /** Optional spec content to include */
  specContent?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Determine if content is JSON or YAML.
 */
function isJsonContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

export default function DownloadButton({
  files,
  configContent,
  specContent,
  disabled = false,
}: DownloadButtonProps): JSX.Element {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (Object.keys(files).length === 0) return;

    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // Add generated files
      for (const [path, content] of Object.entries(files)) {
        zip.file(path, content);
      }

      // Add config file if provided
      if (configContent) {
        zip.file('codegen.json', configContent);
      }

      // Add spec file if provided
      if (specContent) {
        const specExt = isJsonContent(specContent) ? 'json' : 'yaml';
        zip.file(`spec.${specExt}`, specContent);
      }

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'codegen-output.zip');
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [files, configContent, specContent]);

  const fileCount = Object.keys(files).length;

  return (
    <button
      className={styles.downloadButton}
      onClick={handleDownload}
      disabled={disabled || fileCount === 0 || isDownloading}
      title={fileCount === 0 ? 'Generate files first' : `Download ${fileCount} files as ZIP`}
    >
      {isDownloading ? 'Creating ZIP...' : '↓ Download ZIP'}
    </button>
  );
}
