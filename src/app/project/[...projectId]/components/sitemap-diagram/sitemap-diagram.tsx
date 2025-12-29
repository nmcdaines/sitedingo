'use client';

import React, { useState, useMemo } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { buildTree, TreeNode, getSiblings, calculateSortOrder } from '../../lib/tree-utils';
import { PageTreeNode } from './page-tree-node';
import { DragContext } from './drag-context';
import { EmptySpaceDropZone } from './empty-space-drop-zone';
import { client } from '@/lib/client';
import { Button } from '@/components/ui/button';

interface Page {
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
}

interface SitemapDiagramProps {
  pages: Page[];
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  sitemapId?: number;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onPageSelect?: (page: Page | null) => void;
  selectedPageId?: number | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function SitemapDiagram({ pages, zoom: externalZoom, onZoomChange, sitemapId, onSaveStatusChange, onPageSelect, selectedPageId, onUndo, onRedo, canUndo, canRedo }: SitemapDiagramProps) {
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(selectedPageId ?? null);
  const [internalZoom, setInternalZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mouseDownOnEmptySpace, setMouseDownOnEmptySpace] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localPages, setLocalPages] = useState(pages);
  const [showSections, setShowSections] = useState(true);

  // Undo/Redo history for page changes
  const [history, setHistory] = useState<Array<Page[]>>([pages]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Track previous pages state to detect actual changes
  const previousPagesRef = React.useRef<Page[]>(pages);
  const isInitialMountRef = React.useRef(true);
  const isSavingRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const zoomRef = React.useRef(externalZoom ?? internalZoom);
  const panRef = React.useRef({ x: 0, y: 0 });
  const hasCenteredRef = React.useRef(false);

  const zoom = externalZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;

  // Keep refs in sync with state
  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Update local pages when prop changes (from server)
  React.useEffect(() => {
    // Only update if pages actually changed (compare by ID, not index)
    const pagesMap = new Map(pages.map(p => [p.id, p]));
    const prevPagesMap = new Map(previousPagesRef.current.map(p => [p.id, p]));
    
    const pagesChanged = pages.length !== previousPagesRef.current.length ||
      pages.some(page => {
        const prev = prevPagesMap.get(page.id);
        return !prev || 
          page.parentId !== prev.parentId ||
          page.sortOrder !== prev.sortOrder ||
          page.name !== prev.name ||
          page.slug !== prev.slug;
      }) ||
      previousPagesRef.current.some(prev => !pagesMap.has(prev.id));
    
    if (pagesChanged) {
      setLocalPages(pages);
      setHistory([pages]);
      setHistoryIndex(0);
      previousPagesRef.current = pages;
    }
  }, [pages]);

  // Update undo/redo availability
  const currentCanUndo = historyIndex > 0;
  const currentCanRedo = historyIndex < history.length - 1;
  
  React.useEffect(() => {
    // Notify parent of undo/redo state changes
    // This is a simplified approach - in a real app you'd use a callback
  }, [currentCanUndo, currentCanRedo]);

  // Handle undo/redo keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (currentCanUndo) {
          const previousState = history[historyIndex - 1];
          setLocalPages(previousState);
          setHistoryIndex(historyIndex - 1);
          onUndo?.();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (currentCanRedo) {
          const nextState = history[historyIndex + 1];
          setLocalPages(nextState);
          setHistoryIndex(historyIndex + 1);
          onRedo?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, currentCanUndo, currentCanRedo, onUndo, onRedo]);

  // Build tree structure (no layout calculation needed for CSS Grid)
  const tree = useMemo(() => {
    return buildTree(localPages);
  }, [localPages]);

  // Center sitemap on first load
  React.useEffect(() => {
    if (hasCenteredRef.current || !containerRef.current || !contentRef.current || tree.length === 0) return;
    
    // Wait for content to render
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;
      
      // Find all page nodes to calculate their bounding box
      const pageNodes = content.querySelectorAll('[data-page-node]');
      if (pageNodes.length === 0) return;
      
      // Get the transform container (parent of content)
      const transformContainer = content.parentElement;
      if (!transformContainer) return;
      
      // Calculate bounding box of all page nodes in the content's coordinate space
      // We need to account for the zoom transform when converting screen coordinates to local coordinates
      const currentZoom = zoomRef.current;
      const contentRect = content.getBoundingClientRect();
      const padding = 32;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      pageNodes.forEach((node) => {
        // Get screen coordinates
        const rect = (node as HTMLElement).getBoundingClientRect();
        
        // Convert to content's local coordinate space (accounting for zoom)
        // Since the transform is scale(zoom), screen coordinates = local * zoom
        // So local = screen / zoom
        const localX = (rect.left - contentRect.left) / currentZoom;
        const localY = (rect.top - contentRect.top) / currentZoom;
        const localWidth = rect.width / currentZoom;
        const localHeight = rect.height / currentZoom;
        
        minX = Math.min(minX, localX);
        minY = Math.min(minY, localY);
        maxX = Math.max(maxX, localX + localWidth);
        maxY = Math.max(maxY, localY + localHeight);
      });
      
      // Calculate content center
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;
      
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const containerCenterX = containerWidth / 2;
      const containerCenterY = containerHeight / 2;
      
      // Calculate pan offset to center the content
      // The transform applies: translate(-pan.x, -pan.y) scale(zoom)
      // To center content at (contentCenterX, contentCenterY) at container center (containerCenterX, containerCenterY):
      // containerCenterX = (contentCenterX - pan.x) * zoom
      // Solving for pan.x: pan.x = contentCenterX - containerCenterX / zoom
      const offsetX = contentCenterX - containerCenterX / currentZoom;
      const offsetY = contentCenterY - containerCenterY / currentZoom;
      
      // Set pan to center the content
      setPan({ x: offsetX, y: offsetY });
      hasCenteredRef.current = true;
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [tree.length, zoom, localPages.length]);

  if (pages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No pages found</p>
        </div>
      </div>
    );
  }

  // Prevent text selection during panning
  React.useEffect(() => {
    if (!isPanning) return;

    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    // Prevent text selection during panning
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventSelection);
    
    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventSelection);
    };
  }, [isPanning]);

  // Use native event listener for better control over preventDefault
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Prevent default browser zoom behavior
      e.preventDefault();
      e.stopPropagation();
      
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      
      // Check if it's a pinch gesture (Ctrl/Cmd + wheel) - handle as zoom
      if (e.ctrlKey || e.metaKey) {
        // Slower zoom: use smaller delta for more controlled zooming
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const newZoom = Math.max(0.3, Math.min(2, currentZoom * delta));
        setZoom(newZoom);
      } else {
        // Otherwise, handle as panning (trackpad scrolling)
        // Convert wheel delta to pan movement with increased sensitivity
        // Inverted: scrolling right/down pans right/down
        const scrollSensitivity = 3.0; // Increased sensitivity for faster scrolling
        const panDeltaX = (e.deltaX / currentZoom) * scrollSensitivity;
        const panDeltaY = (e.deltaY / currentZoom) * scrollSensitivity;
        
        setPan({
          x: currentPan.x + panDeltaX,
          y: currentPan.y + panDeltaY,
        });
      }
    };

    // Use capture phase and non-passive to ensure preventDefault works
    container.addEventListener('wheel', handleWheelNative, { passive: false, capture: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheelNative, { capture: true });
    };
  }, [setZoom, setPan]);

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    // If a drag is active, don't interfere with panning
    if (activeId) {
      return;
    }
    
    // Check if clicking on a node or draggable element - if so, don't start panning
    const target = e.target as HTMLElement;
    
    // Walk up the DOM tree to find if we're inside a draggable element
    // dnd-kit adds data attributes, but we can also check for elements with cursor-grab
    let current: HTMLElement | null = target;
    let isNodeClick = false;
    let isDropZone = false;
    
    while (current && current !== containerRef.current) {
      // Check for cursor-grab style (page nodes have this)
      const style = window.getComputedStyle(current);
      if (style.cursor === 'grab' || style.cursor === 'grabbing') {
        isNodeClick = true;
        break;
      }
      // Check for buttons
      if (current.tagName === 'BUTTON' || current.getAttribute('role') === 'button') {
        isNodeClick = true;
        break;
      }
      // Check for drop zones (they have data attributes from dnd-kit)
      if (current.hasAttribute('data-rbd-droppable-id') || 
          current.getAttribute('data-droppable-id') ||
          current.classList.contains('drop-zone')) {
        isDropZone = true;
        break;
      }
      current = current.parentElement;
    }
    
    // If clicking on a node or drop zone, don't interfere with drag - let dnd-kit handle it
    if ((isNodeClick || isDropZone) && e.button === 0 && !e.ctrlKey && !e.metaKey) {
      setMouseDownOnEmptySpace(false);
      return; // Don't prevent default or stop propagation - let dnd-kit handle it
    }
    
    // Always allow panning with middle mouse button or Ctrl/Cmd + left click
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setMouseDownOnEmptySpace(false);
      return;
    }
    
    // For left click on empty space, track it but don't start panning yet
    // We'll start panning only if the mouse moves (to avoid interfering with node clicks)
    if (e.button === 0 && !isNodeClick && !isDropZone) {
      setMouseDownOnEmptySpace(true);
      setMouseDownPos({ x: e.clientX, y: e.clientY });
    } else {
      setMouseDownOnEmptySpace(false);
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    // Don't handle panning if a drag is active
    if (activeId) {
      return;
    }
    
    // If we have a mouse down on empty space and mouse has moved, start panning
    if (mouseDownOnEmptySpace && !isPanning) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + 
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      // Start panning if mouse moved more than 5 pixels (to avoid accidental panning on clicks)
      if (moveDistance > 5) {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({ x: mouseDownPos.x, y: mouseDownPos.y });
      }
    }
    
    if (isPanning) {
      e.preventDefault();
      e.stopPropagation();
      // Convert screen pixel movement to coordinate movement
      // Inverted: dragging right/down pans left/up (like grabbing the canvas)
      // Pan speed is consistent regardless of zoom level for better UX
      const panSpeed = 1.5;
      const deltaX = -(e.clientX - panStart.x) * panSpeed;
      const deltaY = -(e.clientY - panStart.y) * panSpeed;
      setPan({
        x: pan.x + deltaX,
        y: pan.y + deltaY,
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsPanning(false);
    setMouseDownOnEmptySpace(false);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Stop any panning when drag starts
    setIsPanning(false);
    setMouseDownOnEmptySpace(false);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      console.log('[DragEnd] No over target');
      return;
    }

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'page') {
      console.log('[DragEnd] Invalid active data:', activeData);
      return;
    }

    const draggedNode = activeData.node as TreeNode;
    const overId = over.id as string;
    console.log('[DragEnd] Dragging page', draggedNode.id, 'over', overId);

    let updatedPages: Page[] = localPages;

    // Case 1: Dropped on a page node (nesting)
    // Handle both 'drop-page-{id}' (droppable zone) and 'page-{id}' (draggable element)
    let newParentId: number | null = null;
    if (overId.startsWith('drop-page-')) {
      newParentId = parseInt(overId.replace('drop-page-', ''));
    } else if (overId.startsWith('page-')) {
      // Collision detection picked up the draggable element instead of droppable zone
      newParentId = parseInt(overId.replace('page-', ''));
    }

    if (newParentId !== null) {
      console.log('[DragEnd] Dropping on page node, newParentId:', newParentId);
      
      // Don't allow dropping on itself or its children
      if (draggedNode.id === newParentId) {
        console.log('[DragEnd] Cannot drop on itself');
        return;
      }
      
      // Check if dropping on a descendant
      function isDescendant(node: TreeNode, targetId: number): boolean {
        if (node.id === targetId) return true;
        return node.children.some(child => isDescendant(child, targetId));
      }
      if (isDescendant(draggedNode, newParentId)) {
        console.log('[DragEnd] Cannot drop on descendant');
        return;
      }

      // Get siblings of the new parent to calculate sort order
      const newSiblings = getSiblings(localPages, newParentId, draggedNode.id);
      const newSortOrder = newSiblings.length > 0 ? Math.max(...newSiblings.map(s => s.sortOrder)) + 1 : 0;

      console.log('[DragEnd] Updating page', draggedNode.id, 'to parent', newParentId, 'sortOrder', newSortOrder);

      // Update the page's parent and sort order
      updatedPages = localPages.map(page => {
        if (page.id === draggedNode.id) {
          return { ...page, parentId: newParentId, sortOrder: newSortOrder };
        }
        return page;
      });
    }
    // Case 2: Dropped on an empty space drop zone (re-ordering)
    else if (overId.startsWith('reorder-')) {
      // Parse drop zone ID: format is "reorder-{parentId}-{position}"
      // For root: "reorder-root-0"
      // For children: "reorder-123-0"
      const match = overId.match(/^reorder-(root|\d+)-(\d+)$/);
      if (!match) {
        console.log('[DragEnd] Invalid reorder drop zone ID:', overId);
        return;
      }
      
      const parentIdStr = match[1];
      const position = parseInt(match[2]);
      const targetParentId = parentIdStr === 'root' ? null : parseInt(parentIdStr);
      
      const draggedPage = localPages.find(p => p.id === draggedNode.id);
      if (!draggedPage) {
        console.log('[DragEnd] Dragged page not found');
        return;
      }
      
      // Don't allow a page to be its own parent
      if (targetParentId !== null && targetParentId === draggedNode.id) {
        console.log('[DragEnd] Cannot drop on itself');
        return;
      }
      
      // Check if this is actually a meaningful move
      // Don't allow dropping on itself (if moving within same parent at same position)
      if (draggedPage.parentId === targetParentId) {
        const currentSiblings = getSiblings(localPages, targetParentId, draggedNode.id);
        const currentIndex = currentSiblings.findIndex(s => s.sortOrder > draggedPage.sortOrder);
        const effectiveCurrentIndex = currentIndex === -1 ? currentSiblings.length : currentIndex;
        
        // If dropping at the same position, do nothing
        if (effectiveCurrentIndex === position) {
          console.log('[DragEnd] Dropping at same position, no change needed');
          return;
        }
      }

      console.log('[DragEnd] Reordering page', draggedNode.id, 'to parent', targetParentId, 'at position', position);

      // Calculate new sort order and sibling IDs
      const { sortOrder, siblingIds } = calculateSortOrder(
        localPages,
        draggedNode.id,
        targetParentId,
        position
      );

      // Get old parent siblings (to update their sort orders after removal)
      const oldParentId = draggedPage.parentId;
      const oldSiblings = getSiblings(localPages, oldParentId, draggedNode.id);
      const oldSiblingIds = oldSiblings.map(s => s.id);

      // Update all affected pages
      updatedPages = localPages.map(page => {
        if (page.id === draggedNode.id) {
          // Update dragged page
          return { ...page, parentId: targetParentId, sortOrder };
        } else if (siblingIds.includes(page.id)) {
          // Update new sibling sort orders
          const newIndex = siblingIds.indexOf(page.id);
          return { ...page, sortOrder: newIndex };
        } else if (oldSiblingIds.includes(page.id) && oldParentId !== targetParentId) {
          // Update old sibling sort orders (only if moving to different parent)
          const oldIndex = oldSiblingIds.indexOf(page.id);
          return { ...page, sortOrder: oldIndex };
        }
        return page;
      });
    } else {
      // Unknown drop target, do nothing
      console.log('[DragEnd] Unknown drop target:', overId);
      return;
    }

    // Check if pages actually changed (compare by ID, not index)
    const hasChanges = updatedPages.some((page) => {
      const original = localPages.find(p => p.id === page.id);
      if (!original) return true; // New page
      return page.parentId !== original.parentId || page.sortOrder !== original.sortOrder;
    }) || updatedPages.length !== localPages.length;

    if (!hasChanges) {
      console.log('[DragEnd] No changes to apply');
      return;
    }

    console.log('[DragEnd] Applying changes, updated pages:', updatedPages.map(p => ({ id: p.id, parentId: p.parentId, sortOrder: p.sortOrder })));

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedPages);
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);

    setLocalPages(updatedPages);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    // Could add visual feedback here
  };

  // Auto-save mutation
  const savePageMutation = useMutation({
    mutationFn: async (page: { id: number; parentId: number | null; sortOrder: number }) => {
      const pageData = localPages.find(p => p.id === page.id);
      if (!pageData) throw new Error('Page not found');
      
      console.log('[SaveMutation] Saving page', page.id, 'with parentId', pageData.parentId, 'sortOrder', pageData.sortOrder);
      
      const result = await client.api.pages({ id: page.id.toString() }).put({
        name: pageData.name,
        slug: pageData.slug,
        description: pageData.description,
        parentId: pageData.parentId,
        sortOrder: pageData.sortOrder,
      });
      
      console.log('[SaveMutation] Save result:', result);
      return result;
    },
  });

  // Track save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save when pages change
  React.useEffect(() => {
    // Skip initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPagesRef.current = localPages;
      console.log('[AutoSave] Skipping initial mount');
      return;
    }

    console.log('[AutoSave] Checking for changes, localPages:', localPages.map(p => ({ id: p.id, parentId: p.parentId, sortOrder: p.sortOrder })));
    console.log('[AutoSave] Previous pages:', previousPagesRef.current.map(p => ({ id: p.id, parentId: p.parentId, sortOrder: p.sortOrder })));

    // Find pages that actually changed
    const changedPages = localPages.filter(page => {
      const originalPage = previousPagesRef.current.find(p => p.id === page.id);
      if (!originalPage) return false; // New page, but we don't handle creation here
      
      // Only save if parentId or sortOrder actually changed
      const hasChanges = page.parentId !== originalPage.parentId || 
                        page.sortOrder !== originalPage.sortOrder;
      if (hasChanges) {
        console.log('[AutoSave] Page', page.id, 'changed:', {
          parentId: { from: originalPage.parentId, to: page.parentId },
          sortOrder: { from: originalPage.sortOrder, to: page.sortOrder }
        });
      }
      return hasChanges;
    });

    // If no changes, don't save
    if (changedPages.length === 0) {
      console.log('[AutoSave] No changes detected');
      previousPagesRef.current = localPages;
      return;
    }

    console.log('[AutoSave] Found', changedPages.length, 'changed pages:', changedPages.map(p => p.id));

    // If already saving, skip (will be handled by next effect run)
    if (isSavingRef.current) {
      console.log('[AutoSave] Already saving, skipping');
      return;
    }

    console.log('[AutoSave] Starting save process');

    // Save immediately
    (async () => {
      isSavingRef.current = true;
      
      // Re-check all pages for changes (in case more changes happened)
      const stillChanged = localPages.filter(page => {
        const originalPage = previousPagesRef.current.find(p => p.id === page.id);
        if (!originalPage) return false; // New page, but we don't handle creation here
        
        // Only save if parentId or sortOrder actually changed
        return page.parentId !== originalPage.parentId || 
               page.sortOrder !== originalPage.sortOrder;
      });

      if (stillChanged.length === 0) {
        previousPagesRef.current = localPages;
        isSavingRef.current = false;
        return;
      }

      setSaveStatus('saving');
      onSaveStatusChange?.('saving');
      
      try {
        await Promise.all(
          stillChanged.map(page => {
            const pageData = localPages.find(p => p.id === page.id)!;
            return savePageMutation.mutateAsync({
              id: page.id,
              parentId: pageData.parentId,
              sortOrder: pageData.sortOrder,
            });
          })
        );
        
        // Invalidate queries to trigger re-fetch of updated data
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        // Update previous pages ref after successful save
        previousPagesRef.current = localPages;
        
        setSaveStatus('saved');
        onSaveStatusChange?.('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          onSaveStatusChange?.('idle');
        }, 2000);
      } catch (error) {
        setSaveStatus('error');
        onSaveStatusChange?.('error');
        setTimeout(() => {
          setSaveStatus('idle');
          onSaveStatusChange?.('idle');
        }, 5000);
      } finally {
        isSavingRef.current = false;
      }
    })();
  }, [localPages, onSaveStatusChange, queryClient, savePageMutation]);

  return (
    <DragContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: isPanning ? 'grabbing' : 'grab', 
          touchAction: 'none',
          userSelect: isPanning ? 'none' : 'auto',
          WebkitUserSelect: isPanning ? 'none' : 'auto',
        }}
      >
        {/* Toggle button for showing/hiding sections */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSections(!showSections)}
          className={`absolute top-4 right-4 z-10 transition-all ${
            showSections 
              ? 'bg-background/95 backdrop-blur-sm border-border shadow-sm' 
              : 'bg-background/40 backdrop-blur-sm border-border/40 opacity-70'
          }`}
        >
          {showSections ? 'Hide Sections' : 'Show Sections'}
          {showSections ? (
            <EyeOff className="w-4 h-4 ml-2" />
          ) : (
            <Eye className="w-4 h-4 ml-2" />
          )}
        </Button>
        {/* Transform container for zoom and pan */}
        <div
          style={{
            transform: `translate(${-pan.x}px, ${-pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {/* Root level flex container */}
          <div 
            ref={contentRef}
            className="w-full h-full p-8"
            style={{ 
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: '3rem',
              alignItems: 'flex-start',
            }}
          >
            {tree.length === 0 ? (
              <div className="flex items-center justify-center w-full">
                <p className="text-muted-foreground">No pages found</p>
              </div>
            ) : (
              tree.flatMap((rootNode, index) => [
                // Drop zone before first node or between nodes
                activeId && (
                  <div
                    key={`drop-before-${rootNode.id}`}
                    className="absolute pointer-events-auto"
                    style={{
                      left: index === 0 
                        ? `calc(${(index * 100) / tree.length}% - 280px)` // Before first: position well to the left
                        : `calc(${(index * 100) / tree.length}% - 140px)`, // Between items: at column boundary
                      top: '-60px',
                      width: '280px',
                      height: '80px',
                      zIndex: 10,
                    }}
                  >
                    <EmptySpaceDropZone
                      id={`reorder-root-${index}`}
                      parentId={null}
                      position={index}
                      width={280}
                      height={80}
                      isVisible={true}
                    />
                  </div>
                ),
                // The actual node
                <div key={rootNode.id} className="relative" style={{ flexShrink: 0, flexGrow: 0, width: 'max-content', minWidth: '280px' }}>
                  <PageTreeNode
                    node={rootNode}
                    localPages={localPages}
                    selectedNodeId={selectedNodeId}
                    activeId={activeId}
                    showSections={showSections}
                    onPageSelect={(page) => {
                      setSelectedNodeId(page?.id || null);
                      onPageSelect?.(page);
                    }}
                    onPageEdit={(page) => {
                      setSelectedNodeId(page?.id || null);
                      onPageSelect?.(page);
                    }}
                    onPageDelete={async (page) => {
                      if (page && confirm('Are you sure you want to delete this page?')) {
                        try {
                          await client.api.pages({ id: page.id.toString() }).delete();
                          setLocalPages(localPages.filter(p => p.id !== page.id));
                          if (selectedNodeId === page.id) {
                            setSelectedNodeId(null);
                            onPageSelect?.(null);
                          }
                        } catch (error) {
                          console.error('Failed to delete page:', error);
                        }
                      }
                    }}
                    onPageDuplicate={async (page) => {
                      if (page) {
                        try {
                          const newPage = await client.api.pages.post({
                            sitemapId: sitemapId || 0,
                            parentId: page.parentId,
                            name: `${page.name} (Copy)`,
                            slug: `${page.slug}-copy`,
                            description: page.description,
                            sortOrder: page.sortOrder + 1,
                          });
                          // Refresh pages - this should come from parent
                          window.location.reload();
                        } catch (error) {
                          console.error('Failed to duplicate page:', error);
                        }
                      }
                    }}
                    sitemapId={sitemapId}
                  />
                </div>,
                // Drop zone after last node
                activeId && index === tree.length - 1 && (
                  <div
                    key={`drop-after-${rootNode.id}`}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `calc(${((index + 1) * 100) / tree.length}% - 140px)`,
                      top: '-60px',
                      width: '280px',
                      height: '80px',
                      zIndex: 10,
                    }}
                  >
                    <EmptySpaceDropZone
                      id={`reorder-root-${index + 1}`}
                      parentId={null}
                      position={index + 1}
                      width={280}
                      height={80}
                      isVisible={true}
                    />
                  </div>
                ),
              ]).filter(Boolean)
            )}
          </div>
        </div>
      </div>
    </DragContext>
  );
}

