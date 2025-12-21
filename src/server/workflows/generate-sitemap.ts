import { db, schema } from "@/db"
import { generateAiSitemap, generateAiPage } from "../prompts";

export async function generateSitemapWorkflow(projectId: number) {
  'use workflow'

  const project = await db.query.projects.findFirst({
    where: { id: projectId }
  });

  console.log(`project: `, project);

  if (!project) throw new Error(`Project with ID ${projectId} not found`);

  if (!project.description) throw new Error(`Project with ID ${projectId} has no description`);

  const sitemap = await populateSitemap(project.id, project.description);

  console.log(`done`);
}

async function populateSitemap(projectId: number, projectDescription: string) {
  'use step'

  const aiSitemap = await generateAiSitemap(projectDescription);

  const sitemap = await db.insert(schema.sitemaps).values({
    projectId,
    name: '', // TODO
    description: projectDescription, // TODO
  }).returning().then(res => res[0]);

  console.log(`sitemap: `, sitemap);

  if (!sitemap) throw new Error("Unable to create sitemap");

  let pageIndex = 0;
  for (const page of aiSitemap.object) {
    const pageRecord = await db.insert(schema.pages).values({
      sitemapId: sitemap.id,
      name: page.name,
      description: '',
      slug: page.slug,
      sortOrder: pageIndex,
    }).returning().then(res => res[0]);

    console.log(`page added: `, page);

    if (!pageRecord) {
      throw new Error(`Unable to create page: ${page.name}`);
    }

    // Generate initial page content
    await populatePage(pageRecord.id, page.name, projectDescription);

    pageIndex++;
  }
}

async function populatePage(pageId: number, pageTitle: string, businessDescription: string) {
  'use step'

  const pageContent = await generateAiPage(pageTitle, businessDescription);

  // Update page with generated description
  // await db.update(schema.pages)
  //   .set({ description: pageContent.object.description })
  //   .where({ id: pageId });

  // Create sections for the generated content
  let sectionIndex = 0;
  for (const section of pageContent.object.sections) {
    await db.insert(schema.sections).values({
      pageId,
      componentType: 'text',
      name: section.title,
      metadata: { content: section.content },
      sortOrder: sectionIndex,
    });

    sectionIndex++;
  }

  console.log(`Generated ${sectionIndex} sections for page: ${pageTitle}`);
}


