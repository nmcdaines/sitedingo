"use client";

import React, { useState, useMemo } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Eye, EyeOff } from "lucide-react";
import {
  buildTree,
} from "../../lib/tree-utils";
import { PageTreeNode } from "./page-tree-node";
import { DragContext } from "./drag-context";
import { EmptySpaceDropZone } from "./empty-space-drop-zone";
import { Button } from "@/components/ui/button";
import { useSitemapDiagram, Page } from "./sitemap-diagram-context";

interface SitemapDiagramProps {
  pages: Page[];
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  sitemapId?: number;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onPageSelect?: (page: Page | null) => void;
  onSectionSelect?: (section: { id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number; pageId?: number } | null) => void;
  selectedPageId?: number | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function SitemapDiagram({
  pages,
  zoom: externalZoom,
  onZoomChange,
  onPageSelect,
  onSectionSelect,
  selectedPageId,
  onDragStateChange,
}: SitemapDiagramProps) {
  // Use context for state and mutations
  const {
    pages: localPages,
    activeId,
    showSections,
    setActiveId,
    setActiveSectionId,
    setShowSections,
    movePage,
    moveSection,
    deletePage,
    duplicatePage,
  } = useSitemapDiagram();

  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(
    selectedPageId ?? null,
  );
  const [internalZoom, setInternalZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mouseDownOnEmptySpace, setMouseDownOnEmptySpace] = useState(false);
  const mouseDownWasOnEmptySpaceRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const transformRef = React.useRef<HTMLDivElement>(null);
  const zoomRef = React.useRef(externalZoom ?? internalZoom);
  const panRef = React.useRef({ x: 0, y: 0 });
  const hasCenteredRef = React.useRef(false);
  const rafIdRef = React.useRef<number | null>(null);
  const pendingPanRef = React.useRef<{ x: number; y: number } | null>(null);
  const isScrollingRef = React.useRef(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const accumulatedPanDeltaRef = React.useRef({ x: 0, y: 0 });

  const zoom = externalZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;

  // Function to update transform directly via DOM (for smooth scrolling)
  const updateTransform = React.useCallback(
    (
      newPan: { x: number; y: number },
      newZoom?: number,
      skipStateUpdate = false,
    ) => {
      const transformEl = transformRef.current;
      if (!transformEl) return;

      const currentZoom = newZoom ?? zoomRef.current;
      transformEl.style.transform = `translate(${-newPan.x}px, ${-newPan.y}px) scale(${currentZoom})`;
      panRef.current = newPan;

      // Only update React state if not actively scrolling
      if (!skipStateUpdate && !isScrollingRef.current) {
        setPan(newPan);
      }
    },
    [],
  );

  // Sync state when scrolling stops (debounced)
  const scheduleStateSync = React.useCallback(() => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Mark as scrolling
    isScrollingRef.current = true;

    // Debounce state sync until scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      if (pendingPanRef.current) {
        setPan(pendingPanRef.current);
        pendingPanRef.current = null;
      }
      scrollTimeoutRef.current = null;
    }, 150); // 150ms after last scroll event
  }, []);

  // Apply accumulated pan delta via RAF (batched for smooth scrolling)
  const applyPanUpdate = React.useCallback(() => {
    if (
      accumulatedPanDeltaRef.current.x === 0 &&
      accumulatedPanDeltaRef.current.y === 0
    ) {
      rafIdRef.current = null;
      return;
    }

    const currentPan = panRef.current;
    const newPan = {
      x: currentPan.x + accumulatedPanDeltaRef.current.x,
      y: currentPan.y + accumulatedPanDeltaRef.current.y,
    };

    // Reset accumulated delta
    accumulatedPanDeltaRef.current = { x: 0, y: 0 };

    // Update transform directly (skip React state update during scrolling)
    updateTransform(newPan, undefined, true);

    // Schedule state sync when scrolling stops
    pendingPanRef.current = newPan;
    scheduleStateSync();

    rafIdRef.current = null;
  }, [updateTransform, scheduleStateSync]);

  // Schedule pan update via RAF
  const schedulePanUpdate = React.useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(applyPanUpdate);
    }
  }, [applyPanUpdate]);

  // Keep refs in sync with state
  React.useEffect(() => {
    zoomRef.current = zoom;
    // Sync zoom to transform
    updateTransform(panRef.current, zoom);
  }, [zoom, updateTransform]);

  React.useEffect(() => {
    // Only sync if not actively scrolling (to avoid conflicts with wheel handler)
    if (!isScrollingRef.current) {
      panRef.current = pan;
      // Sync pan state to DOM transform (for non-scroll updates like mouse panning)
      updateTransform(pan, undefined, false);
    }
  }, [pan, updateTransform]);

  // Handle undo/redo keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        // Undo/redo handled by context
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        // Undo/redo handled by context
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build tree structure (no layout calculation needed for CSS Grid)
  const tree = useMemo(() => {
    return buildTree(localPages);
  }, [localPages]);

  // Center sitemap on first load
  React.useEffect(() => {
    if (
      hasCenteredRef.current ||
      !containerRef.current ||
      !contentRef.current ||
      tree.length === 0
    )
      return;

    // Wait for content to render
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Find all page nodes to calculate their bounding box
      const pageNodes = content.querySelectorAll("[data-page-node]");
      if (pageNodes.length === 0) return;

      // Get the transform container (parent of content)
      const transformContainer = content.parentElement;
      if (!transformContainer) return;

      // Calculate bounding box of all page nodes in the content's coordinate space
      // We need to account for the zoom transform when converting screen coordinates to local coordinates
      const currentZoom = zoomRef.current;
      const contentRect = content.getBoundingClientRect();
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

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

  // Prevent text selection during panning
  React.useEffect(() => {
    if (!isPanning) return;

    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    // Prevent text selection during panning
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("dragstart", preventSelection);

    return () => {
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("dragstart", preventSelection);
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

        // Accumulate delta for batching
        accumulatedPanDeltaRef.current.x += panDeltaX;
        accumulatedPanDeltaRef.current.y += panDeltaY;

        // Schedule batched update via RAF
        schedulePanUpdate();
      }
    };

    // Use capture phase and non-passive to ensure preventDefault works
    container.addEventListener("wheel", handleWheelNative, {
      passive: false,
      capture: true,
    });

    return () => {
      container.removeEventListener("wheel", handleWheelNative, {
        capture: true,
      });
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Clear scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      // Reset scrolling state
      isScrollingRef.current = false;
      accumulatedPanDeltaRef.current = { x: 0, y: 0 };
    };
  }, [setZoom, schedulePanUpdate]);

  // Early return after all hooks
  if (pages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No pages found</p>
        </div>
      </div>
    );
  }

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    // If a drag is active, don't interfere with panning
    if (activeId) {
      return;
    }

    // Check if clicking on a node or draggable element - if so, don't start panning
    const target = e.target as HTMLElement;

    // Walk up the DOM tree to find if we're inside a draggable element or interactive element
    let current: HTMLElement | null = target;
    let isNodeClick = false;
    let isDropZone = false;
    let isInteractive = false;

    while (current && current !== containerRef.current) {
      // Check for data-page-node attribute (page nodes have this)
      if (current.hasAttribute("data-page-node")) {
        isNodeClick = true;
        break;
      }
      // Check for cursor-grab style (page nodes have this)
      const style = window.getComputedStyle(current);
      if (style.cursor === "grab" || style.cursor === "grabbing") {
        isNodeClick = true;
        break;
      }
      // Check for buttons and interactive elements
      if (
        current.tagName === "BUTTON" ||
        current.getAttribute("role") === "button" ||
        current.tagName === "A" ||
        current.tagName === "INPUT" ||
        current.tagName === "TEXTAREA" ||
        current.tagName === "SELECT"
      ) {
        isInteractive = true;
        break;
      }
      // Check for drop zones (they have data attributes from dnd-kit)
      if (
        current.hasAttribute("data-rbd-droppable-id") ||
        current.getAttribute("data-droppable-id") ||
        current.classList.contains("drop-zone")
      ) {
        isDropZone = true;
        break;
      }
      // Check if element is inside the content area (not empty space)
      if (contentRef.current && contentRef.current.contains(current)) {
        // If we're inside content but not on a node, it might still be empty space
        // Continue checking
      }
      current = current.parentElement;
    }

    // If clicking on a node, interactive element, or drop zone, don't interfere - let dnd-kit handle it
    if (
      (isNodeClick || isDropZone || isInteractive) &&
      e.button === 0 &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      setMouseDownOnEmptySpace(false);
      mouseDownWasOnEmptySpaceRef.current = false;
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

    // For left click on empty space, start panning immediately
    if (e.button === 0 && !isNodeClick && !isDropZone && !isInteractive) {
      e.preventDefault();
      e.stopPropagation();
      setMouseDownOnEmptySpace(true);
      mouseDownWasOnEmptySpaceRef.current = true;
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      setMouseDownOnEmptySpace(false);
      mouseDownWasOnEmptySpaceRef.current = false;
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    // Don't handle panning if a drag is active
    if (activeId) {
      return;
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
    // Don't reset mouseDownWasOnEmptySpaceRef here - we need it for the click handler
    setMouseDownOnEmptySpace(false);
  };

  // Handle click on empty space - prevent selection changes
  const handleClick = (e: React.MouseEvent) => {
    // If the mouse down was on empty space, prevent any selection changes
    if (mouseDownWasOnEmptySpaceRef.current) {
      e.stopPropagation();
      e.preventDefault();
      // Reset the ref after handling
      mouseDownWasOnEmptySpaceRef.current = false;
      // Don't call onPageSelect - keep current selection unchanged
      return;
    }

    // Otherwise, let the click propagate normally (for node clicks, etc.)
  };

  // Handle drag start (for both pages and sections)
  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    const id = event.active.id as string;
    
    if (activeData?.type === "page") {
      setActiveId(id);
    } else if (activeData?.type === "section") {
      setActiveSectionId(id);
      setActiveId(id); // Also set main activeId for UI updates
    }
    
    // Notify parent that dragging has started
    onDragStateChange?.(true);
    
    // Stop any panning when drag starts
    setIsPanning(false);
    setMouseDownOnEmptySpace(false);
    mouseDownWasOnEmptySpaceRef.current = false;
  };

  // Handle drag end (for both pages and sections)
  const handleDragEnd = async (event: DragEndEvent) => {
    const activeData = event.active.data.current;
    
    if (activeData?.type === "page") {
      await movePage(event);
    } else if (activeData?.type === "section") {
      await moveSection(event);
    }
    
    // Notify parent that dragging has ended
    onDragStateChange?.(false);
  };

  // Handle drag over (for both pages and sections)
  const handleDragOver = () => {
    // Could add visual feedback here
  };


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
        onClick={handleClick}
        style={{
          cursor: isPanning
            ? "grabbing"
            : mouseDownOnEmptySpace
              ? "grabbing"
              : "default",
          touchAction: "none",
          userSelect: isPanning ? "none" : "auto",
          WebkitUserSelect: isPanning ? "none" : "auto",
        }}
      >
          {/* Toggle button for showing/hiding sections */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSections(!showSections)}
            className={`absolute top-4 right-4 z-10 transition-all ${
              showSections
                ? "bg-background/95 backdrop-blur-sm border-border shadow-sm"
                : "bg-background/40 backdrop-blur-sm border-border/40 opacity-70"
            }`}
          >
            {showSections ? "Hide Sections" : "Show Sections"}
            {showSections ? (
              <EyeOff className="w-4 h-4 ml-2" />
            ) : (
              <Eye className="w-4 h-4 ml-2" />
            )}
          </Button>
          {/* Transform container for zoom and pan */}
          <div
            ref={transformRef}
            style={{
              transform: `translate(${-pan.x}px, ${-pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              overflow: "visible",
              willChange: "transform",
            }}
          >
            {/* Root level flex container */}
            <div
              ref={contentRef}
              className="w-full h-full p-8"
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: "3rem",
                alignItems: "flex-start",
              }}
            >
              {tree.length === 0 ? (
                <div className="flex items-center justify-center w-full">
                  <p className="text-muted-foreground">No pages found</p>
                </div>
              ) : (
                tree
                  .flatMap((rootNode, index) => [
                    // Drop zone before first node or between nodes
                    activeId && (
                      <div
                        key={`drop-before-${rootNode.id}`}
                        className="absolute pointer-events-auto"
                        style={{
                          left:
                            index === 0
                              ? `calc(${(index * 100) / tree.length}% - 280px)` // Before first: position well to the left
                              : `calc(${(index * 100) / tree.length}% - 140px)`, // Between items: at column boundary
                          top: "-60px",
                          width: "280px",
                          height: "80px",
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
                    <div
                      key={rootNode.id}
                      className="relative"
                      style={{
                        flexShrink: 0,
                        flexGrow: 0,
                        width: "max-content",
                        minWidth: "280px",
                      }}
                    >
                      <PageTreeNode
                        node={rootNode}
                        selectedNodeId={selectedNodeId}
                        onPageSelect={(page) => {
                          setSelectedNodeId(page?.id || null);
                          onPageSelect?.(page);
                        }}
                        onPageEdit={(page) => {
                          setSelectedNodeId(page?.id || null);
                          onPageSelect?.(page);
                        }}
                        onPageDelete={async (page) => {
                          if(!page) return;
                          await deletePage(page.id);
                          if (selectedNodeId === page.id) {
                            setSelectedNodeId(null);
                            onPageSelect?.(null);
                          }
                        }}
                        onPageDuplicate={async (page) => {
                          if (!page) return;
                          await duplicatePage(page);
                        }}
                        onSectionSelect={onSectionSelect}
                      />
                    </div>,

                    // Drop zone after last node
                    activeId && index === tree.length - 1 && (
                      <div
                        key={`drop-after-${rootNode.id}`}
                        className="absolute pointer-events-auto"
                        style={{
                          left: `calc(${((index + 1) * 100) / tree.length}% - 140px)`,
                          top: "-60px",
                          width: "280px",
                          height: "80px",
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
                  ])
                  .filter(Boolean)
              )}
            </div>
          </div>
        </div>
    </DragContext>
  );
}
