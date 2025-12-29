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
 * Custom collision detection that allows both page nodes and drop zones to be detected
 * Uses pointerWithin for better detection with transformed containers, then falls back to closestCenter
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // If we have pointer collisions, prioritize drop zones
    const dropZoneCollision = pointerCollisions.find(
      collision => typeof collision.id === 'string' && collision.id.startsWith('reorder-')
    );
    if (dropZoneCollision) {
      return [dropZoneCollision];
    }
    
    // Then prioritize page drop zones
    const pageDropZoneCollision = pointerCollisions.find(
      collision => typeof collision.id === 'string' && collision.id.startsWith('drop-page-')
    );
    if (pageDropZoneCollision) {
      return [pageDropZoneCollision];
    }
    
    // Return all pointer collisions
    return pointerCollisions;
  }
  
  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);
  
  if (collisions.length === 0) return [];
  
  // Get the closest collision
  const closest = collisions[0];
  if (!closest) return collisions;
  
  // If the closest is a drop zone, prefer it (for re-ordering)
  if (typeof closest.id === 'string' && closest.id.startsWith('reorder-')) {
    return [closest];
  }
  
  // If the closest is a page node, prefer it (for nesting)
  if (typeof closest.id === 'string' && closest.id.startsWith('drop-page-')) {
    return [closest];
  }
  
  // Otherwise return all collisions
  return collisions;
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

