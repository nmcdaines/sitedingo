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

  // Detect pointer over section drop zones
  const pointerCollisions = pointerWithin(args);
  console.log('pointerCollisions', pointerCollisions)

  if (pointerCollisions.length > 0) {
    // Fast path: find section drop zones directly
    for (const collision of pointerCollisions) {

      console.log('collision',collision)

      const collisionId = String(collision.id);
      if (collisionId.startsWith('section-drop-') || collisionId.startsWith('drop-section-page-')) {
        return [collision];
      }
    }
    // No section drop zone found
    return [];
  }

  // Find closest section drop zone
  // const collisions = closestCenter(args);
  // for (const collision of collisions) {
  //   if (typeof collision.id === 'string') {
  //     if (collision.id.startsWith('section-drop-') || collision.id.startsWith('drop-section-page-')) {
  //       return [collision];
  //     }
  //   }
  // }

  return [];
};

const pageCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
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
  }

  // Fall back to closestCenter for center-based detection
  const collisions = closestCenter(args);

  if (collisions.length === 0) return [];

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
}

// TODO collisionDetection is not being called.
const collisionDetection: CollisionDetection = (args) => {
  const activeData = args.active.data.current;

  console.log('.....', activeData)

  switch (activeData?.type) {
    case 'section': return sectionCollisionDetection(args);
    case 'page': return pageCollisionDetection(args);
    default: throw new Error(`Unsupported drag type: ${activeData?.type}`);
  }
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
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
    </DndContext>
  );
}
