interface Page {
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

export interface TreeNode extends Page {
  children: TreeNode[];
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Transforms a flat array of pages into a tree structure
 */
export function buildTree(pages: Page[]): TreeNode[] {
  // Create a map for quick lookup
  const pageMap = new Map<number, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // First pass: create all nodes
  pages.forEach((page) => {
    pageMap.set(page.id, {
      ...page,
      children: [],
      position: { x: 0, y: 0 },
      width: 280,
      height: 120,
    });
  });

  // Second pass: build parent-child relationships
  pages.forEach((page) => {
    const node = pageMap.get(page.id)!;
    if (page.parentId === null) {
      rootNodes.push(node);
    } else {
      const parent = pageMap.get(page.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan node, treat as root
        rootNodes.push(node);
      }
    }
  });

  // Sort children by sortOrder
  function sortChildren(node: TreeNode) {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder);
    node.children.forEach(sortChildren);
  }

  rootNodes.sort((a, b) => a.sortOrder - b.sortOrder);
  rootNodes.forEach(sortChildren);

  return rootNodes;
}

/**
 * Layout constants
 */
const LAYOUT = {
  NODE_WIDTH: 280,
  NODE_HEIGHT: 120,
  SECTION_HEIGHT: 80,
  HORIZONTAL_SPACING: 320,
  VERTICAL_SPACING: 200,
  SECTION_SPACING: 100,
  CANVAS_PADDING: 100,
} as const;

/**
 * Calculates the width needed for a subtree
 */
function calculateSubtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) {
    return LAYOUT.NODE_WIDTH;
  }

  const childrenWidth = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeWidth(child) + LAYOUT.HORIZONTAL_SPACING;
  }, -LAYOUT.HORIZONTAL_SPACING); // Remove last spacing

  return Math.max(LAYOUT.NODE_WIDTH, childrenWidth);
}

/**
 * Calculates the height needed for a node including sections
 * Matches the calculation in page-node.tsx:
 * - Header: 60px
 * - Each section: 50px
 * - Gap between sections: 8px
 * - mt-4 margin: 16px
 */
function calculateNodeHeight(node: TreeNode): number {
  const headerHeight = 60;
  const sectionAreaHeight =
    node.sections.length > 0
      ? node.sections.length * 50 + (node.sections.length - 1) * 8 + 16
      : 0;
  return headerHeight + sectionAreaHeight;
}

/**
 * Positions a node and its children recursively
 */
function positionNode(
  node: TreeNode,
  startX: number,
  y: number,
  level: number,
): void {
  const nodeHeight = calculateNodeHeight(node);
  const subtreeWidth = calculateSubtreeWidth(node);

  // Center the node above its children
  const nodeX = startX + (subtreeWidth - LAYOUT.NODE_WIDTH) / 2;

  node.position = { x: nodeX, y };
  node.width = LAYOUT.NODE_WIDTH;
  node.height = nodeHeight;

  // Position children
  if (node.children.length > 0) {
    const childY = y + nodeHeight + LAYOUT.VERTICAL_SPACING;
    let childX = startX;

    node.children.forEach((child) => {
      const childSubtreeWidth = calculateSubtreeWidth(child);
      positionNode(child, childX, childY, level + 1);
      childX += childSubtreeWidth + LAYOUT.HORIZONTAL_SPACING;
    });
  }
}

/**
 * Gets all siblings of a page (pages with the same parentId)
 */
export function getSiblings(
  pages: Page[],
  parentId: number | null,
  excludeId?: number,
): Page[] {
  return pages
    .filter((page) => page.parentId === parentId && page.id !== excludeId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Calculates the new sort order for a page when inserting at a specific position
 * Returns the new sortOrder and an array of all sibling IDs in their new order
 */
export function calculateSortOrder(
  pages: Page[],
  draggedPageId: number,
  targetParentId: number | null,
  insertPosition: number,
): { sortOrder: number; siblingIds: number[] } {
  // Get all siblings (including the dragged page if it's moving within the same parent)
  const draggedPage = pages.find((p) => p.id === draggedPageId);
  if (!draggedPage) {
    throw new Error("Dragged page not found");
  }

  const isMovingWithinSameParent = draggedPage.parentId === targetParentId;

  // Get siblings excluding the dragged page
  const siblings = getSiblings(
    pages,
    targetParentId,
    isMovingWithinSameParent ? draggedPageId : undefined,
  );

  // Clamp insert position to valid range
  const validPosition = Math.max(0, Math.min(insertPosition, siblings.length));

  // Insert the dragged page at the specified position
  const newSiblings = [...siblings];
  newSiblings.splice(validPosition, 0, draggedPage);

  // Calculate new sort orders (simple sequential: 0, 1, 2, ...)
  const siblingIds = newSiblings.map((s) => s.id);
  const sortOrder = validPosition;

  return { sortOrder, siblingIds };
}
