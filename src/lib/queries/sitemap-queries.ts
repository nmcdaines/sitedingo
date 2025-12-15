import { db } from "@/db";
import { sitemaps, pages, sections } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PageWithSections = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
  sections: {
    id: string;
    name: string | null;
    componentType: string;
    metadata: any;
    sortOrder: number;
  }[];
  children?: PageWithSections[];
};

/**
 * Fetch a sitemap with all its pages and sections
 * organized in a hierarchical tree structure
 */
export async function getSitemapWithPages(
  sitemapId: string
): Promise<PageWithSections[]> {
  // Fetch all pages for this sitemap
  const allPages = await db.query.pages.findMany({
    where: eq(pages.sitemapId, sitemapId),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.sortOrder)],
      },
    },
    orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
  });

  // Build a tree structure
  const pageMap = new Map<string, PageWithSections>();
  const rootPages: PageWithSections[] = [];

  // First pass: create all page nodes
  for (const page of allPages) {
    const pageNode: PageWithSections = {
      id: page.id,
      name: page.name,
      slug: page.slug,
      description: page.description,
      sortOrder: page.sortOrder,
      parentId: page.parentId,
      sections: page.sections.map((s) => ({
        id: s.id,
        name: s.name,
        componentType: s.componentType,
        metadata: s.metadata,
        sortOrder: s.sortOrder,
      })),
      children: [],
    };
    pageMap.set(page.id, pageNode);
  }

  // Second pass: build the tree
  for (const pageNode of pageMap.values()) {
    if (pageNode.parentId) {
      const parent = pageMap.get(pageNode.parentId);
      if (parent) {
        parent.children!.push(pageNode);
      }
    } else {
      rootPages.push(pageNode);
    }
  }

  return rootPages;
}

/**
 * Get all sitemaps for a project
 */
export async function getProjectSitemaps(projectId: string) {
  return await db.query.sitemaps.findMany({
    where: eq(sitemaps.projectId, projectId),
    orderBy: (sitemaps, { desc }) => [desc(sitemaps.updatedAt)],
  });
}

/**
 * Get the active sitemap for a project
 */
export async function getActiveSitemap(projectId: string) {
  return await db.query.sitemaps.findFirst({
    where: (sitemaps, { and }) => [
      eq(sitemaps.projectId, projectId),
      eq(sitemaps.isActive, true),
    ],
  });
}
