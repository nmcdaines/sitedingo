# Drag-and-Drop Enhancement Plan

## Goal
Enable two drag-and-drop behaviors in the sitemap builder:
1. **Re-ordering**: Drag a card into empty space to reorder it among siblings
2. **Nesting**: Drag a card onto an existing card to make it a child (already implemented)

## Current Implementation

### Existing Features
- Uses `@dnd-kit/core` for drag-and-drop
- `PageNode` is both draggable and droppable
- Currently only supports nesting (dropping onto another page)
- Collision detection uses `closestCenter`
- Auto-saves changes to `parentId` and `sortOrder`

### Current Drag End Handler
- Detects drops on `drop-page-{id}` (nesting)
- Updates `parentId` when dropped on another page
- Prevents dropping on self or descendants

## Implementation Plan

### 1. Empty Space Drop Zones

**Approach**: Create invisible drop zones positioned between nodes for re-ordering.

**Strategy**:
- Generate drop zones between sibling nodes horizontally
- Place drop zones at the beginning/end of sibling groups
- Drop zones should be positioned at the same Y-level as their target siblings
- Use a reasonable width (e.g., 100px) to make them easy to hit

**Drop Zone IDs**: `reorder-{parentId}-{position}`
- `parentId`: The parent ID (or `root` for root level)
- `position`: The index where the item should be inserted

### 2. Enhanced Drag End Handler

**Logic Flow**:
```
1. Check if dropped on a page node (nesting)
   - If yes: Use existing nesting logic
   - If no: Continue to step 2

2. Check if dropped on an empty space drop zone (re-ordering)
   - Extract parentId and position from drop zone ID
   - Calculate new sortOrder based on position
   - Update dragged page's parentId and sortOrder
   - Recalculate sortOrder for affected siblings
```

**Sort Order Calculation**:
- When inserting at position `i`:
  - If `i === 0`: `sortOrder = 0`, shift all siblings up by 1
  - If `i === siblings.length`: `sortOrder = max(sibling.sortOrder) + 1`
  - Otherwise: `sortOrder = (sibling[i-1].sortOrder + sibling[i].sortOrder) / 2` or use integer sequence

**Sibling Updates**:
- Get all siblings (same `parentId`)
- Sort by current `sortOrder`
- Reassign `sortOrder` values as `0, 1, 2, ...` to maintain clean ordering

### 3. Visual Feedback

**Drop Zone Indicators**:
- Show subtle visual indicators when dragging (e.g., dashed line or highlight)
- Only show drop zones that are valid for the current drag
- Hide drop zones when not dragging

**Drag States**:
- When dragging over a page: Show nesting indicator (existing)
- When dragging over empty space: Show insertion point indicator

### 4. Collision Detection

**Enhancement**:
- Keep `closestCenter` but ensure drop zones are large enough to be easily hit
- Consider using `closestCorners` for better empty space detection
- Prioritize page nodes over drop zones when both are close

### 5. Component Structure

**New Component**: `EmptySpaceDropZone`
- Renders invisible drop zones between nodes
- Uses `useDroppable` hook
- Shows visual feedback when `isOver` is true

**Modified Components**:
- `SitemapDiagram`: 
  - Generate drop zones based on node positions
  - Enhanced `handleDragEnd` to handle both cases
  - Add sort order calculation utilities

## Implementation Steps

1. ✅ Create empty space drop zones component
2. ✅ Add drop zone generation logic in `SitemapDiagram`
3. ✅ Enhance `handleDragEnd` to detect and handle empty space drops
4. ✅ Implement sort order calculation utilities
5. ✅ Add visual feedback for drop zones
6. ✅ Test both re-ordering and nesting behaviors

## Edge Cases to Handle

1. **Dropping on self**: Already handled
2. **Dropping on descendants**: Already handled
3. **Empty sibling list**: Handle gracefully
4. **Root level re-ordering**: Support `parentId = null`
5. **Multiple rapid drags**: Ensure state consistency
6. **Zoom/pan during drag**: Drop zones should account for transform

## API Integration

The existing `/pages/:id` PUT endpoint already supports updating `parentId` and `sortOrder`. The auto-save mechanism will handle persisting changes.

For better performance, we could batch updates using the `/pages/:id/reorder` endpoint, but the current approach should work fine.

