/**
 * Shared types for sitemap diagram
 */

export interface Page {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: number | null;
  sections: Array<{
    id: number;
    componentType: string;
    name: string | null;
    metadata: Record<string, unknown>;
    sortOrder: number;
  }>;
}

