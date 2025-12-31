'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { client } from '@/lib/client';
import { getSiblings, calculateSortOrder } from '../../lib/tree-utils';

export interface Page {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: number | null;
  sections: Array<{
    id: number;
    componentType: string;
    name: string | null;
    metadata: any;
    sortOrder: number;
  }>;
}

// ============================================================================
// Visual State Reducer (UI-related state)
// ============================================================================

interface VisualState {
  activeId: string | null;
  activeSectionId: string | null;
  showSections: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

type VisualAction =
  | { type: 'SET_ACTIVE_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_SECTION_ID'; payload: string | null }
  | { type: 'SET_SHOW_SECTIONS'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: 'idle' | 'saving' | 'saved' | 'error' }
  | { type: 'CLEAR_ACTIVE_IDS' };

const initialVisualState: VisualState = {
  activeId: null,
  activeSectionId: null,
  showSections: true,
  saveStatus: 'idle',
};

function visualReducer(state: VisualState, action: VisualAction): VisualState {
  switch (action.type) {
    case 'SET_ACTIVE_ID':
      return { ...state, activeId: action.payload };
    case 'SET_ACTIVE_SECTION_ID':
      return { ...state, activeSectionId: action.payload };
    case 'SET_SHOW_SECTIONS':
      return { ...state, showSections: action.payload };
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };
    case 'CLEAR_ACTIVE_IDS':
      return { ...state, activeId: null, activeSectionId: null };
    default:
      return state;
  }
}

// ============================================================================
// Data State Reducer (Pages and history)
// ============================================================================

interface DataState {
  pages: Page[];
  history: Page[][];
  historyIndex: number;
}

type DataAction =
  | { type: 'SET_PAGES'; payload: Page[] }
  | { type: 'UPDATE_PAGES'; payload: (pages: Page[]) => Page[] }
  | { type: 'ADD_PAGE_OPTIMISTIC'; payload: { page: Page; siblingsToShift: number[] } }
  | { type: 'REPLACE_TEMP_PAGE'; payload: { tempId: number; actualPage: Page } }
  | { type: 'ROLLBACK_ADD_PAGE'; payload: { tempId: number; siblingsToShift: number[] } }
  | { type: 'DELETE_PAGE'; payload: number }
  | { type: 'MOVE_PAGE'; payload: Page[] }
  | { type: 'MOVE_SECTION'; payload: Page[] }
  | { type: 'ADD_TO_HISTORY'; payload: Page[] }
  | { type: 'RESET_HISTORY'; payload: Page[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const initialDataState = (initialPages: Page[]): DataState => ({
  pages: initialPages,
  history: [initialPages],
  historyIndex: 0,
});

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    
    case 'UPDATE_PAGES':
      return { ...state, pages: action.payload(state.pages) };
    
    case 'ADD_PAGE_OPTIMISTIC': {
      const { page, siblingsToShift } = action.payload;
      const updatedPages = state.pages.map((p) => {
        if (siblingsToShift.includes(p.id)) {
          return { ...p, sortOrder: p.sortOrder + 1 };
        }
        return p;
      });
      updatedPages.push(page);
      return { ...state, pages: updatedPages };
    }
    
    case 'REPLACE_TEMP_PAGE': {
      const { tempId, actualPage } = action.payload;
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === tempId ? actualPage : p
        ),
      };
    }
    
    case 'ROLLBACK_ADD_PAGE': {
      const { tempId, siblingsToShift } = action.payload;
      return {
        ...state,
        pages: state.pages
          .filter((p) => p.id !== tempId)
          .map((p) => {
            if (siblingsToShift.includes(p.id)) {
              return { ...p, sortOrder: p.sortOrder - 1 };
            }
            return p;
          }),
      };
    }
    
    case 'DELETE_PAGE':
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== action.payload),
      };
    
    case 'MOVE_PAGE':
    case 'MOVE_SECTION':
      return { ...state, pages: action.payload };
    
    case 'ADD_TO_HISTORY': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.payload);
      return {
        ...state,
        pages: action.payload,
        history: newHistory.slice(-50), // Keep last 50 states
        historyIndex: newHistory.length - 1,
      };
    }
    
    case 'RESET_HISTORY':
      return {
        ...state,
        pages: action.payload,
        history: [action.payload],
        historyIndex: 0,
      };
    
    case 'UNDO':
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1];
        return {
          ...state,
          pages: previousState,
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;
    
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...state,
          pages: nextState,
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;
    
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface SitemapDiagramContextValue {
  // State
  pages: Page[];
  activeId: string | null;
  activeSectionId: string | null;
  showSections: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setActiveId: (id: string | null) => void;
  setActiveSectionId: (id: string | null) => void;
  setShowSections: (show: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  
  // Mutations
  addPage: (parentId: number | null, position: number) => Promise<void>;
  movePage: (event: DragEndEvent) => Promise<void>;
  moveSection: (event: DragEndEvent) => Promise<void>;
  deletePage: (pageId: number) => Promise<void>;
  duplicatePage: (page: Page) => Promise<void>;
  undo: () => void;
  redo: () => void;
  
  // Internal state (for auto-save)
  updatePages: (updater: (pages: Page[]) => Page[]) => void;
}

const SitemapDiagramContext = createContext<SitemapDiagramContextValue | null>(null);

export function useSitemapDiagram() {
  const context = useContext(SitemapDiagramContext);
  if (!context) {
    throw new Error('useSitemapDiagram must be used within SitemapDiagramProvider');
  }
  return context;
}

interface SitemapDiagramProviderProps {
  children: React.ReactNode;
  initialPages: Page[];
  sitemapId?: number;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onPageSelect?: (page: Page | null) => void;
}

export function SitemapDiagramProvider({
  children,
  initialPages,
  sitemapId,
  onSaveStatusChange,
  onPageSelect,
}: SitemapDiagramProviderProps) {
  const queryClient = useQueryClient();
  
  // Reducers
  const [visualState, visualDispatch] = useReducer(visualReducer, initialVisualState);
  const [dataState, dataDispatch] = useReducer(dataReducer, initialPages, initialDataState);
  
  // Refs for auto-save
  const previousPagesRef = useRef<Page[]>(initialPages);
  const isInitialMountRef = useRef(true);
  const isSavingRef = useRef(false);

  // Update pages when prop changes (from server)
  useEffect(() => {
    const pagesMap = new Map(initialPages.map((p) => [p.id, p]));
    const prevPagesMap = new Map(
      previousPagesRef.current.map((p) => [p.id, p]),
    );

    const pagesChanged =
      initialPages.length !== previousPagesRef.current.length ||
      initialPages.some((page) => {
        const prev = prevPagesMap.get(page.id);
        if (!prev) return true;

        // Check page-level changes
        if (
          page.parentId !== prev.parentId ||
          page.sortOrder !== prev.sortOrder ||
          page.name !== prev.name ||
          page.slug !== prev.slug
        ) {
          return true;
        }

        // Check section changes
        const prevSectionsMap = new Map(prev.sections.map((s) => [s.id, s]));

        if (page.sections.length !== prev.sections.length) return true;

        const sectionsChanged =
          page.sections.some((section) => {
            const prevSection = prevSectionsMap.get(section.id);
            return (
              !prevSection ||
              section.sortOrder !== prevSection.sortOrder ||
              section.componentType !== prevSection.componentType ||
              section.name !== prevSection.name
            );
          }) ||
          prev.sections.some(
            (prevSection) =>
              !page.sections.some((s) => s.id === prevSection.id),
          );

        return sectionsChanged;
      }) ||
      previousPagesRef.current.some((prev) => !pagesMap.has(prev.id));

    if (pagesChanged) {
      const pagesWithSortedSections = initialPages.map((page) => ({
        ...page,
        sections: [...page.sections].sort((a, b) => a.sortOrder - b.sortOrder),
      }));

      dataDispatch({ type: 'RESET_HISTORY', payload: pagesWithSortedSections });
      previousPagesRef.current = pagesWithSortedSections;
    }
  }, [initialPages]);

  // Save status setter that also notifies parent
  const setSaveStatus = useCallback((status: 'idle' | 'saving' | 'saved' | 'error') => {
    visualDispatch({ type: 'SET_SAVE_STATUS', payload: status });
    onSaveStatusChange?.(status);
  }, [onSaveStatusChange]);

  // Update pages helper
  const updatePages = useCallback((updater: (pages: Page[]) => Page[]) => {
    dataDispatch({ type: 'UPDATE_PAGES', payload: updater });
  }, []);

  // Auto-save mutation
  const savePageMutation = useMutation({
    mutationFn: async (page: {
      id: number;
      parentId: number | null;
      sortOrder: number;
    }) => {
      const pageData = dataState.pages.find((p) => p.id === page.id);
      if (!pageData) throw new Error('Page not found');

      return await client.api.pages({ id: page.id.toString() }).put({
        name: pageData.name,
        slug: pageData.slug,
        description: pageData.description,
        parentId: pageData.parentId,
        sortOrder: pageData.sortOrder,
      });
    },
  });

  // Auto-save when pages change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPagesRef.current = dataState.pages;
      return;
    }

    const changedPages = dataState.pages.filter((page) => {
      const originalPage = previousPagesRef.current.find(
        (p) => p.id === page.id,
      );
      if (!originalPage) return false;

      return (
        page.parentId !== originalPage.parentId ||
        page.sortOrder !== originalPage.sortOrder
      );
    });

    if (changedPages.length === 0) {
      previousPagesRef.current = dataState.pages;
      return;
    }

    if (isSavingRef.current) {
      return;
    }

    (async () => {
      isSavingRef.current = true;

      const stillChanged = dataState.pages.filter((page) => {
        const originalPage = previousPagesRef.current.find(
          (p) => p.id === page.id,
        );
        if (!originalPage) return false;

        return (
          page.parentId !== originalPage.parentId ||
          page.sortOrder !== originalPage.sortOrder
        );
      });

      if (stillChanged.length === 0) {
        previousPagesRef.current = dataState.pages;
        isSavingRef.current = false;
        return;
      }

      setSaveStatus('saving');

      try {
        await Promise.all(
          stillChanged.map((page) => {
            const pageData = dataState.pages.find((p) => p.id === page.id)!;
            return savePageMutation.mutateAsync({
              id: page.id,
              parentId: pageData.parentId,
              sortOrder: pageData.sortOrder,
            });
          }),
        );

        queryClient.invalidateQueries({ queryKey: ['projects'] });
        previousPagesRef.current = dataState.pages;

        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 5000);
      } finally {
        isSavingRef.current = false;
      }
    })();
  }, [dataState.pages, savePageMutation, queryClient, setSaveStatus]);

  // Add page mutation
  const addPage = useCallback(async (parentId: number | null, position: number) => {
    if (!sitemapId) return;

    const siblings = dataState.pages
      .filter((p) => p.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const validPosition = Math.max(0, Math.min(position, siblings.length));
    const siblingsToShift = siblings.filter(
      (s) => s.sortOrder >= validPosition,
    );

    // Generate temporary ID for optimistic update
    const tempId = -Date.now();
    const tempSlug = `new-page-${Date.now()}`;

    const optimisticPage: Page = {
      id: tempId,
      name: 'New Page',
      slug: tempSlug,
      description: null,
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
      // Create the new page via API
      const newPage = await client.api.pages.post({
        sitemapId: sitemapId,
        parentId: parentId,
        name: 'New Page',
        slug: tempSlug,
        description: null,
        sortOrder: validPosition,
      });

      // Shift all affected siblings
      await Promise.all(
        siblingsToShift.map((sibling) =>
          client.api.pages({ id: sibling.id.toString() }).put({
            name: sibling.name,
            slug: sibling.slug,
            description: sibling.description,
            parentId: sibling.parentId,
            sortOrder: sibling.sortOrder + 1,
          }),
        ),
      );

      // Replace optimistic page with real page
      const actualPage = (newPage as any).data || newPage;

      dataDispatch({
        type: 'REPLACE_TEMP_PAGE',
        payload: {
          tempId,
          actualPage: {
            id: actualPage.id,
            name: actualPage.name,
            slug: actualPage.slug,
            description: actualPage.description,
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
  }, [sitemapId, dataState.pages, queryClient]);

  // Move page mutation
  const movePage = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    visualDispatch({ type: 'SET_ACTIVE_ID', payload: null });

    if (!over) {
      return;
    }

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'page') {
      return;
    }

    const draggedNode = activeData.node as any;
    const overId = over.id as string;

    let updatedPages: Page[] = dataState.pages;

    // Case 1: Dropped on a page node (nesting)
    let newParentId: number | null = null;
    if (overId.startsWith('drop-page-')) {
      newParentId = parseInt(overId.replace('drop-page-', ''));
    } else if (overId.startsWith('page-')) {
      newParentId = parseInt(overId.replace('page-', ''));
    }

    if (newParentId !== null) {
      if (draggedNode.id === newParentId) {
        return;
      }

      function isDescendant(node: any, targetId: number): boolean {
        if (node.id === targetId) return true;
        return node.children?.some((child: any) => isDescendant(child, targetId)) || false;
      }
      if (isDescendant(draggedNode, newParentId)) {
        return;
      }

      const newSiblings = getSiblings(dataState.pages, newParentId, draggedNode.id);
      const newSortOrder =
        newSiblings.length > 0
          ? Math.max(...newSiblings.map((s) => s.sortOrder)) + 1
          : 0;

      updatedPages = dataState.pages.map((page) => {
        if (page.id === draggedNode.id) {
          return { ...page, parentId: newParentId, sortOrder: newSortOrder };
        }
        return page;
      });
    }
    // Case 2: Dropped on an empty space drop zone (re-ordering)
    else if (overId.startsWith('reorder-')) {
      const match = overId.match(/^reorder-(root|\d+)-(\d+)$/);
      if (!match) {
        return;
      }

      const parentIdStr = match[1];
      const position = parseInt(match[2]);
      const targetParentId =
        parentIdStr === 'root' ? null : parseInt(parentIdStr);

      const draggedPage = dataState.pages.find((p) => p.id === draggedNode.id);
      if (!draggedPage) {
        return;
      }

      if (targetParentId !== null && targetParentId === draggedNode.id) {
        return;
      }

      if (draggedPage.parentId === targetParentId) {
        const currentSiblings = getSiblings(
          dataState.pages,
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
        dataState.pages,
        draggedNode.id,
        targetParentId,
        position,
      );

      const oldParentId = draggedPage.parentId;
      const oldSiblings = getSiblings(dataState.pages, oldParentId, draggedNode.id);
      const oldSiblingIds = oldSiblings.map((s) => s.id);

      updatedPages = dataState.pages.map((page) => {
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
    } else {
      return;
    }

    const hasChanges =
      updatedPages.some((page) => {
        const original = dataState.pages.find((p) => p.id === page.id);
        if (!original) return true;
        return (
          page.parentId !== original.parentId ||
          page.sortOrder !== original.sortOrder
        );
      }) || updatedPages.length !== dataState.pages.length;

    if (!hasChanges) {
      return;
    }

    // Add to history and update pages
    dataDispatch({ type: 'ADD_TO_HISTORY', payload: updatedPages });
  }, [dataState.pages]);

  // Move section mutation
  const moveSection = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    visualDispatch({ type: 'CLEAR_ACTIVE_IDS' });

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
      metadata: any;
      sortOrder: number;
    };
    const sourcePageId = activeData.pageId as number;
    const overId = over.id as string;

    let targetPageId: number;
    let targetPosition: number;

    if (overId.startsWith('section-drop-')) {
      const match = overId.match(/^section-drop-(\d+)-(\d+)$/);
      if (!match) {
        return;
      }

      targetPageId = parseInt(match[1]);
      targetPosition = parseInt(match[2]);
    } else if (overId.startsWith('drop-section-page-')) {
      const match = overId.match(/^drop-section-page-(\d+)$/);
      if (!match) {
        return;
      }

      targetPageId = parseInt(match[1]);
      const targetPageForLength = dataState.pages.find((p) => p.id === targetPageId);
      if (!targetPageForLength) {
        return;
      }
      targetPosition = targetPageForLength.sections.length;
    } else {
      return;
    }

    const targetPage = dataState.pages.find((p) => p.id === targetPageId);
    const sourcePage = dataState.pages.find((p) => p.id === sourcePageId);

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

    const originalPages = [...dataState.pages];

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

      const updatedPages = dataState.pages.map((page) => {
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
  }, [dataState.pages, queryClient, setSaveStatus]);

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
  }, [queryClient, onPageSelect]);

  // Duplicate page mutation
  const duplicatePage = useCallback(async (page: Page) => {
    if (!sitemapId) return;

    try {
      const newPage = await client.api.pages.post({
        sitemapId: sitemapId,
        parentId: page.parentId,
        name: `${page.name} (Copy)`,
        slug: `${page.slug}-copy`,
        description: page.description,
        sortOrder: page.sortOrder + 1,
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Note: The page will be refetched from the server, so we don't need to update local state
    } catch (error) {
      console.error('Failed to duplicate page:', error);
    }
  }, [sitemapId, queryClient]);

  // Undo/Redo
  const undo = useCallback(() => {
    dataDispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dataDispatch({ type: 'REDO' });
  }, []);

  const canUndo = dataState.historyIndex > 0;
  const canRedo = dataState.historyIndex < dataState.history.length - 1;

  const value: SitemapDiagramContextValue = {
    pages: dataState.pages,
    activeId: visualState.activeId,
    activeSectionId: visualState.activeSectionId,
    showSections: visualState.showSections,
    saveStatus: visualState.saveStatus,
    canUndo,
    canRedo,
    setActiveId: (id) => visualDispatch({ type: 'SET_ACTIVE_ID', payload: id }),
    setActiveSectionId: (id) => visualDispatch({ type: 'SET_ACTIVE_SECTION_ID', payload: id }),
    setShowSections: (show) => visualDispatch({ type: 'SET_SHOW_SECTIONS', payload: show }),
    setSaveStatus,
    addPage,
    movePage,
    moveSection,
    deletePage,
    duplicatePage,
    undo,
    redo,
    updatePages,
  };

  return (
    <SitemapDiagramContext.Provider value={value}>
      {children}
    </SitemapDiagramContext.Provider>
  );
}
