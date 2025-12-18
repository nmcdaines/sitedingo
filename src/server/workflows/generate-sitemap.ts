import { db, schema } from "@/db"
import { generateAiSitemap } from "../prompts";

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
    await db.insert(schema.pages).values({
      sitemapId: sitemap.id,
      name: page.name,
      description: '',
      slug: page.slug,
      sortOrder: pageIndex,
    }).returning().then(res => res[0]);

    console.log(`page added: `, page);

    pageIndex++;
  }
}

// async function populatePage(pageId: number) {
//   'use step'
// }


