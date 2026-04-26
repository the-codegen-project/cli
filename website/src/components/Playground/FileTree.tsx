/**
 * VSCode-like file tree component.
 * Displays generated files in a collapsible folder structure.
 */

import React, { useCallback } from 'react';
import type { TreeNode } from '../../hooks/useFileExplorer';
import FileIcon from './FileIcon';
import styles from './playground.module.css';

export interface FileTreeProps {
  /** Root tree node */
  tree: TreeNode | null;
  /** Currently selected file path */
  selectedFile: string | null;
  /** Set of expanded folder paths */
  expandedFolders: Set<string>;
  /** Called when a file is clicked */
  onFileClick: (path: string) => void;
  /** Called when a file is double-clicked (pin tab) */
  onFileDoubleClick: (path: string) => void;
  /** Called when a folder is toggled */
  onFolderToggle: (path: string) => void;
}

export default function FileTree({
  tree,
  selectedFile,
  expandedFolders,
  onFileClick,
  onFileDoubleClick,
  onFolderToggle,
}: FileTreeProps): JSX.Element {
  if (!tree) {
    return (
      <div className={styles.fileTreeEmpty}>
        No files generated yet
      </div>
    );
  }

  return (
    <div className={styles.fileTree}>
      <TreeNodeComponent
        node={tree}
        depth={0}
        selectedFile={selectedFile}
        expandedFolders={expandedFolders}
        onFileClick={onFileClick}
        onFileDoubleClick={onFileDoubleClick}
        onFolderToggle={onFolderToggle}
      />
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  onFileClick: (path: string) => void;
  onFileDoubleClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
}

function TreeNodeComponent({
  node,
  depth,
  selectedFile,
  expandedFolders,
  onFileClick,
  onFileDoubleClick,
  onFolderToggle,
}: TreeNodeComponentProps): JSX.Element {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = node.path === selectedFile;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.type === 'folder') {
        onFolderToggle(node.path);
      } else {
        onFileClick(node.path);
      }
    },
    [node, onFileClick, onFolderToggle]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.type === 'file') {
        onFileDoubleClick(node.path);
      }
    },
    [node, onFileDoubleClick]
  );

  // Add extra padding for files to account for missing chevron (16px chevron + 4px gap)
  const chevronOffset = node.type === 'file' ? 20 : 0;
  const paddingLeft = depth * 12 + 8 + chevronOffset;

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.treeNodeRow} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={node.type === 'folder' ? isExpanded : undefined}
      >
        {node.type === 'folder' && (
          <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
            <ChevronIcon />
          </span>
        )}
        <FileIcon
          name={node.name}
          isFolder={node.type === 'folder'}
          isExpanded={isExpanded}
        />
        <span className={styles.fileName}>{node.name}</span>
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div className={styles.treeChildren}>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onFileClick={onFileClick}
              onFileDoubleClick={onFileDoubleClick}
              onFolderToggle={onFolderToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon(): JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 2L7 5L3 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
