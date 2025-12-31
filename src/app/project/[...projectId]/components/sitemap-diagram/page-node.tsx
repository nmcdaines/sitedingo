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
import { client } from '@/lib/client';

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
  localPages?: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    parentId: number | null;
    sections: Array<{
      id: number;
      componentType: string;
      name: string | null;
      metadata: any;
      sortOrder: number;
    }>;
  }>;
  sitemapId?: number;
  onPagesChange?: (updater: (pages: PageNodeProps['localPages']) => PageNodeProps['localPages']) => void;
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PageNode({ node, isSelected, onClick, isDragging, onEdit, onDelete, onDuplicate, showSections = true, children, dropZone, activeId, localPages, sitemapId, onPagesChange }: PageNodeProps) {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  
  // Get the actual page data from localPages to ensure we have correct parentId and sortOrder
  const pageData = localPages?.find(p => p.id === node.id);
  
  // Debug: Log props on render
  React.useEffect(() => {
    console.log('PageNode rendered:', { 
      nodeId: node.id, 
      hasLocalPages: !!localPages, 
      localPagesLength: localPages?.length,
      sitemapId,
      nodeParentId: node.parentId,
      nodeSortOrder: node.sortOrder,
      pageData: !!pageData,
      pageDataParentId: pageData?.parentId,
      pageDataSortOrder: pageData?.sortOrder
    });
  }, [node.id, localPages, sitemapId, pageData]);

  // Handle adding a new sibling page
  const handleAddPage = async (insertBefore: boolean) => {
    console.log('handleAddPage called', { insertBefore, nodeId: node.id, sitemapId, hasLocalPages: !!localPages });
    
    // Re-fetch pageData to ensure we have the latest data
    const currentPageData = localPages?.find(p => p.id === node.id);
    console.log('pageData lookup:', { pageData: !!currentPageData, localPagesLength: localPages?.length, nodeId: node.id });
    
    if (!sitemapId || !localPages || !currentPageData) {
      console.error('Missing required data:', { sitemapId, localPages: !!localPages, pageData: !!currentPageData, localPagesArray: localPages });
      return;
    }
    
    try {
      const parentId = currentPageData.parentId;
      
      // Get siblings sorted by sortOrder (includes current page)
      const siblings = localPages
        .filter(p => p.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      console.log('Adding page:', { 
        insertBefore, 
        currentPageId: currentPageData.id, 
        currentSortOrder: currentPageData.sortOrder,
        parentId,
        siblingsCount: siblings.length,
        siblings: siblings.map(s => ({ id: s.id, sortOrder: s.sortOrder }))
      });
      
      // Calculate the target position
      // If inserting before, use current page's sortOrder (will push current page and all after it)
      // If inserting after, use current page's sortOrder + 1 (will push all pages after current)
      const targetPosition = insertBefore ? currentPageData.sortOrder : currentPageData.sortOrder + 1;
      
      // Clamp position to valid range (0 to siblings.length, which is the max valid position)
      const validPosition = Math.max(0, Math.min(targetPosition, siblings.length));
      
      console.log('Target position:', { targetPosition, validPosition });
      
      // Find siblings that need to be shifted (those with sortOrder >= validPosition)
      const siblingsToShift = siblings.filter(s => s.sortOrder >= validPosition);
      
      console.log('Siblings to shift:', siblingsToShift.map(s => ({ id: s.id, sortOrder: s.sortOrder })));
      
      // Generate temporary ID for optimistic update
      const tempId = -Date.now(); // Negative ID to avoid conflicts
      const tempSlug = `new-page-${Date.now()}`;
      
      // Optimistically create the new page in local state
      const optimisticPage = {
        id: tempId,
        name: 'New Page',
        slug: tempSlug,
        description: null,
        sortOrder: validPosition,
        parentId: parentId,
        sections: [],
      };
      
      // Optimistically update localPages: add new page and shift siblings
      if (onPagesChange) {
        onPagesChange((currentPages) => {
          if (!currentPages) return currentPages;
          
          // Create updated pages array with optimistic page and shifted siblings
          const updatedPages = currentPages.map(page => {
            if (siblingsToShift.some(s => s.id === page.id)) {
              return { ...page, sortOrder: page.sortOrder + 1 };
            }
            return page;
          });
          
          // Add the new optimistic page
          updatedPages.push(optimisticPage);
          
          return updatedPages;
        });
      }
      
      try {
        // Create the new page via API
        const newPage = await client.api.pages.post({
          sitemapId: sitemapId,
          parentId: parentId,
          name: 'New Page',
          slug: tempSlug,
          description: null,
          sortOrder: validPosition,
        });
        
        console.log('Created new page:', newPage);
        
        // Shift all affected siblings by incrementing their sortOrder
        await Promise.all(
          siblingsToShift.map(sibling =>
            client.api.pages({ id: sibling.id.toString() }).put({
              name: sibling.name,
              slug: sibling.slug,
              description: sibling.description,
              parentId: sibling.parentId,
              sortOrder: sibling.sortOrder + 1,
            })
          )
        );
        
        console.log('Shifted siblings');
        
        // Replace optimistic page with real page from API
        // Extract the actual page data (Elysia treaty may wrap it)
        const actualPage = (newPage as any).data || newPage;
        
        if (onPagesChange) {
          onPagesChange((currentPages) => {
            if (!currentPages) return currentPages;
            
            return currentPages.map(page => 
              page.id === tempId 
                ? { 
                    id: actualPage.id,
                    name: actualPage.name,
                    slug: actualPage.slug,
                    description: actualPage.description,
                    sortOrder: actualPage.sortOrder,
                    parentId: actualPage.parentId,
                    sections: []
                  } // Replace temp page with real page
                : page
            );
          });
        }
      } catch (error) {
        console.error('Failed to create page:', error);
        
        // Rollback optimistic update on error
        if (onPagesChange) {
          onPagesChange((currentPages) => {
            if (!currentPages) return currentPages;
            
            // Remove the optimistic page and restore original sortOrders
            return currentPages
              .filter(page => page.id !== tempId)
              .map(page => {
                // Restore original sortOrder for shifted siblings
                const wasShifted = siblingsToShift.some(s => s.id === page.id);
                if (wasShifted) {
                  return { ...page, sortOrder: page.sortOrder - 1 };
                }
                return page;
              });
          });
        }
        
        // Show error to user (you might want to add a toast notification here)
        alert('Failed to create page. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create page:', error);
    }
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
      onClick={onClick}
      data-page-node
      style={{
        opacity: isDragging ? 0.8 : 1,
        ...style,
      }}
      {...attributes}
      className={cn("transition-[scale] duration-200", isDragging ? "scale-105" : "")}
    >
      <div className="px-[30px] relative group">
        <div className="w-[280px] ml-auto mr-auto relative rounded-lg">
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
                  console.log('Left button clicked - insert before', { nodeId: node.id, localPages: !!localPages, sitemapId, pageData: !!pageData });
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
                  console.log('Right button clicked - insert after', { nodeId: node.id, localPages: !!localPages, sitemapId, pageData: !!pageData });
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

