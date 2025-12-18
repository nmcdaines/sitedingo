import { Elysia, t } from 'elysia'
import { db, schema } from '@/db';
import { generateSitemapWorkflow } from '../workflows/generate-sitemap';

export const ProjectController = new Elysia({ prefix: "/projects", tags: ["Projects"] })
  // Get a project
  .get("/:id", async ({ params }) => {
    console.log('Fetching project with id:', params.id);
    return await db.query.projects.findFirst({
      where: {
        id: Number(params.id),
      },
      with: {
        sitemaps: {
          with: {
            pages: true
          }
        }
      }
    })
  })

  // List all projects
  .get("", async () => {
    return await db.query.projects.findMany({
      where: {
        teamId: 1,
      }
    })
  })

  // Create a project
  .post("", async ({ body }) => {
    const project = await db.insert(schema.projects).values({
      teamId: 1,
      name: body.name,
      description: body.description,
    }).returning().then(res => res[0]);

    if (!project) { throw new Error('Not created!'); }

    await generateSitemapWorkflow(project.id);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
    }),
  })

  // Edit a project
  .put("/:id", async () => {

  })
