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
import { useSitemapDiagram } from './sitemap-diagram-context';

interface PageNodeProps {
  node: TreeNode;
  isSelected?: boolean;
  onClick?: () => void;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showSections?: boolean;
  onSectionSelect?: (section: { id: number; componentType: string; name: string | null; metadata: any; sortOrder: number; pageId?: number } | null) => void;
  children?: React.ReactNode;
  dropZone?: React.ReactNode;
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PageNode({ node, isSelected, onClick, isDragging, onEdit, onDelete, onDuplicate, showSections = true, onSectionSelect, children, dropZone }: PageNodeProps) {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  const { pages, activeId, activeSectionId, showSections: contextShowSections, addPage, addSection } = useSitemapDiagram();

  // Get the actual page data from pages to ensure we have correct parentId and sortOrder
  const pageData = pages.find(p => p.id === node.id);
  const showSectionsValue = showSections !== undefined ? showSections : contextShowSections;

  // Handle adding a new sibling page
  const handleAddPage = async (insertBefore: boolean) => {
    if (!pageData) {
      console.error('Missing page data for node:', node.id);
      return;
    }

    const parentId = pageData.parentId;
    const targetPosition = insertBefore ? pageData.sortOrder : pageData.sortOrder + 1;

    await addPage(parentId, targetPosition);
  };

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
      return contextMenuRef.current?.contains(target) || target?.classList?.contains('add-button') || false;
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
      onClick={(e) => {
        e.stopPropagation();
        onClick?.()
      }}
      data-page-node
      style={{
        opacity: isDragging ? 0.8 : 1,
        ...style,
      }}
      {...attributes}
      className={cn("transition-[scale] duration-200", isDragging ? "scale-105 z-[9999]" : "")}
    >
      <div className="px-[30px] relative group">
        <div className="w-[280px] ml-auto mr-auto relative rounded-lg pointer-events-auto">
          {/* Header */}
          <div
            className={cn("relative flex items-center justify-between mb-2 bg-gray-600/10 rounded py-2 px-2 shadow-sm", isDragging && "border-2 border-primary/50")}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            {...customListeners}
          >
            <div className={cn('absolute left-0 -translate-x-full h-full pr-[9px] hidden z-10', !isDragging && 'group-hover:block')}>
              <Button
                variant="outline"
                className='add-button h-full z-20'
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddPage(true); // Insert before
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ zIndex: 9999 }}
              >
                <PlusIcon />
              </Button>
            </div>
            <div className={cn('absolute right-0 translate-x-full h-full pl-[9px] hidden z-10', !isDragging && 'group-hover:block')}>
              <Button
                variant="outline"
                className='add-button h-full z-20'
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddPage(false); // Insert after
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ zIndex: 9999 }}
              >
                <PlusIcon />
              </Button>
            </div>

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
          {showSectionsValue && (
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
                          isSelected={activeSectionId === `section-${section.id}`}
                          onSelect={(section) => {
                            onSectionSelect?.({
                              ...section,
                              pageId: node.id,
                            });
                          }}
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
                  {/* Add section button when sections exist */}
                  <Button
                    className='w-full mt-2'
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSection(node.id, node.sections.length);
                    }}
                  >
                    <PlusIcon className="w-4 h-4" /> Add Section
                  </Button>
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
                    <Button
                      className='w-full'
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        addSection(node.id, 0);
                      }}
                    >
                      <PlusIcon /> Section
                    </Button>
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
