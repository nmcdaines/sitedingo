'use client';

import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface EmptySpaceDropZoneProps {
  id: string;
  parentId: number | null;
  position: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isVisible?: boolean;
  className?: string;
}

export function EmptySpaceDropZone({
  id,
  parentId,
  position,
  width = 280,
  height = 60,
  isVisible = false,
  className = '',
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
        <div className="flex items-center gap-2">
          <div className="w-3 h-16 bg-primary rounded-full shadow-lg animate-pulse" />
          <span className="text-sm font-medium text-primary">Drop here to reorder</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-red-600/50">
          <div className="w-1.5 h-10 bg-primary/60 rounded-full" />
          <span className="text-xs text-primary/70">Drop zone</span>
        </div>
      )}
    </div>
  );
}

