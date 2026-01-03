/**
 * Pan and zoom hook for sitemap diagram
 * Extracted from sitemap-diagram.tsx for better organization and reusability
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UsePanZoomOptions {
  initialZoom?: number;
  externalZoom?: number;
  onZoomChange?: (zoom: number) => void;
}

interface UsePanZoomReturn {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (panStart: { x: number; y: number }) => void;
  transformRef: React.RefObject<HTMLDivElement | null>;
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<{ x: number; y: number }>;
  updateTransform: (newPan: { x: number; y: number }, newZoom?: number, skipStateUpdate?: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomFit: () => void;
  // Internal refs and functions for wheel handler
  rafIdRef: React.MutableRefObject<number | null>; // requestAnimationFrame ID for batched pan updates
  isScrollingRef: React.MutableRefObject<boolean>;
  scrollTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  accumulatedPanDeltaRef: React.MutableRefObject<{ x: number; y: number }>;
  schedulePanUpdate: () => void;
  scheduleStateSync: () => void;
  applyPanUpdate: () => void;
}

export function usePanZoom({
  initialZoom = 0.7,
  externalZoom,
  onZoomChange,
}: UsePanZoomOptions = {}): UsePanZoomReturn {
  const [internalZoom, setInternalZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const transformRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(externalZoom ?? internalZoom);
  const panRef = useRef({ x: 0, y: 0 });
  // RAF = requestAnimationFrame - used for smooth batched pan updates during scrolling
  const rafIdRef = useRef<number | null>(null);
  const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedPanDeltaRef = useRef({ x: 0, y: 0 });

  const zoom = externalZoom ?? internalZoom;
  const setZoom: (zoom: number | ((prev: number) => number)) => void = onZoomChange 
    ? (value) => {
        const newZoom = typeof value === 'function' ? value(zoom) : value;
        onZoomChange(newZoom);
      }
    : (value) => {
        const newZoom = typeof value === 'function' ? value(internalZoom) : value;
        setInternalZoom(newZoom);
      };

  // Function to update transform directly via DOM (for smooth scrolling)
  const updateTransform = useCallback(
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
  const scheduleStateSync = useCallback(() => {
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

  // Apply accumulated pan delta via requestAnimationFrame (batched for smooth scrolling)
  const applyPanUpdate = useCallback(() => {
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

  // Schedule pan update via requestAnimationFrame for smooth batched updates
  const schedulePanUpdate = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(applyPanUpdate);
    }
  }, [applyPanUpdate]);

  // Keep refs in sync with state
  useEffect(() => {
    zoomRef.current = zoom;
    // Sync zoom to transform
    updateTransform(panRef.current, zoom);
  }, [zoom, updateTransform]);

  useEffect(() => {
    // Only sync if not actively scrolling (to avoid conflicts with wheel handler)
    if (!isScrollingRef.current) {
      panRef.current = pan;
      // Sync pan state to DOM transform (for non-scroll updates like mouse panning)
      updateTransform(pan, undefined, false);
    }
  }, [pan, updateTransform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, prev * 1.1));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.3, prev * 0.9));
  }, [setZoom]);

  const handleZoomFit = useCallback(() => {
    setZoom(0.7);
  }, [setZoom]);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    transformRef,
    zoomRef,
    panRef,
    updateTransform,
    handleZoomIn,
    handleZoomOut,
    handleZoomFit,
    // Expose internal refs and functions for wheel handler
    rafIdRef,
    isScrollingRef,
    scrollTimeoutRef,
    accumulatedPanDeltaRef,
    schedulePanUpdate,
    scheduleStateSync,
    applyPanUpdate,
  };
}

