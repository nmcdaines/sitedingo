'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCenter, CollisionDetection, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

/**
 * Custom collision detection for pages
 * Uses pointerWithin for better detection with transformed containers, then falls back to closestCenter
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First check if we're dragging a page (not a section)
  const activeData = args.active.data.current;
  if (activeData?.type !== 'page') {
    // If not a page, return empty to let nested contexts handle it
    return [];
  }

  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // Filter out section-related drop zones
    const pageCollisions = pointerCollisions.filter(
      collision => {
        if (typeof collision.id !== 'string') return true;
        // Ignore section drop zones
        return !collision.id.startsWith('section-drop-') && 
               !collision.id.startsWith('drop-section-page-');
      }
    );

    if (pageCollisions.length === 0) return [];

    // When dragging pages, prioritize page-related drop zones
    // If we have pointer collisions, prioritize drop zones
    const dropZoneCollision = pageCollisions.find(
      collision => typeof collision.id === 'string' && collision.id.startsWith('reorder-')
    );
    if (dropZoneCollision) {
      return [dropZoneCollision];
    }
    
    // Then prioritize page drop zones
    const pageDropZoneCollision = pageCollisions.find(
      collision => typeof collision.id === 'string' && collision.id.startsWith('drop-page-')
    );
    if (pageDropZoneCollision) {
      return [pageDropZoneCollision];
    }
    
    // Return filtered pointer collisions
    return pageCollisions;
  }
  
  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);
  
  if (collisions.length === 0) return [];
  
  // Filter out section-related drop zones
  const pageCollisions = collisions.filter(
    collision => {
      if (typeof collision.id !== 'string') return true;
      // Ignore section drop zones
      return !collision.id.startsWith('section-drop-') && 
             !collision.id.startsWith('drop-section-page-');
    }
  );

  if (pageCollisions.length === 0) return [];

  // Get the closest collision
  const closest = pageCollisions[0];
  if (!closest) return pageCollisions;
  
  // If the closest is a drop zone, prefer it (for re-ordering)
  if (typeof closest.id === 'string' && closest.id.startsWith('reorder-')) {
    return [closest];
  }
  
  // If the closest is a page node, prefer it (for nesting)
  if (typeof closest.id === 'string' && closest.id.startsWith('drop-page-')) {
    return [closest];
  }
  
  // Otherwise return filtered collisions
  return pageCollisions;
};

export function DragContext({ children, onDragStart, onDragEnd, onDragOver }: DragContextProps) {
  return (
    <DndContext
      collisionDetection={customCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
    </DndContext>
  );
}

