'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Home, Info, Folder, Phone, FileText } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Ref to measure the inner div height
  const innerDivRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure the inner div height
  const measureHeight = useCallback(() => {
    // Skip measurement if this node is being dragged
    // Also skip if being hovered over during drag (isOver might cause visual changes)
    if (isDragging) {
      return;
    }

    if (innerDivRef.current) {
      // Get the foreignObject parent
      const foreignObject = innerDivRef.current.closest('foreignObject') as SVGForeignObjectElement | null;
      
      if (foreignObject) {
        // Temporarily set a very large height to allow content to expand
        // This ensures we can measure the full content height without clipping
        foreignObject.setAttribute('height', '10000');
        
        // Force a reflow by reading a layout property
        void innerDivRef.current.getBoundingClientRect();
        
        // Now measure the actual content height
        const scrollHeight = innerDivRef.current.scrollHeight;
        const offsetHeight = innerDivRef.current.offsetHeight;
        const rectHeight = innerDivRef.current.getBoundingClientRect().height;
        
        // Use the maximum to ensure we capture all content
        let finalHeight = Math.max(scrollHeight, offsetHeight, rectHeight);
        
        // Clamp to a reasonable maximum (estimated height + 50% buffer to prevent absurdly large measurements)
        const maxReasonableHeight = 60 + (showSections && node.sections.length > 0 
          ? node.sections.length * 90 + (node.sections.length - 1) * 8 + 16 
          : 0);
        finalHeight = Math.min(finalHeight, maxReasonableHeight);
        
        // Only update if the height actually changed (avoid unnecessary re-renders)
        setMeasuredHeight(prev => {
          // Only update if change is significant (more than 1px difference)
          if (prev === null || Math.abs(prev - finalHeight) > 1) {
            return finalHeight;
          }
          return prev;
        });
      } else {
        // Fallback if foreignObject not found (shouldn't happen)
        const height = innerDivRef.current.getBoundingClientRect().height;
        setMeasuredHeight(prev => {
          if (prev === null || Math.abs(prev - height) > 1) {
            return height;
          }
          return prev;
        });
      }
    }
  }, [isDragging, showSections, node.sections.length]);

  // Set up ResizeObserver once
  useEffect(() => {
    if (innerDivRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        // Skip if dragging
        if (isDragging) {
          return;
        }

        // Debounce ResizeObserver callbacks
        if (measureTimeoutRef.current) {
          clearTimeout(measureTimeoutRef.current);
        }

        measureTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(() => {
            if (!isDragging) {
              measureHeight();
            }
          });
        }, 150); // Slightly longer debounce for ResizeObserver
      });
      resizeObserverRef.current.observe(innerDivRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [measureHeight, isDragging]);

  // Measure height after render and when dependencies change
  useEffect(() => {
    // Skip measurement if dragging
    if (isDragging) {
      return;
    }

    // Clear any pending measurements
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }

    let rafId: number | null = null;

    // Debounce measurements to avoid rapid updates during drag operations
    measureTimeoutRef.current = setTimeout(() => {
      // Use requestAnimationFrame to ensure DOM is fully laid out
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isDragging) {
            measureHeight();
          }
        });
      });
    }, 100); // 100ms debounce

    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
        measureTimeoutRef.current = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [node.sections, showSections, node.name, measureHeight, isDragging]);

  // Combine refs - set both on the div inside foreignObject
  const setNodeRef = (element: SVGForeignObjectElement | null) => {
    // Cast to HTMLElement for dnd-kit compatibility (SVG elements work at runtime)
    setDraggableRef(element as unknown as HTMLElement);
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

  // Use measured height if available, otherwise fall back to estimated height
  // Start with a generous estimate to prevent clipping during initial render
  const estimatedHeight = 60 + (showSections && node.sections.length > 0 
    ? node.sections.length * 60 + (node.sections.length - 1) * 8 + 16 // Increased from 50 to 60 per section
    : 0);
  // Use measured height if available, otherwise use estimated (which should be generous enough)
  const totalHeight = measuredHeight ?? estimatedHeight;

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
        ref={innerDivRef}
        className={`rounded-lg border-2 p-4 bg-background transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
            : isOver
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:shadow-sm'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ width: node.width }}
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
    </foreignObject>
  );
}

