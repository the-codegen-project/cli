/**
 * File type icons for the file tree.
 * Uses simple SVG icons based on file extension.
 */

import React from 'react';

export interface FileIconProps {
  /** File name or path */
  name: string;
  /** Whether this is a folder */
  isFolder?: boolean;
  /** Whether folder is expanded */
  isExpanded?: boolean;
  /** Icon size in pixels */
  size?: number;
}

export default function FileIcon({
  name,
  isFolder = false,
  isExpanded = false,
  size = 16,
}: FileIconProps): JSX.Element {
  if (isFolder) {
    return isExpanded ? (
      <FolderOpenIcon size={size} />
    ) : (
      <FolderIcon size={size} />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <TypeScriptIcon size={size} />;
    case 'json':
      return <JsonIcon size={size} />;
    case 'yaml':
    case 'yml':
      return <YamlIcon size={size} />;
    default:
      return <FileDefaultIcon size={size} />;
  }
}

function FolderIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 3.5C1.5 2.94772 1.94772 2.5 2.5 2.5H6.29289L7.5 3.70711V3.5H13.5C14.0523 3.5 14.5 3.94772 14.5 4.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V3.5Z"
        fill="#DCAD5A"
      />
    </svg>
  );
}

function FolderOpenIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 3.5C1.5 2.94772 1.94772 2.5 2.5 2.5H6.29289L7.5 3.70711V3.5H13.5C14.0523 3.5 14.5 3.94772 14.5 4.5V5.5H3L1.5 12.5V3.5Z"
        fill="#DCAD5A"
      />
      <path
        d="M2 6.5H14L12.5 13.5H0.5L2 6.5Z"
        fill="#E8C36C"
      />
    </svg>
  );
}

function TypeScriptIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="14" height="14" rx="2" fill="#3178C6" />
      <path
        d="M5 8H9M7 8V12M10 8.5C10 8.5 10.5 8 11.5 8C12.5 8 13 8.5 13 9.25C13 10.5 10 10.5 10 12C10 12.5 10.5 13 11.5 13C12.5 13 13 12.5 13 12.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JsonIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="14" height="14" rx="2" fill="#F5A623" />
      <path
        d="M5 5C5 4.5 5.5 4 6 4M6 4C6.5 4 7 4.5 7 5V6.5C7 7 7.5 7.5 8 7.5M6 4V7C6 7.5 5.5 8 5 8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M11 5C11 4.5 10.5 4 10 4M10 4C9.5 4 9 4.5 9 5V6.5C9 7 8.5 7.5 8 7.5M10 4V7C10 7.5 10.5 8 11 8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M5 11C5 11.5 5.5 12 6 12M6 12C6.5 12 7 11.5 7 11V9.5C7 9 7.5 8.5 8 8.5M6 12V9C6 8.5 5.5 8 5 8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M11 11C11 11.5 10.5 12 10 12M10 12C9.5 12 9 11.5 9 11V9.5C9 9 8.5 8.5 8 8.5M10 12V9C10 8.5 10.5 8 11 8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function YamlIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="14" height="14" rx="2" fill="#CB171E" />
      <path
        d="M4 5L6 8V11M8 5L6 8M10 5V8L12 5M10 8V11"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileDefaultIcon({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 2C3 1.44772 3.44772 1 4 1H9L13 5V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z"
        fill="#909090"
      />
      <path d="M9 1V5H13L9 1Z" fill="#B8B8B8" />
    </svg>
  );
}
