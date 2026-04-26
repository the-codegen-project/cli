/**
 * Output panel with split layout (FileTree + FileViewer).
 * Displays generated files with VSCode-like explorer.
 */

import React, { useCallback } from 'react';
import clsx from 'clsx';
import { useFileExplorer } from '../../hooks/useFileExplorer';
import type { LoadingPhase } from '../../hooks/useCodegen';
import FileTree from './FileTree';
import FileViewer from './FileViewer';
import styles from './playground.module.css';

/** Phase messages for progress indication */
const phaseMessages: Record<LoadingPhase, string> = {
  'idle': '',
  'loading-bundle': 'Loading codegen engine...',
  'parsing-spec': 'Parsing specification...',
  'generating': 'Generating code...',
  'complete': 'Complete!',
};

export interface OutputPanelProps {
  /** Generated files (path → content) */
  files: Record<string, string>;
  /** Whether generation is in progress */
  isGenerating?: boolean;
  /** Current loading phase */
  loadingPhase?: LoadingPhase;
  /** Error messages */
  errors?: string[];
  /** Called when download is requested */
  onDownload?: () => void;
  /** Optional extra className applied to the root element */
  className?: string;
}

export default function OutputPanel({
  files,
  isGenerating = false,
  loadingPhase = 'idle',
  errors = [],
  onDownload,
  className,
}: OutputPanelProps): JSX.Element {
  const {
    tree,
    selectedFile,
    openTabs,
    activeTab,
    pinnedTabs,
    expandedFolders,
    openFile,
    pinTab,
    closeTab,
    toggleFolder,
  } = useFileExplorer(files);

  const handleFileClick = useCallback(
    (path: string) => {
      openFile(path);
    },
    [openFile]
  );

  const handleFileDoubleClick = useCallback(
    (path: string) => {
      openFile(path);
      pinTab(path);
    },
    [openFile, pinTab]
  );

  const fileCount = Object.keys(files).length;

  const showOverlay = loadingPhase !== 'idle' || isGenerating;

  return (
    <div className={clsx(styles.outputPanel, className)}>
      <div className={styles.outputHeader}>
        <span className={styles.panelTitle}>
          Output
          {fileCount > 0 && (
            <span className={styles.fileCount}>({fileCount} files)</span>
          )}
        </span>
      </div>

      {errors.length > 0 && (
        <div className={styles.errorList}>
          {errors.map((error, i) => (
            <div key={i} className={styles.errorItem}>
              {error}
            </div>
          ))}
        </div>
      )}

      <div className={styles.outputContentWrapper}>
        {showOverlay && (
          <div className={styles.generatingOverlay}>
            <div className={styles.spinner} />
            <span>{phaseMessages[loadingPhase] || 'Generating...'}</span>
          </div>
        )}

        <div className={styles.outputContent}>
          <div className={styles.fileTreePanel}>
            <FileTree
              tree={tree}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onFileClick={handleFileClick}
              onFileDoubleClick={handleFileDoubleClick}
              onFolderToggle={toggleFolder}
            />
          </div>

          <div className={styles.fileViewerPanel}>
            <FileViewer
              files={files}
              openTabs={openTabs}
              activeTab={activeTab}
              pinnedTabs={pinnedTabs}
              onTabSelect={openFile}
              onTabClose={closeTab}
              onTabDoubleClick={pinTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
