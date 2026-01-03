/**
 * Page mutation hooks with React Query optimistic updates
 */

import React, { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DragEndEvent } from '@dnd-kit/core';
import { client } from '@/lib/client';
import { getSiblings, calculateSortOrder, TreeNode } from '../../../lib/tree-utils';
import { Page } from '../types';
import { DataAction } from '../state/data-state';
import { parsePageDropZoneId, parseReorderDropZoneId } from '../drag/drop-zone-ids';

interface UsePageMutationsOptions {
  pages: Page[];
  sitemapId?: number;
  dataDispatch: React.Dispatch<DataAction>;
  previousPagesRef: React.MutableRefObject<Page[]>;
  onPageSelect?: (page: Page | null) => void;
}

export function usePageMutations({
  pages,
  sitemapId,
  dataDispatch,
  previousPagesRef,
  onPageSelect,
}: UsePageMutationsOptions) {
  const queryClient = useQueryClient();

  // Add page mutation with optimistic updates
  const addPage = useCallback(async (parentId: number | null, position: number) => {
    if (!sitemapId) return;

    const siblings = pages
      .filter((p) => p.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const validPosition = Math.max(0, Math.min(position, siblings.length));
    const siblingsToShift = siblings.filter(
      (s) => s.sortOrder >= validPosition,
    );

    // Generate temporary ID for optimistic update
    const tempId = -Date.now();
    const tempSlug = `new-page-${Date.now()}`;
    
    // Determine if this is a home page
    const isHomePage = parentId === null && pages.filter(p => p.parentId === null).length === 0;

    const optimisticPage: Page = {
      id: tempId,
      name: 'New Page',
      slug: tempSlug,
      description: null,
      icon: isHomePage ? 'home' : null,
      sortOrder: validPosition,
      parentId: parentId,
      sections: [],
    };

    // Optimistic update
    dataDispatch({
      type: 'ADD_PAGE_OPTIMISTIC',
      payload: {
        page: optimisticPage,
        siblingsToShift: siblingsToShift.map((s) => s.id),
      },
    });

    try {
      const rootPages = pages.filter(p => p.parentId === null);
      const isHomePage = parentId === null && rootPages.length === 0;
      const defaultIcon = isHomePage ? 'home' : null;

      // Create the new page via API
      const newPage = await client.api.pages.post({
        sitemapId: sitemapId,
        parentId: parentId,
        name: 'New Page',
        slug: tempSlug,
        description: null,
        icon: defaultIcon,
        sortOrder: validPosition,
      });

      // Shift all affected siblings
      await Promise.all(
        siblingsToShift.map((sibling) =>
          client.api.pages({ id: sibling.id.toString() }).put({
            name: sibling.name,
            slug: sibling.slug,
            description: sibling.description,
            icon: sibling.icon,
            parentId: sibling.parentId,
            sortOrder: sibling.sortOrder + 1,
          }),
        ),
      );

      // Replace optimistic page with real page
      const actualPage = ('data' in newPage && newPage.data) ? newPage.data : (newPage as unknown as Page);

      dataDispatch({
        type: 'REPLACE_TEMP_PAGE',
        payload: {
          tempId,
          actualPage: {
            id: actualPage.id,
            name: actualPage.name,
            slug: actualPage.slug,
            description: actualPage.description,
            icon: actualPage.icon,
            sortOrder: actualPage.sortOrder,
            parentId: actualPage.parentId,
            sections: [],
          },
        },
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Failed to create page:', error);
      
      // Rollback optimistic update
      dataDispatch({
        type: 'ROLLBACK_ADD_PAGE',
        payload: {
          tempId,
          siblingsToShift: siblingsToShift.map((s) => s.id),
        },
      });

      alert('Failed to create page. Please try again.');
    }
  }, [sitemapId, pages, dataDispatch, queryClient]);

  // Move page mutation
  const movePage = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'page') {
      return;
    }

    const draggedNode = activeData.node as TreeNode;
    const overId = over.id as string;

    let updatedPages: Page[] = pages;

    // Case 1: Dropped on a page node (nesting)
    const newParentId = parsePageDropZoneId(overId);

    if (newParentId !== null) {
      if (draggedNode.id === newParentId) {
        return;
      }

      function isDescendant(node: TreeNode, targetId: number): boolean {
        if (node.id === targetId) return true;
        return node.children?.some((child) => isDescendant(child, targetId)) || false;
      }
      if (isDescendant(draggedNode, newParentId)) {
        return;
      }

      const newSiblings = getSiblings(pages, newParentId, draggedNode.id);
      const newSortOrder =
        newSiblings.length > 0
          ? Math.max(...newSiblings.map((s) => s.sortOrder)) + 1
          : 0;

      updatedPages = pages.map((page) => {
        if (page.id === draggedNode.id) {
          return { ...page, parentId: newParentId, sortOrder: newSortOrder };
        }
        return page;
      });
    } else {
      // Case 2: Dropped on an empty space drop zone (re-ordering)
      // Validate that the drop zone expects pages
      const overData = over.data.current;
      if (overData && (overData as { expectedType?: string }).expectedType !== 'page') {
        return;
      }

      const reorderData = parseReorderDropZoneId(overId);
      if (!reorderData) {
        return;
      }

      const { parentId: targetParentId, position } = reorderData;

      const draggedPage = pages.find((p) => p.id === draggedNode.id);
      if (!draggedPage) {
        return;
      }

      if (targetParentId !== null && targetParentId === draggedNode.id) {
        return;
      }

      if (draggedPage.parentId === targetParentId) {
        const currentSiblings = getSiblings(
          pages,
          targetParentId,
          draggedNode.id,
        );
        const currentIndex = currentSiblings.findIndex(
          (s) => s.sortOrder > draggedPage.sortOrder,
        );
        const effectiveCurrentIndex =
          currentIndex === -1 ? currentSiblings.length : currentIndex;

        if (effectiveCurrentIndex === position) {
          return;
        }
      }

      const { sortOrder, siblingIds } = calculateSortOrder(
        pages,
        draggedNode.id,
        targetParentId,
        position,
      );

      const oldParentId = draggedPage.parentId;
      const oldSiblings = getSiblings(pages, oldParentId, draggedNode.id);
      const oldSiblingIds = oldSiblings.map((s) => s.id);

      updatedPages = pages.map((page) => {
        if (page.id === draggedNode.id) {
          return { ...page, parentId: targetParentId, sortOrder };
        } else if (siblingIds.includes(page.id)) {
          const newIndex = siblingIds.indexOf(page.id);
          return { ...page, sortOrder: newIndex };
        } else if (
          oldSiblingIds.includes(page.id) &&
          oldParentId !== targetParentId
        ) {
          const oldIndex = oldSiblingIds.indexOf(page.id);
          return { ...page, sortOrder: oldIndex };
        }
        return page;
      });
    }

    const hasChanges =
      updatedPages.some((page) => {
        const original = pages.find((p) => p.id === page.id);
        if (!original) return true;
        return (
          page.parentId !== original.parentId ||
          page.sortOrder !== original.sortOrder
        );
      }) || updatedPages.length !== pages.length;

    if (!hasChanges) {
      return;
    }

    // Update pages
    dataDispatch({ type: 'MOVE_PAGE', payload: updatedPages });
  }, [pages, dataDispatch]);

  // Delete page mutation
  const deletePage = useCallback(async (pageId: number) => {
    try {
      await client.api.pages({ id: pageId.toString() }).delete();
      dataDispatch({ type: 'DELETE_PAGE', payload: pageId });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onPageSelect?.(null);
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  }, [dataDispatch, queryClient, onPageSelect]);

  // Duplicate page mutation
  const duplicatePage = useCallback(async (page: Page) => {
    if (!sitemapId) return;

    try {
      await client.api.pages.post({
        sitemapId: sitemapId,
        parentId: page.parentId,
        name: `${page.name} (Copy)`,
        slug: `${page.slug}-copy`,
        description: page.description,
        icon: page.icon,
        sortOrder: page.sortOrder + 1,
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Failed to duplicate page:', error);
    }
  }, [sitemapId, queryClient]);

  return {
    addPage,
    movePage,
    deletePage,
    duplicatePage,
  };
}

