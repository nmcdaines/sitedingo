'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DropZoneProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DropZone({ id, children, className }: DropZoneProps) {
  const { setNodeRef, isOver, attributes } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        opacity: isOver ? 0.5 : 1,
        backgroundColor: isOver ? 'hsl(var(--primary) / 0.1)' : 'transparent',
      }}
      suppressHydrationWarning
      {...attributes}
    >
      {children}
    </div>
  );
}

