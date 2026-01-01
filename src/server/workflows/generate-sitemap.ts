import { db, schema } from "@/db"
import { generateAiSitemap, generateAiPage } from "../prompts";
import { eq } from "drizzle-orm";

export async function generateSitemapWorkflow(projectId: number, pagesCount: string = "2-5") {
  'use workflow'

  const project = await db.query.projects.findFirst({
    where: { id: projectId }
  });

  console.log(`project: `, project);

  if (!project) throw new Error(`Project with ID ${projectId} not found`);

  if (!project.description) throw new Error(`Project with ID ${projectId} has no description`);

  try {
    const sitemap = await populateSitemap(project.id, project.description, pagesCount);

    console.log(`done`);
  } finally {
    // Always mark generation as complete, even if there was an error
    await db.update(schema.projects)
      .set({ 
        isGenerating: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));
  }
}

async function populateSitemap(projectId: number, projectDescription: string, pagesCount: string) {
  'use step'

  const aiSitemap = await generateAiSitemap(projectDescription, pagesCount);

  const sitemap = await db.insert(schema.sitemaps).values({
    projectId,
    name: '', // TODO
    description: projectDescription, // TODO
  }).returning().then(res => res[0]);

  console.log(`sitemap: `, sitemap);

  if (!sitemap) throw new Error("Unable to create sitemap");

  // Build a map of all required pages including intermediate parents
  // Key: slug, Value: { name, fromAI: boolean, aiPage?: page object }
  const pagesMap = new Map<string, { name: string; fromAI: boolean; aiPage?: typeof aiSitemap.object[0] }>();

  // First, add all pages from AI sitemap
  for (const page of aiSitemap.object) {
    pagesMap.set(page.slug, { name: page.name, fromAI: true, aiPage: page });
  }

  // Merge "/" and "/home" pages - treat them as the same
  const hasRoot = pagesMap.has('/');
  const hasHome = pagesMap.has('/home');
  
  if (hasHome) {
    const homePage = pagesMap.get('/home');
    if (homePage) {
      if (hasRoot) {
        // Both exist - keep "/" and merge data, prioritizing AI-generated content
        const rootPage = pagesMap.get('/');
        if (rootPage) {
          // Always merge fromAI flag
          rootPage.fromAI = rootPage.fromAI || homePage.fromAI;
          // Merge aiPage if homePage has one and rootPage doesn't, or if homePage is from AI
          if (homePage.aiPage && (!rootPage.aiPage || homePage.fromAI)) {
            rootPage.aiPage = homePage.aiPage;
          }
          // Use the name from "/home" if it's more descriptive or if root has generic name
          if (rootPage.name === 'Home' || (!rootPage.fromAI && homePage.fromAI)) {
            rootPage.name = homePage.name;
          }
        }
        // Remove "/home"
        pagesMap.delete('/home');
      } else {
        // Only "/home" exists - convert it to "/"
        pagesMap.set('/', homePage);
        pagesMap.delete('/home');
      }
    }
  }

  // Ensure "/" root page always exists
  if (!pagesMap.has('/')) {
    pagesMap.set('/', { name: 'Home', fromAI: false });
  }

  // Convert any slugs that start with "/home" to start with "/" instead
  const slugsToUpdate = Array.from(pagesMap.keys()).filter(slug => slug.startsWith('/home'));
  for (const oldSlug of slugsToUpdate) {
    if (oldSlug === '/home') continue; // Already handled above
    
    const newSlug = oldSlug.replace(/^\/home/, '/');
    const pageInfo = pagesMap.get(oldSlug);
    if (pageInfo) {
      // Only update if the new slug doesn't already exist
      if (!pagesMap.has(newSlug)) {
        pagesMap.set(newSlug, pageInfo);
      }
      pagesMap.delete(oldSlug);
    }
  }

  // Extract all slugs and ensure parent pages exist
  const allSlugs = Array.from(pagesMap.keys());
  for (const slug of allSlugs) {
    if (slug === '/') continue; // Skip root, already handled

    // Parse slug into segments (e.g., "/services/consulting" -> ["", "services", "consulting"])
    const segments = slug.split('/').filter(s => s !== '');
    
    // Build parent slugs and ensure they exist
    let currentPath = '';
    for (let i = 0; i < segments.length - 1; i++) {
      currentPath += '/' + segments[i];
      
      // If parent doesn't exist, create a blank page for it
      if (!pagesMap.has(currentPath)) {
        // Generate a name from the slug segment (e.g., "services" -> "Services")
        const segmentName = segments[i].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        pagesMap.set(currentPath, { name: segmentName, fromAI: false });
      }
    }
  }

  // Create a map to track created page records (slug -> page record)
  const createdPages = new Map<string, { id: number; name: string; slug: string }>();

  // Sort slugs to ensure parents are created before children
  const sortedSlugs = Array.from(pagesMap.keys()).sort((a, b) => {
    const depthA = a.split('/').filter(s => s !== '').length;
    const depthB = b.split('/').filter(s => s !== '').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  // Create all pages in order (parents first)
  let pageIndex = 0;
  for (const slug of sortedSlugs) {
    const pageInfo = pagesMap.get(slug);
    if (!pageInfo) continue;

    // Determine parentId
    let parentId: number | null = null;
    if (slug !== '/') {
      const segments = slug.split('/').filter(s => s !== '');
      if (segments.length > 1) {
        // Get parent slug
        const parentSlug = '/' + segments.slice(0, -1).join('/');
        const parentPage = createdPages.get(parentSlug);
        if (parentPage) {
          parentId = parentPage.id;
        }
      } else {
        // Direct child of root
        const rootPage = createdPages.get('/');
        if (rootPage) {
          parentId = rootPage.id;
        }
      }
    }

    // Set home icon by default for home pages (slug === '/')
    const defaultIcon = slug === '/' ? 'home' : null;

    const pageRecord = await db.insert(schema.pages).values({
      sitemapId: sitemap.id,
      parentId,
      name: pageInfo.name,
      description: '',
      slug: slug,
      icon: defaultIcon,
      sortOrder: pageIndex,
    }).returning().then(res => res[0]);

    if (!pageRecord) {
      throw new Error(`Unable to create page: ${pageInfo.name}`);
    }

    createdPages.set(slug, { id: pageRecord.id, name: pageRecord.name, slug: pageRecord.slug });
    console.log(`page added: ${pageRecord.name} (${slug})`);
    pageIndex++;
  }

  // Only populate pages that were generated by AI (not intermediate parent pages)
  // Exception: Always populate the homepage ("/") even if it wasn't in the AI sitemap
  const pagesToPopulate = Array.from(pagesMap.entries())
    .filter(([slug, info]) => {
      // Always include homepage
      if (slug === '/') return true;
      // For other pages, only include if they were generated by AI
      return info.fromAI && info.aiPage;
    })
    .map(([slug, _]) => {
      const pageRecord = createdPages.get(slug);
      return pageRecord;
    })
    .filter((page): page is { id: number; name: string; slug: string } => page !== undefined);

  // Populate all AI-generated pages with their sections in parallel
  const populateResults = await Promise.allSettled(
    pagesToPopulate.map(pageRecord => {
      const pageInfo = pagesMap.get(pageRecord.slug);
      return populatePage(pageRecord.id, pageInfo?.aiPage?.name || pageRecord.name, projectDescription, pageRecord.slug);
    })
  );

  // Log any failures
  populateResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to populate page ${pagesToPopulate[index].name}:`, result.reason);
    }
  });
}

async function populatePage(pageId: number, pageTitle: string, businessDescription: string, pageSlug: string) {
  'use step'

  const pageContent = await generateAiPage(pageTitle, businessDescription, pageSlug);

  // Update page with generated description
  // await db.update(schema.pages)
  //   .set({ description: pageContent.object.description })
  //   .where({ id: pageId });

  // Create sections for the generated content
  let sectionIndex = 0;
  for (const section of pageContent.object.sections) {
    await db.insert(schema.sections).values({
      pageId,
      componentType: section.type,
      name: section.title,
      metadata: { content: section.content },
      sortOrder: sectionIndex,
    });

    sectionIndex++;
  }

  console.log(`Generated ${sectionIndex} sections for page: ${pageTitle}`);
}
