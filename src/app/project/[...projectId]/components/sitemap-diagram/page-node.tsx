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
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PageNode({ node, isSelected, onClick, isDragging, onEdit, onDelete, onDuplicate, showSections = true }: PageNodeProps) {
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

  // Combine refs - set both on the div inside foreignObject
  const setNodeRef = (element: SVGForeignObjectElement | null) => {
    setDraggableRef(element);
    // Find the inner div and set droppable on it
    if (element) {
      const innerDiv = element.querySelector('div');
      if (innerDiv) {
        setDroppableRef(innerDiv as HTMLElement);
      }
    }
  };

  const iconName = node.slug.toLowerCase().includes('home') ? 'home' :
                   node.slug.toLowerCase().includes('about') ? 'about' :
                   node.slug.toLowerCase().includes('portfolio') ? 'portfolio' :
                   node.slug.toLowerCase().includes('contact') ? 'contact' : 'default';
  const Icon = pageIcons[iconName] || pageIcons.default;

  // Calculate section area height
  const sectionAreaHeight = showSections && node.sections.length > 0 ? node.sections.length * 100 : 0;
  const totalHeight = 120 + sectionAreaHeight;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <foreignObject
      ref={setNodeRef}
      x={node.position.x}
      y={node.position.y}
      width={node.width}
      height={totalHeight}
      onClick={onClick}
      style={{ 
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        ...style,
      }}
      suppressHydrationWarning
      {...attributes}
      {...listeners}
    >
      <div
        className={`rounded-lg border-2 p-4 bg-background transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-md scale-105'
            : isOver
            ? 'border-primary bg-primary/10 scale-102'
            : 'border-border hover:border-primary/50 hover:shadow-sm'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ width: node.width, minHeight: totalHeight }}
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
                  {section.description && (
                    <div className="text-muted-foreground mt-1 line-clamp-2">
                      {section.description}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </foreignObject>
  );
}

