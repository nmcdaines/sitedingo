'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useSitemapDiagram } from './sitemap-diagram-context';
import { Input } from '@/components/ui/input';

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
  isSelected?: boolean;
  onSelect?: (section: Section) => void;
}

export function SectionNode({ section, pageId, isDragging, isSelected, onSelect }: SectionNodeProps) {
  const { activeSectionId, setActiveSectionId, updateSection } = useSitemapDiagram();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.name || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectedValue = isSelected !== undefined ? isSelected : activeSectionId === `section-${section.id}`;

  useEffect(() => {
    setEditValue(section.name || '');
  }, [section.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    disabled: isEditing,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(section);
    setActiveSectionId(`section-${section.id}`);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    const trimmedValue = editValue.trim();
    if (trimmedValue !== (section.name || '')) {
      await updateSection(section.id, { name: trimmedValue || null });
    } else {
      setEditValue(section.name || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(section.name || '');
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "relative rounded border p-2 text-xs transition-all",
        isDragging && "opacity-50 scale-105",
        isSelectedValue && "border-primary bg-primary/10 ring-2 ring-primary/20",
        !isSelectedValue && "border-border bg-muted/50"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs px-1"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className={cn(
            "font-medium cursor-pointer select-none",
            isSelectedValue ? "text-primary" : "text-muted-foreground"
          )}
          {...listeners}
        >
          {section.name || section.componentType}
        </div>
      )}
    </div>
  );
}

