'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DragEndEvent } from '@dnd-kit/core';
import { client } from '@/lib/client';
import { useAutoSave } from '../../hooks/use-auto-save';
import { Page } from './types';
import { visualReducer, initialVisualState } from './state/visual-state';
import { dataReducer, initialDataState } from './state/data-state';
import { usePageMutations } from './mutations/page-mutations';
import { useSectionMutations } from './mutations/section-mutations';

// Re-export Page type for backward compatibility
export type { Page } from './types';

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

  // Actions
  setActiveId: (id: string | null) => void;
  setActiveSectionId: (id: string | null) => void;
  setShowSections: (show: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  
  // Mutations
  addPage: (parentId: number | null, position: number) => Promise<void>;
  addSection: (pageId: number, position?: number) => Promise<void>;
  movePage: (event: DragEndEvent) => Promise<void>;
  moveSection: (event: DragEndEvent) => Promise<void>;
  deletePage: (pageId: number) => Promise<void>;
  duplicatePage: (page: Page) => Promise<void>;
  updatePage: (pageId: number, updates: { name?: string; slug?: string; description?: string | null }) => void;
  updateSection: (sectionId: number, updates: { name?: string | null; componentType?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  
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
  
  // Refs for tracking initial pages from server
  const previousPagesRef = useRef<Page[]>(initialPages);

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

      dataDispatch({ type: 'SET_PAGES', payload: pagesWithSortedSections });
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

  // Update single page helper (for optimistic updates)
  const updatePage = useCallback((pageId: number, updates: { name?: string; slug?: string; description?: string | null; icon?: string | null }) => {
    dataDispatch({ type: 'UPDATE_PAGE', payload: { id: pageId, updates } });
  }, []);

  // Use extracted mutation hooks
  const { addPage, movePage, deletePage, duplicatePage } = usePageMutations({
    pages: dataState.pages,
    sitemapId,
    dataDispatch,
    previousPagesRef,
    onPageSelect,
  });

  const { addSection, moveSection, updateSection } = useSectionMutations({
    pages: dataState.pages,
    dataDispatch,
    previousPagesRef,
    setSaveStatus,
  });

  // Extract structural data (parentId, sortOrder) for auto-save comparison
  const structuralData = useMemo(() => {
    return dataState.pages.map((page) => ({
      id: page.id,
      parentId: page.parentId,
      sortOrder: page.sortOrder,
    }));
  }, [dataState.pages]);

  // Auto-save function for structural changes
  const saveStructuralChanges = useCallback(async (structuralPages: typeof structuralData) => {
    // Find pages that have structural changes
    const changedPages = structuralPages.filter((page) => {
      const originalPage = previousPagesRef.current.find((p) => p.id === page.id);
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

    // Save all changed pages
    await Promise.all(
      changedPages.map(async (page) => {
        const pageData = dataState.pages.find((p) => p.id === page.id);
        if (!pageData) throw new Error(`Page not found: ${page.id}`);

        return await client.api.pages({ id: page.id.toString() }).put({
          name: pageData.name,
          slug: pageData.slug,
          description: pageData.description,
          icon: pageData.icon,
          parentId: pageData.parentId,
          sortOrder: pageData.sortOrder,
        });
      }),
    );

    queryClient.invalidateQueries({ queryKey: ['projects'] });
    previousPagesRef.current = dataState.pages;
  }, [dataState.pages, queryClient]);

  // Use auto-save hook for structural changes
  const autoSaveStatus = useAutoSave(
    structuralData,
    saveStructuralChanges,
    {
      debounceMs: 500,
      onSave: () => {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      },
      onError: () => {
        setSaveStatus('error');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 5000);
      },
    }
  );

  // Sync save status from auto-save hook
  useEffect(() => {
    if (autoSaveStatus === 'saving') {
      setSaveStatus('saving');
    }
  }, [autoSaveStatus, setSaveStatus]);

  // Wrapper for movePage to clear active ID
  const handleMovePage = useCallback(async (event: DragEndEvent) => {
    visualDispatch({ type: 'SET_ACTIVE_ID', payload: null });
    await movePage(event);
  }, [movePage, visualDispatch]);

  // Wrapper for moveSection to clear active IDs
  const handleMoveSection = useCallback(async (event: DragEndEvent) => {
    visualDispatch({ type: 'CLEAR_ACTIVE_IDS' });
    await moveSection(event);
  }, [moveSection, visualDispatch]);

  const value: SitemapDiagramContextValue = {
    pages: dataState.pages,
    activeId: visualState.activeId,
    activeSectionId: visualState.activeSectionId,
    showSections: visualState.showSections,
    saveStatus: visualState.saveStatus,
    setActiveId: (id) => visualDispatch({ type: 'SET_ACTIVE_ID', payload: id }),
    setActiveSectionId: (id) => visualDispatch({ type: 'SET_ACTIVE_SECTION_ID', payload: id }),
    setShowSections: (show) => visualDispatch({ type: 'SET_SHOW_SECTIONS', payload: show }),
    setSaveStatus,
    addPage,
    addSection,
    movePage: handleMovePage,
    moveSection: handleMoveSection,
    deletePage,
    duplicatePage,
    updatePage,
    updateSection,
    updatePages,
  };

  return (
    <SitemapDiagramContext.Provider value={value}>
      {children}
    </SitemapDiagramContext.Provider>
  );
}
