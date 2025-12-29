'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Home, Info, Folder, Phone, FileText } from "lucide-react";
import { TreeNode } from "../../lib/tree-utils";
import { ContextMenu } from "../context-menu";

interface PageNodeProps {
  node: TreeNode;
  isSelected?: boolean;
  onClick?: () => void;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showSections?: boolean;
  children?: React.ReactNode;
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PageNode({ node, isSelected, onClick, isDragging, onEdit, onDelete, onDuplicate, showSections = true, children }: PageNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
  } = useDraggable({
    id: `page-${node.id}`,
    data: {
      type: 'page',
      node,
    },
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: `drop-page-${node.id}`,
    data: {
      type: 'drop-zone',
      accepts: ['page'],
      node,
    },
  });

  // No longer need height measurement for CSS Grid layout

  // Combine refs - set both on the div
  const setNodeRef = (element: HTMLDivElement | null) => {
    setDraggableRef(element as HTMLElement);
    setDroppableRef(element as HTMLElement);
  };

  const iconName = node.slug.toLowerCase().includes('home') ? 'home' :
                   node.slug.toLowerCase().includes('about') ? 'about' :
                   node.slug.toLowerCase().includes('portfolio') ? 'portfolio' :
                   node.slug.toLowerCase().includes('contact') ? 'contact' : 'default';
  const Icon = pageIcons[iconName] || pageIcons.default;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      data-page-node
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        ...style,
      }}
      {...attributes}
      {...listeners}
      className="w-[280px] relative"
    >
      <div
        className={`rounded-lg border-2 p-4 bg-background transition-all duration-200 ${
          isDragging
            ? 'border-primary/50 bg-primary/5 shadow-xl scale-105'
            : isSelected
            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
            : isOver
            ? 'border-primary bg-primary/10 shadow-lg'
            : 'border-border hover:border-primary/50 hover:shadow-sm'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{node.name}</h3>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ContextMenu
              onEdit={() => onEdit?.()}
              onDelete={() => onDelete?.()}
              onDuplicate={onDuplicate ? () => onDuplicate() : undefined}
            />
          </div>
        </div>

        {/* Sections */}
        {showSections && node.sections.length > 0 && (
          <div className="space-y-2 mt-4">
            {node.sections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => (
                <div
                  key={section.id}
                  className="rounded border border-border bg-muted/50 p-2 text-xs"
                >
                  <div className="font-medium text-muted-foreground">
                    {section.name || section.componentType}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

