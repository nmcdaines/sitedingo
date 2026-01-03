/**
 * Type-safe drop zone ID helpers
 * Replaces string-based ID parsing with typed objects
 */

/**
 * Type guard to check if a string is a page drop zone ID
 */
export function isPageDropZoneId(id: string): boolean {
  return id.startsWith('drop-page-') || id.startsWith('page-');
}

/**
 * Type guard to check if a string is a section drop zone ID
 */
export function isSectionDropZoneId(id: string): boolean {
  return id.startsWith('section-drop-') || id.startsWith('drop-section-page-');
}

/**
 * Type guard to check if a string is a reorder drop zone ID
 */
export function isReorderDropZoneId(id: string): boolean {
  return id.startsWith('reorder-');
}

/**
 * Parse a page drop zone ID from string
 * Handles both 'drop-page-{id}' and 'page-{id}' formats
 */
export function parsePageDropZoneId(id: string): number | null {
  if (id.startsWith('drop-page-')) {
    return parseInt(id.replace('drop-page-', ''));
  }
  if (id.startsWith('page-')) {
    return parseInt(id.replace('page-', ''));
  }
  return null;
}

/**
 * Parse a reorder drop zone ID from string
 * Format: 'reorder-{parentId|root}-{position}'
 * Returns { parentId: number | null, position: number } or null if invalid
 */
export function parseReorderDropZoneId(id: string): { parentId: number | null; position: number } | null {
  const match = id.match(/^reorder-(root|\d+)-(\d+)$/);
  if (!match) {
    return null;
  }

  const parentIdStr = match[1];
  const position = parseInt(match[2]);
  const parentId = parentIdStr === 'root' ? null : parseInt(parentIdStr);

  return { parentId, position };
}

/**
 * Parse a section drop zone ID from string
 * Format: 'section-drop-{pageId}-{position}' or 'drop-section-page-{pageId}'
 */
export function parseSectionDropZoneId(id: string): { pageId: number; position: number } | null {
  if (id.startsWith('section-drop-')) {
    const match = id.match(/^section-drop-(\d+)-(\d+)$/);
    if (!match) {
      return null;
    }
    return {
      pageId: parseInt(match[1]),
      position: parseInt(match[2]),
    };
  }

  if (id.startsWith('drop-section-page-')) {
    const match = id.match(/^drop-section-page-(\d+)$/);
    if (!match) {
      return null;
    }
    const pageId = parseInt(match[1]);
    // Position will be determined by the number of sections in the page
    return {
      pageId,
      position: -1, // Special value indicating "append to end"
    };
  }

  return null;
}

/**
 * Create a reorder drop zone ID string
 */
export function createReorderDropZoneId(parentId: number | null, position: number): string {
  const parentIdStr = parentId === null ? 'root' : parentId.toString();
  return `reorder-${parentIdStr}-${position}`;
}


