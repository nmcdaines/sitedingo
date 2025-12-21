'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCenter, CollisionDetection } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

/**
 * Custom collision detection that allows both page nodes and drop zones to be detected
 * Prioritizes the closest target, but allows drop zones to be selected when they're clearly the target
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // Get all collisions using closestCenter
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

