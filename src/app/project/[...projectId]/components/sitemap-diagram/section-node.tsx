'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useSitemapDiagram } from './sitemap-diagram-context';
import { Input } from '@/components/ui/input';

interface Section {
  id: number;
  componentType: string;
  name: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
}

interface SectionNodeProps {
  section: Section;
  pageId: number;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (section: Section) => void;
}

function SectionNodeComponent({ section, pageId, isDragging, isSelected, onSelect }: SectionNodeProps) {
  const { activeSectionId, setActiveSectionId, updateSection } = useSitemapDiagram();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.name || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectedValue = isSelected !== undefined ? isSelected : activeSectionId === `section-${section.id}`;
  const prevSectionNameRef = useRef(section.name);

  // Update edit value when section name changes (only if not currently editing)
  // Use setTimeout to avoid synchronous setState in effect
  useEffect(() => {
    if (!isEditing && prevSectionNameRef.current !== section.name) {
      prevSectionNameRef.current = section.name;
      const timeout = setTimeout(() => {
        setEditValue(section.name || '');
      }, 0);
      return () => clearTimeout(timeout)
    }
  }, [section.name, isEditing]);

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

  // Memoize style to prevent unnecessary re-renders
  const style = useMemo(() => {
    if (!transform) return undefined;
    return {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      willChange: 'transform', // Optimize for hardware acceleration
    };
  }, [transform]);

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

  // Format component type for display (capitalize first letter)
  const formatComponentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get color classes for component type badge
  const getBadgeColors = (type: string, isSelected: boolean) => {
    const colorMap: Record<string, { bg: string; text: string; selectedBg: string; selectedText: string }> = {
      hero: { bg: 'bg-blue-500/20', text: 'text-blue-600', selectedBg: 'bg-blue-500/30', selectedText: 'text-blue-700' },
      text: { bg: 'bg-gray-500/20', text: 'text-gray-600', selectedBg: 'bg-gray-500/30', selectedText: 'text-gray-700' },
      features: { bg: 'bg-purple-500/20', text: 'text-purple-600', selectedBg: 'bg-purple-500/30', selectedText: 'text-purple-700' },
      testimonials: { bg: 'bg-green-500/20', text: 'text-green-600', selectedBg: 'bg-green-500/30', selectedText: 'text-green-700' },
      cta: { bg: 'bg-orange-500/20', text: 'text-orange-600', selectedBg: 'bg-orange-500/30', selectedText: 'text-orange-700' },
      gallery: { bg: 'bg-pink-500/20', text: 'text-pink-600', selectedBg: 'bg-pink-500/30', selectedText: 'text-pink-700' },
      pricing: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', selectedBg: 'bg-yellow-500/30', selectedText: 'text-yellow-700' },
      faq: { bg: 'bg-indigo-500/20', text: 'text-indigo-600', selectedBg: 'bg-indigo-500/30', selectedText: 'text-indigo-700' },
      contact: { bg: 'bg-red-500/20', text: 'text-red-600', selectedBg: 'bg-red-500/30', selectedText: 'text-red-700' },
      footer: { bg: 'bg-slate-500/20', text: 'text-slate-600', selectedBg: 'bg-slate-500/30', selectedText: 'text-slate-700' },
      header: { bg: 'bg-cyan-500/20', text: 'text-cyan-600', selectedBg: 'bg-cyan-500/30', selectedText: 'text-cyan-700' },
      navigation: { bg: 'bg-teal-500/20', text: 'text-teal-600', selectedBg: 'bg-teal-500/30', selectedText: 'text-teal-700' },
    };

    const colors = colorMap[type.toLowerCase()] || {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      selectedBg: 'bg-primary/20',
      selectedText: 'text-primary',
    };

    return isSelected
      ? `${colors.selectedBg} ${colors.selectedText}`
      : `${colors.bg} ${colors.text}`;
  };

  // Memoize className to prevent unnecessary recalculations
  const className = useMemo(() => cn(
    "relative rounded border p-2 text-xs",

    // Only apply transition when not dragging for better performance
    isDragging
      ? "transition-all"
      : "opacity-50 scale-105",
    isSelectedValue
      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
      : "border-border bg-muted/50"
  ), [isDragging, isSelectedValue]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={className}
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
        <div className="flex flex-col gap-1.5">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide self-start",
              getBadgeColors(section.componentType, isSelectedValue)
            )}
          >
            {formatComponentType(section.componentType)}
          </span>
          <div
            className={cn(
              "font-medium cursor-pointer select-none",
              isSelectedValue ? "text-primary" : "text-muted-foreground"
            )}
            {...listeners}
          >
            {section.name || section.componentType}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders during drag
export const SectionNode = React.memo(SectionNodeComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.name === nextProps.section.name &&
    prevProps.section.componentType === nextProps.section.componentType &&
    prevProps.section.sortOrder === nextProps.section.sortOrder &&
    prevProps.pageId === nextProps.pageId &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isSelected === nextProps.isSelected
  );
});
