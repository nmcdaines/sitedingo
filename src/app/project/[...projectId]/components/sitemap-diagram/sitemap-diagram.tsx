'use client';

import React, { useState, useMemo } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { buildTree, autoLayoutTree, getAllNodes, TreeNode, getSiblings, calculateSortOrder } from '../../lib/tree-utils';
import { PageNode } from './page-node';
import { ConnectionLine } from './connection-line';
import { DragContext } from './drag-context';
import { EmptySpaceDropZone } from './empty-space-drop-zone';
import { useAutoSave } from '../../hooks/use-auto-save';
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
  const zoomRef = React.useRef(externalZoom ?? internalZoom);
  const panRef = React.useRef({ x: 0, y: 0 });

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

  // Build tree and calculate layout
  const tree = useMemo(() => {
    const treeStructure = buildTree(localPages);
    return autoLayoutTree(treeStructure);
  }, [localPages]);

  // Get all nodes for rendering connections
  const allNodes = useMemo(() => getAllNodes(tree), [tree]);

  // Calculate canvas dimensions
  const canvasBounds = useMemo(() => {
    if (allNodes.length === 0) {
      return { width: 1000, height: 600, minX: 0, minY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    allNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.width);
      maxY = Math.max(maxY, node.position.y + node.height);
    });

    return {
      width: Math.max(1000, maxX - minX + 200),
      height: Math.max(600, maxY - minY + 200),
      minX: minX - 100,
      minY: minY - 100,
    };
  }, [allNodes]);

  // Generate connections
  const connections = useMemo(() => {
    const conns: Array<{ from: TreeNode; to: TreeNode }> = [];
    
    function traverse(node: TreeNode) {
      node.children.forEach(child => {
        conns.push({ from: node, to: child });
        traverse(child);
      });
    }
    
    tree.forEach(traverse);
    return conns;
  }, [tree]);

  // Layout constants (matching tree-utils.ts)
  const LAYOUT = {
    NODE_WIDTH: 280,
    NODE_HEIGHT: 120,
    VERTICAL_SPACING: 200,
  } as const;

  // Generate empty space drop zones for re-ordering
  const dropZones = useMemo(() => {
    if (!activeId) return []; // Only show drop zones when dragging
    
    const zones: Array<{
      id: string;
      parentId: number | null;
      position: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    // Generate drop zones for root level
    const rootNodes = tree.sort((a, b) => a.sortOrder - b.sortOrder);
    if (rootNodes.length > 0) {
      // Drop zone before first root node
      zones.push({
        id: `reorder-root-0`,
        parentId: null,
        position: 0,
        x: rootNodes[0].position.x - 200, // Larger spacing before first node
        y: rootNodes[0].position.y,
        width: 150, // Larger width for easier targeting
        height: rootNodes[0].height,
      });

      // Drop zones between root nodes
      for (let i = 0; i < rootNodes.length - 1; i++) {
        const leftNode = rootNodes[i];
        const rightNode = rootNodes[i + 1];
        const midX = (leftNode.position.x + leftNode.width + rightNode.position.x) / 2;
        
        zones.push({
          id: `reorder-root-${i + 1}`,
          parentId: null,
          position: i + 1,
          x: midX - 75, // Centered, larger width
          y: Math.max(leftNode.position.y, rightNode.position.y),
          width: 150, // Larger width for easier targeting
          height: Math.max(leftNode.height, rightNode.height),
        });
      }

      // Drop zone after last root node
      const lastRoot = rootNodes[rootNodes.length - 1];
      zones.push({
        id: `reorder-root-${rootNodes.length}`,
        parentId: null,
        position: rootNodes.length,
        x: lastRoot.position.x + lastRoot.width + 50,
        y: lastRoot.position.y,
        width: 150, // Larger width for easier targeting
        height: lastRoot.height,
      });
    }

    // Generate drop zones for children of each node
    function generateChildDropZones(node: TreeNode) {
      // Skip root level nodes (pages with slug "/" or "/home" cannot have children)
      const nodePage = localPages.find(p => p.id === node.id);
      if (nodePage && (nodePage.slug === '/' || nodePage.slug === '/home')) {
        // Still recurse to children if they exist
        node.children.forEach(child => generateChildDropZones(child));
        return;
      }

      const sortedChildren = [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
      
      if (sortedChildren.length === 0) {
        // If node has no children, create a drop zone below it for the first child
        // Position it below the node, centered horizontally
        const childY = node.position.y + node.height + LAYOUT.VERTICAL_SPACING;
        zones.push({
          id: `reorder-${node.id}-0`,
          parentId: node.id,
          position: 0,
          x: node.position.x + (node.width / 2) - 75, // Centered below the node
          y: childY,
          width: 150,
          height: LAYOUT.NODE_HEIGHT,
        });
      } else {
        // Drop zone before first child
        zones.push({
          id: `reorder-${node.id}-0`,
          parentId: node.id,
          position: 0,
          x: sortedChildren[0].position.x - 200,
          y: sortedChildren[0].position.y,
          width: 150, // Larger width for easier targeting
          height: sortedChildren[0].height,
        });

        // Drop zones between children
        for (let i = 0; i < sortedChildren.length - 1; i++) {
          const leftChild = sortedChildren[i];
          const rightChild = sortedChildren[i + 1];
          const midX = (leftChild.position.x + leftChild.width + rightChild.position.x) / 2;
          
          zones.push({
            id: `reorder-${node.id}-${i + 1}`,
            parentId: node.id,
            position: i + 1,
            x: midX - 75, // Centered, larger width
            y: Math.max(leftChild.position.y, rightChild.position.y),
            width: 150, // Larger width for easier targeting
            height: Math.max(leftChild.height, rightChild.height),
          });
        }

        // Drop zone after last child
        const lastChild = sortedChildren[sortedChildren.length - 1];
        zones.push({
          id: `reorder-${node.id}-${sortedChildren.length}`,
          parentId: node.id,
          position: sortedChildren.length,
          x: lastChild.position.x + lastChild.width + 50,
          y: lastChild.position.y,
          width: 150, // Larger width for easier targeting
          height: lastChild.height,
        });
      }

      // Recursively generate for grandchildren
      sortedChildren.forEach(child => generateChildDropZones(child));
    }

    tree.forEach(rootNode => generateChildDropZones(rootNode));

    return zones;
  }, [tree, activeId]);

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
    // Check if clicking on a node - if so, don't start panning
    const target = e.target as HTMLElement;
    const isNodeClick = target.closest('foreignObject') !== null;
    
    // Always allow panning with middle mouse button or Ctrl/Cmd + left click
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setMouseDownOnEmptySpace(false);
      return;
    }
    
    // For left click on empty space, track it but don't start panning yet
    // We'll start panning only if the mouse moves (to avoid interfering with node clicks)
    if (e.button === 0 && !isNodeClick) {
      setMouseDownOnEmptySpace(true);
      setMouseDownPos({ x: e.clientX, y: e.clientY });
    } else {
      setMouseDownOnEmptySpace(false);
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
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
      // Convert screen pixel movement to SVG coordinate movement
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
      
      // Don't allow dropping on a root level node (root nodes cannot have children)
      // Root pages are those with slug "/" or "/home"
      const newParentPage = localPages.find(p => p.id === newParentId);
      if (newParentPage && (newParentPage.slug === '/' || newParentPage.slug === '/home')) {
        console.log('[DragEnd] Cannot drop on root page');
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
      if (!match) return;
      
      const parentIdStr = match[1];
      const position = parseInt(match[2]);
      const targetParentId = parentIdStr === 'root' ? null : parseInt(parentIdStr);
      
      // Don't allow a page to be its own parent
      if (targetParentId !== null && targetParentId === draggedNode.id) return;
      
      // Don't allow dropping on a root level node (root nodes cannot have children)
      // Root pages are those with slug "/" or "/home"
      if (targetParentId !== null) {
        const targetParentPage = localPages.find(p => p.id === targetParentId);
        if (targetParentPage && (targetParentPage.slug === '/' || targetParentPage.slug === '/home')) return;
      }
      
      // Don't allow dropping on itself (if moving within same parent at same position)
      const draggedPage = localPages.find(p => p.id === draggedNode.id);
      if (!draggedPage) return;
      
      if (draggedPage.parentId === targetParentId) {
        const currentSiblings = getSiblings(localPages, targetParentId, draggedNode.id);
        const currentIndex = currentSiblings.findIndex(s => s.sortOrder > draggedPage.sortOrder);
        const effectiveCurrentIndex = currentIndex === -1 ? currentSiblings.length : currentIndex;
        
        // If dropping at the same position, do nothing
        if (effectiveCurrentIndex === position) return;
      }

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
      return;
    }

    // Check if pages actually changed
    const hasChanges = updatedPages.some((page, index) => {
      const original = localPages[index];
      return !original || page.id !== original.id || page.parentId !== original.parentId || page.sortOrder !== original.sortOrder;
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
        <svg
          width="100%"
          height="100%"
          viewBox={`${canvasBounds.minX} ${canvasBounds.minY} ${canvasBounds.width} ${canvasBounds.height}`}
          className="absolute inset-0"
          preserveAspectRatio="xMidYMid meet"
        >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill="var(--border)"
            />
          </marker>
        </defs>

        {/* Transform group for zoom and pan */}
        <g transform={`translate(${-pan.x}, ${-pan.y}) scale(${zoom})`}>
          {/* Render connections */}
          {connections.map((conn, index) => (
            <g key={`${conn.from.id}-${conn.to.id}-${index}`} className="transition-opacity duration-200">
              <ConnectionLine
                from={{
                  x: conn.from.position.x,
                  y: conn.from.position.y,
                  width: conn.from.width,
                  height: conn.from.height,
                }}
                to={{
                  x: conn.to.position.x,
                  y: conn.to.position.y,
                  width: conn.to.width,
                }}
              />
            </g>
          ))}

          {/* Render empty space drop zones for re-ordering */}
          {dropZones.map(zone => (
            <EmptySpaceDropZone
              key={zone.id}
              id={zone.id}
              parentId={zone.parentId}
              position={zone.position}
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              isVisible={!!activeId}
            />
          ))}

          {/* Render nodes */}
          {allNodes.map(node => {
            const pageData = localPages.find(p => p.id === node.id);
            return (
              <PageNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isDragging={activeId === `page-${node.id}`}
                showSections={showSections}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onPageSelect?.(pageData || null);
                }}
                onEdit={() => {
                  setSelectedNodeId(node.id);
                  onPageSelect?.(pageData || null);
                }}
                onDelete={async () => {
                  if (pageData && confirm('Are you sure you want to delete this page?')) {
                    try {
                      await client.api.pages({ id: pageData.id.toString() }).delete();
                      setLocalPages(localPages.filter(p => p.id !== pageData.id));
                      if (selectedNodeId === node.id) {
                        setSelectedNodeId(null);
                        onPageSelect?.(null);
                      }
                    } catch (error) {
                      console.error('Failed to delete page:', error);
                    }
                  }
                }}
                onDuplicate={async () => {
                  if (pageData) {
                    try {
                      const newPage = await client.api.pages.post({
                        sitemapId: sitemapId || 0,
                        parentId: pageData.parentId,
                        name: `${pageData.name} (Copy)`,
                        slug: `${pageData.slug}-copy`,
                        description: pageData.description,
                        sortOrder: pageData.sortOrder + 1,
                      });
                      // Refresh pages - this should come from parent
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to duplicate page:', error);
                    }
                  }
                }}
              />
            );
          })}
        </g>
        </svg>
      </div>
    </DragContext>
  );
}

