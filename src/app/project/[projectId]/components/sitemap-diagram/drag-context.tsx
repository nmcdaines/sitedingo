'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCenter, CollisionDetection, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

/**
 * Optimized collision detection for sections
 * Early returns and minimal filtering for better performance
 */
const sectionCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // Fast path: find section drop zones directly and validate type
    for (const collision of pointerCollisions) {
      if (typeof collision.id === 'string') {
        if (collision.id.startsWith('section-drop-') || collision.id.startsWith('drop-section-page-')) {
          // Check that the drop zone expects sections
          const overData = collision.data?.current;
          if (overData && (overData as { expectedType?: string }).expectedType) {
            if ((overData as { expectedType: string }).expectedType !== 'section') {
              continue;
            }
          }
          return [collision];
        }
      }
    }
    // No section drop zone found
    return [];
  }
  
  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);
  
  // Fast path: find first section drop zone and validate type
  for (const collision of collisions) {
    if (typeof collision.id === 'string') {
      if (collision.id.startsWith('section-drop-') || collision.id.startsWith('drop-section-page-')) {
        // Check that the drop zone expects sections
        const overData = collision.data?.current;
        if (overData && (overData as { expectedType?: string }).expectedType) {
          if ((overData as { expectedType: string }).expectedType !== 'section') {
            continue;
          }
        }
        return [collision];
      }
    }
  }
  
  return [];
};

/**
 * Unified collision detection for both pages and sections
 * Uses optimized section detection when dragging sections
 */
const unifiedCollisionDetection: CollisionDetection = (args) => {
  const activeData = args.active.data.current;
  const dragType = activeData?.type;

  // Optimized path for sections
  if (dragType === 'section') {
    return sectionCollisionDetection(args);
  }

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

      // Prioritize page-related drop zones and validate type
      const dropZoneCollision = pageCollisions.find(
        collision => {
          if (typeof collision.id !== 'string' || !collision.id.startsWith('reorder-')) {
            return false;
          }
          // Check that the drop zone expects pages
          const overData = collision.data?.current;
          if (overData && (overData as { expectedType?: string }).expectedType) {
            return (overData as { expectedType: string }).expectedType === 'page';
          }
          // If no expectedType, assume it's a page drop zone (backward compatibility)
          return true;
        }
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
    
    // If the closest is a drop zone, prefer it (for re-ordering) and validate type
    if (typeof closest.id === 'string' && closest.id.startsWith('reorder-')) {
      // Check that the drop zone expects pages
      const overData = closest.data?.current;
      if (overData && (overData as { expectedType?: string }).expectedType) {
        if ((overData as { expectedType: string }).expectedType !== 'page') {
          // If type doesn't match, try other collisions
          const otherCollisions = pageCollisions.filter(c => c !== closest);
          if (otherCollisions.length > 0) {
            return otherCollisions;
          }
          return [];
        }
      }
      return [closest];
    }
    
    // If the closest is a page node, prefer it (for nesting)
    if (typeof closest.id === 'string' && closest.id.startsWith('drop-page-')) {
      return [closest];
    }
    
    return pageCollisions;
  }
  
  // For unknown types, return all collisions
  return collisions;
};

export function DragContext({ children, onDragStart, onDragEnd, onDragOver }: DragContextProps) {
  // Configure sensors with activation constraints for better performance
  // This prevents accidental drags and reduces unnecessary calculations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px of movement before activating drag
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={unifiedCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
    </DndContext>
  );
}

