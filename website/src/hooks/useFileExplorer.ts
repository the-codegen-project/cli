/**
 * Hook to manage file explorer state.
 * Handles file tree navigation, tabs, and selection.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface UseFileExplorerResult {
  /** File tree structure */
  tree: TreeNode | null;
  /** Currently selected file in tree */
  selectedFile: string | null;
  /** List of open tab paths */
  openTabs: string[];
  /** Currently active tab */
  activeTab: string | null;
  /** Set of pinned tab paths */
  pinnedTabs: Set<string>;
  /** Set of expanded folder paths */
  expandedFolders: Set<string>;
  /** Open a file (adds to tabs if not open) */
  openFile: (path: string) => void;
  /** Pin a tab (prevents auto-close) */
  pinTab: (path: string) => void;
  /** Close a tab */
  closeTab: (path: string) => void;
  /** Toggle folder expanded state */
  toggleFolder: (path: string) => void;
  /** Expand all folders */
  expandAll: () => void;
  /** Collapse all folders */
  collapseAll: () => void;
}

/**
 * Normalize a file path by removing leading ./ and extra slashes.
 */
function normalizePath(path: string): string {
  // Remove leading ./ or ./
  let normalized = path.replace(/^\.\/+/, '');
  // Remove any double slashes
  normalized = normalized.replace(/\/+/g, '/');
  // Remove leading slash
  normalized = normalized.replace(/^\//, '');
  return normalized;
}

/**
 * Build a tree structure from flat file map.
 */
export function buildFileTree(files: Record<string, string>): TreeNode | null {
  const paths = Object.keys(files).sort();

  if (paths.length === 0) {
    return null;
  }

  const root: TreeNode = {
    name: 'generated',
    path: '',
    type: 'folder',
    children: [],
  };

  for (const rawFilePath of paths) {
    // Normalize the path to remove leading ./ and fix double slashes
    const filePath = normalizePath(rawFilePath);
    if (!filePath) continue; // Skip empty paths

    const parts = filePath.split('/').filter(Boolean);
    if (parts.length === 0) continue; // Skip if no valid parts

    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isFile) {
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: filePath, // Use normalized path
          type: 'file',
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(
          (c) => c.type === 'folder' && c.name === part
        );

        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          current.children.push(folder);
        }

        current = folder;
      }
    }
  }

  // Sort children: folders first, then files, alphabetically
  sortTree(root);

  return root;
}

function sortTree(node: TreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    if (child.type === 'folder') {
      sortTree(child);
    }
  }
}

/**
 * Get all folder paths from a tree.
 * Includes the root folder (empty path) so it can be expanded.
 */
function getAllFolderPaths(node: TreeNode | null): string[] {
  if (!node) return [];

  const paths: string[] = [];

  function traverse(n: TreeNode): void {
    // Include ALL folders, even root with empty path
    if (n.type === 'folder') {
      paths.push(n.path);
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return paths;
}

export function useFileExplorer(
  files: Record<string, string>
): UseFileExplorerResult {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [pinnedTabs, setPinnedTabs] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree from files
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Track previous file keys to detect new generations
  const prevFileKeysRef = useRef<string>('');

  // Auto-open first file and expand folders when files change
  useEffect(() => {
    const paths = Object.keys(files);
    const fileKeys = paths.sort().join('|');

    // Only act if files actually changed (new generation) and tree is ready
    if (paths.length > 0 && tree && fileKeys !== prevFileKeysRef.current) {
      prevFileKeysRef.current = fileKeys;

      // Find a good default file to open
      const indexFile = paths.find((p) => p.endsWith('index.ts'));
      const firstFile = indexFile || paths[0];
      openFile(firstFile);

      // Always expand all folders on new generation
      setExpandedFolders(new Set(getAllFolderPaths(tree)));
    }
  }, [files, tree]);

  const openFile = useCallback(
    (path: string) => {
      if (!openTabs.includes(path)) {
        // Find unpinned preview tab to replace
        const unpinnedPreview = openTabs.find((t) => !pinnedTabs.has(t));

        if (unpinnedPreview && openTabs.length > 0 && !pinnedTabs.has(unpinnedPreview)) {
          // Replace the unpinned preview tab
          setOpenTabs((tabs) =>
            tabs.map((t) => (t === unpinnedPreview ? path : t))
          );
        } else {
          // Add new tab
          setOpenTabs((tabs) => [...tabs, path]);
        }
      }

      setActiveTab(path);
      setSelectedFile(path);
    },
    [openTabs, pinnedTabs]
  );

  const pinTab = useCallback((path: string) => {
    setPinnedTabs((pins) => {
      const next = new Set(pins);
      next.add(path);
      return next;
    });
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((tabs) => tabs.filter((t) => t !== path));
      setPinnedTabs((pins) => {
        const next = new Set(pins);
        next.delete(path);
        return next;
      });

      // Switch to adjacent tab
      if (activeTab === path) {
        const currentTabs = openTabs.filter((t) => t !== path);
        const idx = openTabs.indexOf(path);
        setActiveTab(currentTabs[idx - 1] || currentTabs[idx] || null);
      }
    },
    [openTabs, activeTab]
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((folders) => {
      const next = new Set(folders);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedFolders(new Set(getAllFolderPaths(tree)));
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  return {
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
    expandAll,
    collapseAll,
  };
}
