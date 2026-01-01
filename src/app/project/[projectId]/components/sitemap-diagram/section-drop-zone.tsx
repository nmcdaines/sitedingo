'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface SectionDropZoneProps {
  id: string;
  pageId: number;
  position: number;
  isVisible?: boolean;
}

export function SectionDropZone({ id, pageId, position, isVisible = false }: SectionDropZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    data: {
      type: 'section-drop-zone',
      pageId,
      position,
    },
  });

  const isActiveElementSection = useMemo(() => {
    return active?.id.toString().startsWith('section-');
  }, [active?.id]);

  // Always render the drop zone (for drag detection) but make it invisible when not needed
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded transition-all pointer-events-auto",
        "absolute h-4 bg-red-500/0",
        "flex items-center justify-center"
      )}
      style={{
        minHeight: "0px",
        zIndex: 1000,
        height: "24px",
        right: 0,
        left: 0,
        transform: "translateY(-75%)",
      }}
    >
      {isOver && isActiveElementSection && (
        <div className="h-1 bg-gray-600 rounded-full ml-2 mr-2 w-full" />
      )}
    </div>
  );
}

