'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Section {
  id: number;
  componentType: string;
  name: string | null;
  metadata: any;
  sortOrder: number;
}

interface SectionNodeProps {
  section: Section;
  pageId: number;
  isDragging?: boolean;
}

export function SectionNode({ section, pageId, isDragging }: SectionNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: `section-${section.id}`,
    data: {
      type: 'section',
      section,
      pageId,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "relative rounded border border-border bg-muted/50 p-2 text-xs transition-opacity",
        isDragging && "opacity-50 scale-105"
      )}
    >
      <div
        className="font-medium text-muted-foreground cursor-grab active:cursor-grabbing"
        {...listeners}
      >
        {section.name || section.componentType}
      </div>
    </div>
  );
}

