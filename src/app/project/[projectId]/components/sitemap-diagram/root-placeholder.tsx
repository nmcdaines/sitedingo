'use client';

import React from 'react';
import { useDropZoneHover } from './use-drop-zone-hover';
import { PagePlaceholder } from './page-placeholder';

interface RootPlaceholderProps {
  parentId: number | null;
  position: number;
}

/**
 * Component that renders a placeholder page in the root list when hovering over a drop zone
 * Must be used inside DragContext
 */
export function RootPlaceholder({ parentId, position }: RootPlaceholderProps) {
  const hoverInfo = useDropZoneHover();

  // Check if we should show a placeholder at this position
  const shouldShowPlaceholder = hoverInfo &&
    hoverInfo.parentId === parentId &&
    hoverInfo.position === position;

  if (!shouldShowPlaceholder || !hoverInfo) return null;

  return (
    <div
      className="relative"
      style={{
        flexShrink: 0,
        flexGrow: 0,
        width: "max-content",
        minWidth: "280px",
      }}
    >
      <div className="flex flex-col items-center relative group pb-12">
        <PagePlaceholder node={hoverInfo.draggedNode} />
      </div>
    </div>
  );
}
