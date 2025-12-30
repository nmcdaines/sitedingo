'use client';

import React from 'react';
import { useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Home, Info, Folder, Phone, FileText, PlusIcon, StarsIcon } from "lucide-react";
import { TreeNode } from "../../lib/tree-utils";
import { ContextMenu } from "../context-menu";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SectionNode } from './section-node';
import { SectionDropZone } from './section-drop-zone';

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
  dropZone?: React.ReactNode;
  activeId?: string | null;
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PageNode({ node, isSelected, onClick, isDragging, onEdit, onDelete, onDuplicate, showSections = true, children, dropZone, activeId }: PageNodeProps) {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);

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
    isOver: isPageOver,
  } = useDroppable({
    id: `drop-page-${node.id}`,
    data: {
      type: 'drop-zone',
      accepts: ['page'],
      node,
    },
  });

  // Also make the sections container a drop zone for sections (fallback to append at end)
  const {
    setNodeRef: setSectionContainerRef,
    isOver: isSectionOver,
  } = useDroppable({
    id: `drop-section-page-${node.id}`,
    data: {
      type: 'section-page-drop',
      pageId: node.id,
      position: node.sections.length,
    },
  });

  // No longer need height measurement for CSS Grid layout

  // Combine refs - set both on the div
  const setNodeRef = (element: HTMLDivElement | null) => {
    setDraggableRef(element as HTMLElement);
    setDroppableRef(element as HTMLElement);
  };

  // Create custom drag listeners that exclude the context menu
  const customListeners = React.useMemo(() => {
    if (!listeners) return listeners;

    // Create a handler that checks if the event target is within the context menu
    const shouldCancelDrag = (event: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
      const target = event.target as HTMLElement;
      return contextMenuRef.current?.contains(target) ?? false;
    };

    // Wrap all drag-related event handlers to exclude context menu clicks
    const wrappedListeners: typeof listeners = {};

    // Handle pointer events (primary drag mechanism for @dnd-kit)
    if (listeners.onPointerDown) {
      wrappedListeners.onPointerDown = (event: React.PointerEvent) => {
        if (shouldCancelDrag(event)) {
          // Allow event to propagate normally for context menu clicks
          return;
        }
        listeners.onPointerDown?.(event);
      };
    }

    // Handle mouse events (fallback)
    if (listeners.onMouseDown) {
      wrappedListeners.onMouseDown = (event: React.MouseEvent) => {
        if (shouldCancelDrag(event)) {
          return;
        }
        listeners.onMouseDown?.(event);
      };
    }

    // Handle touch events (mobile)
    if (listeners.onTouchStart) {
      wrappedListeners.onTouchStart = (event: React.TouchEvent) => {
        if (shouldCancelDrag(event)) {
          return;
        }
        listeners.onTouchStart?.(event);
      };
    }

    // Return wrapped listeners, falling back to original for any we didn't wrap
    return { ...listeners, ...wrappedListeners };
  }, [listeners]);

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
        opacity: isDragging ? 0.8 : 1,
        ...style,
      }}
      {...attributes}
      className={cn(" transition-[scale] duration-200", isDragging ? "scale-105" : "")}
    >
      <div className="relative">
        <div className="w-[280px] ml-auto mr-auto relative rounded-lg">
          {/* Header */}
          <div
            className={cn("flex items-center justify-between mb-2 bg-gray-600/10 rounded py-2 px-2 shadow-sm", isDragging && "border-2 border-primary/50")}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            {...customListeners}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{node.name}</h3>
            </div>
            <div ref={contextMenuRef} onClick={(e) => e.stopPropagation()}>
              <ContextMenu
                onEdit={() => onEdit?.()}
                onDelete={() => onDelete?.()}
                onDuplicate={onDuplicate ? () => onDuplicate() : undefined}
              />
            </div>
          </div>

          {/* Sections */}
          {showSections && (
            <div 
              ref={setSectionContainerRef}
              className={cn(
                "space-y-3 bg-background p-2 rounded-lg shadow-sm transition-colors",
                // isSectionOver && "ring-2 ring-primary/50"
              )}
            >
              {node.sections.length > 0 ? (
                <>
                  {/* Drop zone at the beginning - always show when dragging sections */}
                  <SectionDropZone
                    id={`section-drop-${node.id}-0`}
                    pageId={node.id}
                    position={0}
                    isVisible={activeId?.startsWith('section-') || false}
                  />
                  {node.sections
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((section, index) => (
                      <React.Fragment key={section.id}>
                        <SectionNode
                          section={section}
                          pageId={node.id}
                          isDragging={activeId === `section-${section.id}`}
                        />
                        {/* Drop zone after each section - always show when dragging sections */}
                        <SectionDropZone
                          id={`section-drop-${node.id}-${index + 1}`}
                          pageId={node.id}
                          position={index + 1}
                          isVisible={activeId?.startsWith('section-') || false}
                        />
                      </React.Fragment>
                    ))}
                </>
              ) : (
                <>
                  {/* Drop zone for empty page when dragging - always show when dragging sections */}
                  <SectionDropZone
                    id={`section-drop-${node.id}-0`}
                    pageId={node.id}
                    position={0}
                    isVisible={activeId?.startsWith('section-') || false}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button className='w-full' variant="outline"><PlusIcon /> Section</Button>
                    <Button className='w-full' variant="outline"><StarsIcon /> Generate Content</Button>
                  </div>
                </>
              )}
            </div>
          )}


        </div>
        {dropZone}
      </div>

      {children}
    </div>
  );
}

