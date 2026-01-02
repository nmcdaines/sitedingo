'use client';

import { useDndContext } from '@dnd-kit/core';
import { useMemo } from 'react';

/**
 * Hook to get information about which drop zone is currently being hovered
 * Returns the drop zone ID and the dragged page node if applicable
 */
export function useDropZoneHover() {
  const { active, over } = useDndContext();

  return useMemo(() => {
    if (!active || !over) return null;

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'page' || !activeData.node) {
      return null;
    }

    const overId = over.id as string;
    // Check if we're over a reorder drop zone
    if (typeof overId === 'string' && overId.startsWith('reorder-')) {
      const overData = over.data.current;
      if (overData && (overData as { expectedType?: string }).expectedType === 'page') {
        return {
          dropZoneId: overId,
          draggedNode: activeData.node,
          parentId: (overData as { parentId?: number | null }).parentId ?? null,
          position: (overData as { position?: number }).position ?? 0,
        };
      }
    }

    return null;
  }, [active, over]);
}

