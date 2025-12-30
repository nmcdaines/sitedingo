'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, CollisionDetection, pointerWithin, closestCenter } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface SectionDragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

/**
 * Collision detection optimized for sections
 * Only detects section drop zones, ignoring page-related drop zones
 */
const sectionCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // When dragging sections, only look for section drop zones
    const sectionDropZoneCollision = pointerCollisions.find(
      collision => {
        if (typeof collision.id !== 'string') return false;
        return collision.id.startsWith('section-drop-') || 
               collision.id.startsWith('drop-section-page-');
      }
    );
    if (sectionDropZoneCollision) {
      return [sectionDropZoneCollision];
    }
    
    // If no section drop zone found, try to find any droppable that might accept sections
    // This helps when dragging over the page container
    return pointerCollisions;
  }
  
  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);
  
  if (collisions.length === 0) return [];
  
  // Filter to only section-related drop zones
  const sectionCollisions = collisions.filter(collision => {
    if (typeof collision.id !== 'string') return false;
    return collision.id.startsWith('section-drop-') || 
           collision.id.startsWith('drop-section-page-');
  });
  
  if (sectionCollisions.length > 0) {
    return [sectionCollisions[0]]; // Return the closest section drop zone
  }
  
  // If no section drop zones found, return empty (don't allow dropping on pages)
  return [];
};

export function SectionDragContext({ children, onDragStart, onDragEnd, onDragOver }: SectionDragContextProps) {
  return (
    <DndContext
      collisionDetection={sectionCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
    </DndContext>
  );
}

