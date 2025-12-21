import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { generateSitemapWorkflow } from '../workflows/generate-sitemap';
import { requireAuthenticated } from './helpers/auth';

export const ProjectController = new Elysia({ prefix: "/projects", tags: ["Projects"] })
  .use(requireAuthenticated)

  // Get a project
  .get("/:id", async ({ user, params }) => {
    const project = await db.query.projects.findFirst({
      where: {
        id: Number(params.id),
        teamId: {
          in: user.teams.map(team => team.id)
        }
      },
      with: {
        sitemaps: {
          with: {
            pages: {
              with: {
                sections: true,
              }
            }
          }
        }
      }
    })

    if (!project) return status(404, { error: 'Project not found' })

    return project
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        description: t.Nullable(t.String()),
  
        sitemaps: t.Array(t.Object({
          id: t.Number(),
          name: t.String(),
          description: t.Nullable(t.String()),

          pages: t.Array(t.Object({
            id: t.Number(),
            name: t.String(),
            slug: t.String(),
            description: t.Nullable(t.String()),
            sortOrder: t.Number(),

            sections: t.Array(t.Object({
              id: t.Number(),
              componentType: t.String(),
              name: t.String(),
              metadata: t.Any(),
              sortOrder: t.Number(),
            }))
          }))
        }))
      })
    }
    
    
  })

  // List all projects
  .get("", async ({ user }) => {
    return await db.query.projects.findMany({
      where: {
        teamId: {
          in: user.teams.map(team => team.id)
        }
      }
    })
  }, {
    response: {
      200: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        description: t.Nullable(t.String()),
      }))
    }
  })

  // Create a project
  .post("", async ({ user, body }) => {
    const project = await db.insert(schema.projects).values({
      // TODO: need to have a "current" team.
      teamId: user.teams[0].id,
      
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
