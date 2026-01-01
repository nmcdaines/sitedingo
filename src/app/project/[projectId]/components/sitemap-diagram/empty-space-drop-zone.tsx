'use client';

import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { useMemo } from 'react';

interface EmptySpaceDropZoneProps {
  parentId: number | null;
  position: number;
  type: 'page' | 'section';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isVisible?: boolean;
  className?: string;
}

export function EmptySpaceDropZone({
  parentId,
  position,
  type,
  width = 280,
  height = 60,
  isVisible = false,
  className = '',
}: EmptySpaceDropZoneProps) {
  // Generate ID internally from parentId and position
  const id = useMemo(() => {
    if (type === 'page') {
      return `reorder-${parentId ?? 'root'}-${position}`;
    } else {
      // For sections, we'd use a different pattern if needed
      // For now, sections use SectionDropZone, but keeping this for consistency
      return `reorder-section-${parentId ?? 'root'}-${position}`;
    }
  }, [parentId, position, type]);

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id,
    data: {
      type: 'empty-space',
      expectedType: type,
      parentId,
      position,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(`w-full relative transition-all duration-200 flex items-center justify-center drop-zone ${
        isVisible ? (isOver ? 'opacity-100' : 'opacity-60') : 'opacity-0'
      } ${
        isOver
          ? 'bg-primary/40 border-2 border-solid border-primary shadow-xl rounded-lg'
          : 'bg-primary/20 border-2 border-dashed border-primary/70 rounded-lg'
      }`, className)}
      style={{
        minHeight: height,
        minWidth: width,
        // width: '100%',
        pointerEvents: isVisible ? 'auto' : 'none',
        zIndex: isOver ? 20 : 5,
        // position: 'relative',
      }}
    >
      {isOver ? (
        <div className="flex items-center h-full">
          <div className="w-1 h-full bg-gray-600 rounded-full shadow-lg animate-pulse mr-auto ml-0 -translate-x-1/2" />
          {/* <span className="text-sm font-medium text-primary">Drop here to reorder</span> */}
        </div>
      ) : (
        <div className="flex items-center bg-red-600/50 h-full">
          {/* <div className="w-1.5 h-10 bg-primary/60 rounded-full" /> */}
          {/* <span className="text-xs text-primary/70">Drop zone</span> */}
        </div>
      )}
    </div>
  );
}

