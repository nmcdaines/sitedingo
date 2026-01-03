/**
 * Data state reducer for pages and their sections
 */

import { Page } from '../types';

export interface DataState {
  pages: Page[];
}

export type DataAction =
  | { type: 'SET_PAGES'; payload: Page[] }
  | { type: 'UPDATE_PAGES'; payload: (pages: Page[]) => Page[] }
  | { type: 'UPDATE_PAGE'; payload: { id: number; updates: Partial<Pick<Page, 'name' | 'slug' | 'description' | 'icon'>> } }
  | { type: 'ADD_PAGE_OPTIMISTIC'; payload: { page: Page; siblingsToShift: number[] } }
  | { type: 'REPLACE_TEMP_PAGE'; payload: { tempId: number; actualPage: Page } }
  | { type: 'ROLLBACK_ADD_PAGE'; payload: { tempId: number; siblingsToShift: number[] } }
  | { type: 'DELETE_PAGE'; payload: number }
  | { type: 'MOVE_PAGE'; payload: Page[] }
  | { type: 'MOVE_SECTION'; payload: Page[] };

export const initialDataState = (initialPages: Page[]): DataState => ({
  pages: initialPages,
});

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    
    case 'UPDATE_PAGES':
      return { ...state, pages: action.payload(state.pages) };
    
    case 'UPDATE_PAGE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      };
    }
    
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
    
    default:
      return state;
  }
}

