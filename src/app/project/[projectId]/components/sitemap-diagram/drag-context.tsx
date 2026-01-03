'use client';

import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { unifiedCollisionDetection } from './drag/collision-detection';

interface DragContextProps {
  children: ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

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

