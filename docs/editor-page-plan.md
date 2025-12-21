# Editor Page Feature Plan

## Overview
The editor page (`/project/[...projectId]`) is the main interface for viewing and editing sitemaps. It provides a visual, interactive diagram of the website structure with pages, sections, and their relationships.

## Architecture

### Component Structure
```
src/app/project/[...projectId]/
├── page.tsx                    # Main page component
└── components/
    ├── editor-header.tsx       # Top navigation bar
    ├── editor-sidebar.tsx     # Left sidebar with tools
    ├── editor-canvas.tsx      # Main diagram canvas
    ├── editor-footer.tsx      # Bottom bar with zoom controls
    ├── sitemap-diagram/
    │   ├── sitemap-diagram.tsx # Main diagram component
    │   ├── page-node.tsx       # Individual page node
    │   ├── section-node.tsx    # Section within a page
    │   └── connection-line.tsx # Visual connections
    └── property-panel.tsx      # Side panel for editing properties
```

## Key Features

### 1. Top Header Bar (`editor-header.tsx`)
**Components:**
- Project name dropdown (with project switcher)
- Tab navigation: Sitemap | Wireframe | Style Guide | Design
- Action buttons: Share, Export, Upgrade
- User menu (Clerk integration)

**State:**
- Active tab (default: "Sitemap")
- Project name

### 2. Left Sidebar (`editor-sidebar.tsx`)
**Tools:**
- Edit mode toggle
- Add page button
- Add section button (when page selected)
- Help/Info button

**State:**
- Edit mode (on/off)
- Selected element (page or section)

### 3. Main Canvas (`editor-canvas.tsx` + `sitemap-diagram.tsx`)
**Features:**
- Visual sitemap representation
- Zoom controls (mouse wheel, buttons)
- Pan (drag background)
- Drag-and-drop for reordering
- Click to select pages/sections
- Visual hierarchy (parent-child relationships)

**Data Structure:**
- Transform flat pages array into tree structure
- Calculate positions for nodes
- Handle layout algorithm (hierarchical/tree layout)

**State:**
- Zoom level (0.5x - 2x)
- Pan position (x, y)
- Selected node
- Dragged node
- Layout mode

### 4. Page Nodes (`page-node.tsx`)
**Display:**
- Page name
- Page icon (based on type or default)
- Three-dot menu (edit, delete, duplicate)
- Visual indicator for selected state
- Child pages indicator

**Interactions:**
- Click to select
- Drag to reorder or change parent
- Double-click to edit
- Menu actions

### 5. Section Nodes (`section-node.tsx`)
**Display:**
- Section name
- Component type badge
- Description preview
- Sort order indicator

**Interactions:**
- Click to select
- Drag to reorder within page
- Edit inline or in property panel

### 6. Bottom Footer (`editor-footer.tsx`)
**Components:**
- Help button
- Project status indicator
- Zoom level display (e.g., "70%")
- Zoom controls (+ / - / Fit to screen)

### 7. Property Panel (`property-panel.tsx`)
**Features:**
- Edit selected page/section properties
- Form fields for name, description, slug, etc.
- Save/Cancel buttons
- Auto-save option

## Data Flow

### Data Fetching
- Use `useSuspenseQuery` with `client.api.projects({ id }).get()`
- Transform API response into tree structure for rendering
- Handle loading and error states

### Data Mutations
**Required API Endpoints:**
1. `PUT /api/projects/:id` - Update project
2. `POST /api/pages` - Create page
3. `PUT /api/pages/:id` - Update page
4. `DELETE /api/pages/:id` - Delete page
5. `POST /api/sections` - Create section
6. `PUT /api/sections/:id` - Update section
7. `DELETE /api/sections/:id` - Delete section
8. `PUT /api/pages/:id/reorder` - Reorder pages/sections

**State Management:**
- Use React Query mutations for all updates
- Optimistic updates for better UX
- Debounced auto-save (if enabled)

## Technical Decisions

### Diagram Library
**Decision: Custom Implementation with dnd-kit**
- No diagram library - custom SVG/Canvas implementation
- Use `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-and-drop
- Build zoom/pan functionality from scratch
- Full control over rendering and interactions

### Drag and Drop
**Library: dnd-kit**
- Package: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Use `DndContext` for drag context
- `useDraggable` for draggable nodes
- `useDroppable` for drop zones
- Custom collision detection for hierarchical drops

### Auto-Save
**Decision: Enabled with debouncing**
- Debounce saves (500ms delay)
- Show save indicator (saving/saved/error)
- Optimistic updates for instant UI feedback
- Queue saves to prevent race conditions

### Layout Algorithm
**Decision: Auto-layout hierarchical tree**
- **Algorithm:** Custom hierarchical tree layout
- **Vertical Flow:** Root page at top, children below
- **Horizontal Spacing:** Siblings arranged horizontally with consistent spacing
- **Section Layout:** Sections displayed vertically within each page node
- **Auto-calculation:** Positions calculated based on tree depth and sibling count
- **Dynamic Updates:** Recalculate layout on structure changes

### Undo/Redo
**Decision: Implement with multiplayer considerations**
- Use command pattern for reversible actions
- Store action history in memory (not persisted)
- **Multiplayer Note:** In future multiplayer mode, undo/redo will be local-only (can't undo other users' changes)
- Consider using a history stack with max depth (e.g., 50 actions)

### State Management
- **Local State:** Use React hooks (`useState`, `useReducer`) for UI state
- **Server State:** React Query for data fetching and mutations
- **History State:** Local state for undo/redo stack
- **URL State:** Use search params for selected tab, zoom level (optional)

## API Requirements

### New Endpoints Needed

```typescript
// Pages API
POST   /api/pages
PUT    /api/pages/:id
DELETE /api/pages/:id
PUT    /api/pages/:id/reorder

// Sections API  
POST   /api/sections
PUT    /api/sections/:id
DELETE /api/sections/:id
PUT    /api/sections/:id/reorder
```

### Request/Response Types
- Follow existing patterns in `src/server/api/projects.ts`
- Use Zod for validation
- Include proper error handling

## UI Components Needed

### From shadcn/ui:
- `dropdown-menu` - For three-dot menus
- `dialog` - For edit modals
- `sheet` - For property panel
- `tabs` - For header tabs
- `slider` - For zoom control
- `separator` - For visual dividers
- `badge` - For component type indicators
- `tooltip` - For hover hints

### Custom Components:
- `page-node` - Custom styled page card
- `section-node` - Custom styled section card
- `connection-line` - SVG line connecting nodes

## Styling

### Design System
- Use Tailwind CSS 4
- Follow shadcn/ui "new-york" style
- Purple accent color (matching project theme)
- Light grey canvas background
- Card-based nodes with shadows

### Responsive Considerations
- Desktop-first design (editor is primarily desktop tool)
- Minimum viewport: 1280px width
- Sidebar can collapse on smaller screens

## Implementation Phases

### Phase 1: Foundation
1. Set up page structure and layout
2. Implement header with tabs
3. Implement sidebar with basic tools
4. Implement footer with zoom controls
5. Set up data fetching

### Phase 2: Visualization
1. Install dnd-kit packages
2. Transform flat data to tree structure
3. Implement auto-layout algorithm
4. Implement basic node rendering (SVG/Canvas)
5. Add zoom and pan functionality (custom implementation)
6. Render connection lines between nodes

### Phase 3: Interactions
1. Set up dnd-kit DndContext
2. Implement draggable page nodes
3. Implement draggable section nodes
4. Add drop zones for hierarchical drops
5. Implement node selection
6. Implement click-to-edit
7. Add context menus
8. Implement property panel

### Phase 4: CRUD Operations
1. Create API endpoints for pages/sections
2. Implement create operations
3. Implement update operations
4. Implement delete operations
5. Add optimistic updates
6. Implement auto-save with debouncing
7. Add save status indicator

### Phase 5: Polish
1. Implement undo/redo functionality
2. Add animations and transitions
3. Improve error handling
4. Add loading states
5. Optimize performance
6. Add keyboard shortcuts

## Decisions Made

1. ✅ **Diagram Library:** Custom implementation (no external diagram library)
2. ✅ **Drag and Drop:** dnd-kit library
3. ✅ **Auto-save:** Enabled with debouncing
4. ✅ **Tabs:** Start with Sitemap tab only
5. ✅ **Undo/Redo:** Implement with multiplayer considerations (local-only in future)
6. ✅ **Auto-layout:** Custom hierarchical tree layout algorithm

## Remaining Questions

1. **Export:** What formats should export support? (JSON, image, PDF?)
2. **Keyboard Shortcuts:** Which shortcuts should be supported?
3. **Multiplayer:** Future consideration - undo/redo will be local-only

## Implementation Details

### Auto-Layout Algorithm

**Tree Structure:**
```typescript
interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
  sections: Section[];
  position: { x: number; y: number };
  width: number;
  height: number;
}
```

**Layout Constants:**
- Node width: 280px
- Node height: 120px (pages), 80px (sections)
- Horizontal spacing: 320px (between siblings)
- Vertical spacing: 200px (between levels)
- Section spacing: 100px (within page)

**Algorithm Steps:**
1. Build tree from flat pages array (using parentId)
2. Calculate tree depth and max width at each level
3. Position root at center top
4. Recursively position children:
   - Calculate total width needed for all siblings
   - Center siblings horizontally
   - Position below parent with vertical spacing
5. Position sections within each page node
6. Calculate connection line paths

### Undo/Redo Implementation

**Command Pattern:**
```typescript
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}
```

**History Stack:**
- Max 50 actions
- Store before/after state snapshots
- Only store local changes (not server responses)
- Clear history on explicit save or page reload

**Multiplayer Consideration:**
- Undo/redo only affects local state
- Server changes from other users won't be undoable
- Show visual indicator when other users make changes

### Auto-Save Implementation

**Debounced Save:**
- 500ms delay after last change
- Queue multiple changes into single save
- Show status: "Saving...", "Saved", "Error"
- Retry failed saves with exponential backoff

**Save Strategy:**
- Save entire sitemap structure on any change
- Use PUT endpoint for updates
- Optimistic updates for instant feedback
- Rollback on save failure

## Next Steps

1. ✅ Technical decisions approved
2. Install dnd-kit packages
3. Create API endpoints for pages and sections
4. Set up basic page structure
5. Implement auto-layout algorithm
6. Implement diagram visualization
7. Add drag-and-drop interactions
8. Implement CRUD operations with auto-save
9. Add undo/redo functionality

