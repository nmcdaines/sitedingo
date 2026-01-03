/**
 * Visual state reducer for UI-related state (active selections, visibility toggles, save status)
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface VisualState {
  activeId: string | null;
  activeSectionId: string | null;
  showSections: boolean;
  saveStatus: SaveStatus;
}

export type VisualAction =
  | { type: 'SET_ACTIVE_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_SECTION_ID'; payload: string | null }
  | { type: 'SET_SHOW_SECTIONS'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
  | { type: 'CLEAR_ACTIVE_IDS' };

export const initialVisualState: VisualState = {
  activeId: null,
  activeSectionId: null,
  showSections: true,
  saveStatus: 'idle',
};

export function visualReducer(state: VisualState, action: VisualAction): VisualState {
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

