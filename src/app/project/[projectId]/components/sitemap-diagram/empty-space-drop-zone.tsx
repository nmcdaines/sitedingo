'use client';

import { cn } from '@/lib/utils';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { useMemo } from 'react';
import { createReorderDropZoneId } from './drag/drop-zone-ids';

interface EmptySpaceDropZoneProps {
  parentId: number | null;
  position: number;
  type: 'page' | 'section';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isVisible?: boolean;
  className?: string;
  currentNode?: { id: number; position: number };
  direction?: 'previous' | 'next';
}

export function EmptySpaceDropZone({
  parentId,
  position,
  type,
  width = 280,
  height = 60,
  isVisible = false,
  className = '',
  currentNode,
  direction,
}: EmptySpaceDropZoneProps) {
  const { active } = useDndContext();

  const droppableId = useMemo(() => {
    if (type === 'page') {
      return createReorderDropZoneId(parentId, position);
    }
    // For sections, use the old format for now (can be updated later)
    return [
      'reorder-section',
      parentId ?? 'root',
      position
    ].join('-');
  }, [type, parentId, position]);

  const activeNode = useMemo(() => {
    const activeData = active?.data.current;
    return activeData?.type === type && activeData?.node
      ? {
        id: activeData.node.id,
        position: activeData.node.sortOrder,
      }
      : null;
  }, [active, type]);

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: droppableId,
    data: {
      type: 'empty-space',
      expectedType: type,
      parentId,
      position,
      activeNode,
    },
  });

  // Calculate if this drop zone should be hidden
  const shouldHide = useMemo(() => {
    if (!currentNode || !active) return false;

    const activeData = active.data.current;
    if (!activeData) return false;

    // Hide if active item matches currentNode (by id and type)
    // activeData has: { type: 'page', node: TreeNode }
    // We need to check both the type and the node's id
    if (activeData.type === type && activeData.node?.id === currentNode.id) return true;

    // Hide if currentNode position is adjacent to this drop zone's position
    if (direction === 'previous' && currentNode.position === activeData.node?.sortOrder + 1 && parentId === activeData.node.parentId) return true;

    if (direction === 'next' && currentNode.position === activeData.node?.sortOrder - 1 && parentId === activeData.node.parentId) return true;

    return false;
  }, [currentNode, active, type, direction, parentId]);

  // Combine visibility logic
  const effectiveVisibility = isVisible && !shouldHide;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full relative transition-all duration-200 flex items-center justify-center drop-zone",
        effectiveVisibility ? (isOver ? 'opacity-100' : 'opacity-60') : 'opacity-0',
        isOver
          ? 'bg-primary/40 border-2 border-solid border-primary shadow-xl rounded-lg'
          : 'bg-primary/20 border-2 border-dashed border-primary/70 rounded-lg',
        className
      )}
      style={{
        minHeight: height,
        minWidth: width,
        pointerEvents: effectiveVisibility ? 'auto' : 'none',
        zIndex: isOver ? 20 : 5,
      }}
    >
      {isOver && <div className="w-1 h-full bg-gray-600 rounded-full shadow-lg animate-pulse ml-auto mr-auto" />}
    </div>
  );
}
