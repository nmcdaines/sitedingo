'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCenter, CollisionDetection, pointerWithin } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

/**
 * Unified collision detection for both pages and sections
 * Uses pointerWithin for better detection with transformed containers, then falls back to closestCenter
 */
const unifiedCollisionDetection: CollisionDetection = (args) => {
  const activeData = args.active.data.current;
  const dragType = activeData?.type;

  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    if (dragType === 'page') {
      // When dragging pages, filter out section-related drop zones
      const pageCollisions = pointerCollisions.filter(
        collision => {
          if (typeof collision.id !== 'string') return true;
          // Ignore section drop zones
          return !collision.id.startsWith('section-drop-') && 
                 !collision.id.startsWith('drop-section-page-');
        }
      );

      if (pageCollisions.length === 0) return [];

      // Prioritize page-related drop zones
      const dropZoneCollision = pageCollisions.find(
        collision => typeof collision.id === 'string' && collision.id.startsWith('reorder-')
      );
      if (dropZoneCollision) {
        return [dropZoneCollision];
      }
      
      const pageDropZoneCollision = pageCollisions.find(
        collision => typeof collision.id === 'string' && collision.id.startsWith('drop-page-')
      );
      if (pageDropZoneCollision) {
        return [pageDropZoneCollision];
      }
      
      return pageCollisions;
    } else if (dragType === 'section') {
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
      return pointerCollisions;
    }
    
    // For unknown types, return all collisions
    return pointerCollisions;
  }
  
  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);
  
  if (collisions.length === 0) return [];
  
  if (dragType === 'page') {
    // Filter out section-related drop zones for pages
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
    
    return pageCollisions;
  } else if (dragType === 'section') {
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
  }
  
  // For unknown types, return all collisions
  return collisions;
};

export function DragContext({ children, onDragStart, onDragEnd, onDragOver }: DragContextProps) {
  return (
    <DndContext
      collisionDetection={unifiedCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
    </DndContext>
  );
}

