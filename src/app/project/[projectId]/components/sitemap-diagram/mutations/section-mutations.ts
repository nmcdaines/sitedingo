/**
 * Section mutation hooks with React Query optimistic updates
 */

import React, { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DragEndEvent } from '@dnd-kit/core';
import { client } from '@/lib/client';
import { Page } from '../types';
import { DataAction } from '../state/data-state';
import { parseSectionDropZoneId } from '../drag/drop-zone-ids';

interface UseSectionMutationsOptions {
  pages: Page[];
  dataDispatch: React.Dispatch<DataAction>;
  previousPagesRef: React.MutableRefObject<Page[]>;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export function useSectionMutations({
  pages,
  dataDispatch,
  previousPagesRef,
  setSaveStatus,
}: UseSectionMutationsOptions) {
  const queryClient = useQueryClient();

  // Add section mutation
  const addSection = useCallback(async (pageId: number, position?: number) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      console.error('Page not found:', pageId);
      return;
    }

    const sections = [...page.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetPosition = position !== undefined ? position : sections.length;

    try {
      const newSection = await client.api.sections.post({
        pageId: pageId,
        componentType: 'hero',
        name: 'New Section',
        metadata: {},
        sortOrder: targetPosition,
      });

      const actualSection = ('data' in newSection && newSection.data) ? newSection.data : (newSection as unknown as { id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number });

      // Update local state optimistically
      const updatedPages = pages.map((p) => {
        if (p.id === pageId) {
          const updatedSections = [...sections];
          updatedSections.splice(targetPosition, 0, {
            id: actualSection.id,
            componentType: actualSection.componentType,
            name: actualSection.name,
            metadata: actualSection.metadata,
            sortOrder: targetPosition,
          });
          // Reorder all sections to have correct sortOrder
          const reorderedSections = updatedSections.map((s, idx) => ({
            ...s,
            sortOrder: idx,
          }));

          return {
            ...p,
            sections: reorderedSections,
          };
        }
        return p;
      });

      dataDispatch({ type: 'SET_PAGES', payload: updatedPages });

      // Update sort orders for sections that were shifted
      const sectionsToUpdate = sections.slice(targetPosition);
      if (sectionsToUpdate.length > 0) {
        await Promise.all(
          sectionsToUpdate.map((section, idx) =>
            client.api.sections({ id: section.id.toString() }).put({
              componentType: section.componentType,
              name: section.name,
              metadata: section.metadata,
              sortOrder: targetPosition + 1 + idx,
              pageId: pageId,
            }),
          ),
        );
      }

      previousPagesRef.current = updatedPages;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Failed to create section:', error);
      alert('Failed to create section. Please try again.');
    }
  }, [pages, dataDispatch, previousPagesRef, queryClient]);

  // Move section mutation
  const moveSection = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'section') {
      return;
    }

    const draggedSection = activeData.section as {
      id: number;
      componentType: string;
      name: string | null;
      metadata: Record<string, unknown>;
      sortOrder: number;
    };
    const sourcePageId = activeData.pageId as number;
    const overId = over.id as string;

    // Validate that the drop zone expects sections
    const overData = over.data.current;
    if (overData && (overData as { expectedType?: string }).expectedType !== 'section') {
      return;
    }

    const sectionDropZoneData = parseSectionDropZoneId(overId);
    if (!sectionDropZoneData) {
      return;
    }

    const { pageId: targetPageId, position: parsedPosition } = sectionDropZoneData;
    let targetPosition: number;

    // If position is -1, it means "append to end"
    if (parsedPosition === -1) {
      const targetPageForLength = pages.find((p) => p.id === targetPageId);
      if (!targetPageForLength) {
        return;
      }
      targetPosition = targetPageForLength.sections.length;
    } else {
      targetPosition = parsedPosition;
    }

    const targetPage = pages.find((p) => p.id === targetPageId);
    const sourcePage = pages.find((p) => p.id === sourcePageId);

    if (!targetPage) {
      return;
    }

    const isSamePage = sourcePageId === targetPageId;

    if (isSamePage) {
      const currentSections = [...targetPage.sections].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const currentIndex = currentSections.findIndex(
        (s) => s.id === draggedSection.id,
      );
      if (
        currentIndex === targetPosition ||
        (currentIndex === targetPosition - 1 &&
          targetPosition === currentSections.length)
      ) {
        return;
      }
    }

    const originalPages = [...pages];

    setSaveStatus('saving');

    try {
      const targetSections = [...targetPage.sections].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const sectionsToReorder = isSamePage
        ? targetSections.filter((s) => s.id !== draggedSection.id)
        : targetSections;

      const newTargetSections = [...sectionsToReorder];
      newTargetSections.splice(targetPosition, 0, {
        ...draggedSection,
        sortOrder: targetPosition,
      });

      const updatedTargetSections = newTargetSections.map((section, index) => ({
        ...section,
        sortOrder: index,
      }));

      const updatedPages = pages.map((page) => {
        if (page.id === targetPageId) {
          return {
            ...page,
            sections: updatedTargetSections,
          };
        } else if (!isSamePage && page.id === sourcePageId && sourcePage) {
          const remainingSections = sourcePage.sections
            .filter((s) => s.id !== draggedSection.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((section, index) => ({
              ...section,
              sortOrder: index,
            }));

          return {
            ...page,
            sections: remainingSections,
          };
        }
        return page;
      });

      dataDispatch({ type: 'MOVE_SECTION', payload: updatedPages });

      const targetUpdates = updatedTargetSections.map((section) => {
        return client.api.sections({ id: section.id.toString() }).put({
          componentType: section.componentType,
          name: section.name,
          metadata: section.metadata,
          sortOrder: section.sortOrder,
          pageId: targetPageId,
        });
      });

      await Promise.all(targetUpdates);

      if (!isSamePage && sourcePage) {
        const remainingSections = sourcePage.sections
          .filter((s) => s.id !== draggedSection.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        const sourceUpdates = remainingSections.map((section, index) =>
          client.api.sections({ id: section.id.toString() }).put({
            componentType: section.componentType,
            name: section.name,
            metadata: section.metadata,
            sortOrder: index,
            pageId: sourcePageId,
          }),
        );

        await Promise.all(sourceUpdates);
      }

      previousPagesRef.current = updatedPages;
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to move section:', error);
      dataDispatch({ type: 'SET_PAGES', payload: originalPages });
      previousPagesRef.current = originalPages;

      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  }, [pages, dataDispatch, previousPagesRef, queryClient, setSaveStatus]);

  // Update section mutation
  const updateSection = useCallback(async (
    sectionId: number,
    updates: { name?: string | null; componentType?: string; metadata?: Record<string, unknown> }
  ) => {
    try {
      const page = pages.find((p) =>
        p.sections.some((s) => s.id === sectionId),
      );
      if (!page) {
        console.error('Page not found for section:', sectionId);
        return;
      }

      const section = page.sections.find((s) => s.id === sectionId);
      if (!section) {
        console.error('Section not found:', sectionId);
        return;
      }

      const updatedSection = await client.api.sections({ id: sectionId.toString() }).put({
        componentType: updates.componentType ?? section.componentType,
        name: updates.name ?? section.name,
        metadata: updates.metadata ?? section.metadata,
        sortOrder: section.sortOrder,
        pageId: page.id,
      });

      const actualSection = ('data' in updatedSection && updatedSection.data) ? updatedSection.data : (updatedSection as unknown as { id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number });

      // Update local state
      const updatedPages = pages.map((p) => {
        if (p.id === page.id) {
          return {
            ...p,
            sections: p.sections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    name: actualSection.name,
                    componentType: actualSection.componentType,
                    metadata: actualSection.metadata,
                  }
                : s,
            ),
          };
        }
        return p;
      });

      dataDispatch({ type: 'SET_PAGES', payload: updatedPages });
      previousPagesRef.current = updatedPages;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Failed to update section:', error);
      alert('Failed to update section. Please try again.');
    }
  }, [pages, dataDispatch, previousPagesRef, queryClient]);

  return {
    addSection,
    moveSection,
    updateSection,
  };
}

