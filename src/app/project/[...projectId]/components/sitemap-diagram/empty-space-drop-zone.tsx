'use client';

import { useDroppable } from '@dnd-kit/core';
import { TreeNode } from '../../lib/tree-utils';

interface EmptySpaceDropZoneProps {
  id: string;
  parentId: number | null;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible?: boolean;
}

export function EmptySpaceDropZone({
  id,
  parentId,
  position,
  x,
  y,
  width,
  height,
  isVisible = false,
}: EmptySpaceDropZoneProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id,
    data: {
      type: 'empty-space',
      parentId,
      position,
    },
  });

  return (
    <foreignObject
      ref={setNodeRef}
      x={x}
      y={y}
      width={width}
      height={height}
      style={{
        pointerEvents: 'all',
        opacity: isVisible ? (isOver ? 0.8 : 0.4) : 0,
        zIndex: isOver ? 10 : 1,
      }}
      suppressHydrationWarning
    >
      <div
        className={`w-full h-full transition-all duration-200 flex items-center justify-center ${
          isOver
            ? 'bg-primary/30 border-2 border-dashed border-primary shadow-lg rounded'
            : 'bg-primary/10 border-2 border-dashed border-primary/50 rounded'
        }`}
        style={{
          minHeight: height,
        }}
      >
        {isOver ? (
          <div className="w-2 h-12 bg-primary rounded-full shadow-md" />
        ) : (
          <div className="w-1 h-8 bg-primary/50 rounded-full" />
        )}
      </div>
    </foreignObject>
  );
}

