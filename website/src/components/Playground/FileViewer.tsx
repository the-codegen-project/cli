/**
 * Tabbed file viewer with Monaco editor.
 * Displays generated file content with syntax highlighting.
 */

import React, { useCallback } from 'react';
import Editor from './Editor';
import styles from './playground.module.css';

export interface FileViewerProps {
  /** Generated files (path → content) */
  files: Record<string, string>;
  /** List of open tab paths */
  openTabs: string[];
  /** Currently active tab path */
  activeTab: string | null;
  /** Set of pinned tab paths */
  pinnedTabs: Set<string>;
  /** Called when a tab is selected */
  onTabSelect: (path: string) => void;
  /** Called when a tab is closed */
  onTabClose: (path: string) => void;
  /** Called when a tab is double-clicked (pin) */
  onTabDoubleClick: (path: string) => void;
}

export default function FileViewer({
  files,
  openTabs,
  activeTab,
  pinnedTabs,
  onTabSelect,
  onTabClose,
  onTabDoubleClick,
}: FileViewerProps): JSX.Element {
  const content = activeTab ? files[activeTab] : '';

  const handleTabClose = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      onTabClose(path);
    },
    [onTabClose]
  );

  const getLanguage = (path: string): 'typescript' | 'json' | 'yaml' => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return 'json';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'typescript';
    }
  };

  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  if (openTabs.length === 0) {
    return (
      <div className={styles.fileViewerEmpty}>
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  return (
    <div className={styles.fileViewer}>
      <div className={styles.tabBar}>
        {openTabs.map((path) => {
          const isPinned = pinnedTabs.has(path);
          const isActive = path === activeTab;

          return (
            <div
              key={path}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${isPinned ? styles.pinned : ''}`}
              onClick={() => onTabSelect(path)}
              onDoubleClick={() => onTabDoubleClick(path)}
              title={path}
            >
              {isPinned && <span className={styles.pinDot} />}
              <span className={styles.tabName}>{getFileName(path)}</span>
              <button
                className={styles.tabClose}
                onClick={(e) => handleTabClose(e, path)}
                title="Close tab"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.fileContent}>
        {activeTab && (
          <Editor
            value={content}
            language={getLanguage(activeTab)}
            readOnly
            height="100%"
            path={`inmemory://playground/files/${activeTab}`}
          />
        )}
      </div>
    </div>
  );
}
