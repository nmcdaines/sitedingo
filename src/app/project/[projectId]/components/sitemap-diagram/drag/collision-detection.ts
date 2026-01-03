/**
 * Simplified collision detection for drag-and-drop
 * Uses type-safe drop zone helpers
 */

import { CollisionDetection, pointerWithin, closestCenter } from '@dnd-kit/core';
import {
  isSectionDropZoneId,
  isPageDropZoneId,
  isReorderDropZoneId,
} from './drop-zone-ids';

/**
 * Simplified collision detection for sections
 */
export const sectionCollisionDetection: CollisionDetection = (args) => {
  // First try pointerWithin for better detection with transformed containers
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    // Find section drop zones
    for (const collision of pointerCollisions) {
      if (typeof collision.id === 'string' && isSectionDropZoneId(collision.id)) {
        // Validate that the drop zone expects sections
        const overData = collision.data?.current;
        if (overData && (overData as { expectedType?: string }).expectedType) {
          if ((overData as { expectedType: string }).expectedType !== 'section') {
            continue;
          }
        }
        return [collision];
      }
    }
    return [];
  }
  
  // Fall back to closestCenter
  const collisions = closestCenter(args);
  
  for (const collision of collisions) {
    if (typeof collision.id === 'string' && isSectionDropZoneId(collision.id)) {
      const overData = collision.data?.current;
      if (overData && (overData as { expectedType?: string }).expectedType) {
        if ((overData as { expectedType: string }).expectedType !== 'section') {
          continue;
        }
      }
      return [collision];
    }
  }
  
  return [];
};

/**
 * Unified collision detection for both pages and sections
 */
export const unifiedCollisionDetection: CollisionDetection = (args) => {
  const activeData = args.active.data.current;
  const dragType = activeData?.type;

  // Optimized path for sections
  if (dragType === 'section') {
    return sectionCollisionDetection(args);
  }

  // For pages, use pointerWithin first
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    if (dragType === 'page') {
      // Filter out section-related drop zones
      const pageCollisions = pointerCollisions.filter(
        collision => {
          if (typeof collision.id !== 'string') return true;
          return !isSectionDropZoneId(collision.id);
        }
      );

      if (pageCollisions.length === 0) return [];

      // Prioritize reorder drop zones (for re-ordering)
      const reorderCollision = pageCollisions.find(
        collision => {
          if (typeof collision.id !== 'string' || !isReorderDropZoneId(collision.id)) {
            return false;
          }
          const overData = collision.data?.current;
          if (overData && (overData as { expectedType?: string }).expectedType) {
            return (overData as { expectedType: string }).expectedType === 'page';
          }
          return true; // Backward compatibility
        }
      );
      if (reorderCollision) {
        return [reorderCollision];
      }
      
      // Then page drop zones (for nesting)
      const pageDropZoneCollision = pageCollisions.find(
        collision => typeof collision.id === 'string' && isPageDropZoneId(collision.id)
      );
      if (pageDropZoneCollision) {
        return [pageDropZoneCollision];
      }
      
      return pageCollisions;
    }
    
    return pointerCollisions;
  }
  
  // Fall back to closestCenter
  const collisions = closestCenter(args);
  
  if (collisions.length === 0) return [];
  
  if (dragType === 'page') {
    // Filter out section-related drop zones
    const pageCollisions = collisions.filter(
      collision => {
        if (typeof collision.id !== 'string') return true;
        return !isSectionDropZoneId(collision.id);
      }
    );

    if (pageCollisions.length === 0) return [];

    // Get the closest collision
    const closest = pageCollisions[0];
    if (!closest) return pageCollisions;
    
    // If the closest is a reorder drop zone, prefer it
    if (typeof closest.id === 'string' && isReorderDropZoneId(closest.id)) {
      const overData = closest.data?.current;
      if (overData && (overData as { expectedType?: string }).expectedType) {
        if ((overData as { expectedType: string }).expectedType !== 'page') {
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
    if (typeof closest.id === 'string' && isPageDropZoneId(closest.id)) {
      return [closest];
    }
    
    return pageCollisions;
  }
  
  return collisions;
};

