import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { generateSitemapWorkflow } from '../workflows/generate-sitemap';
import { requireAuthenticated } from './helpers/auth';
import { eq } from 'drizzle-orm';

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
        isGenerating: t.Boolean(),
  
        sitemaps: t.Array(t.Object({
          id: t.Number(),
          name: t.String(),
          description: t.Nullable(t.String()),

          pages: t.Array(t.Object({
            parentId: t.Nullable(t.Number()),
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
      isGenerating: true,
    }).returning().then(res => res[0]);

    if (!project) { throw new Error('Not created!'); }

    // Kick off workflow in background (don't await)
    generateSitemapWorkflow(project.id).catch((error) => {
      console.error('Error in generateSitemapWorkflow:', error);
      // Optionally update project to mark as failed
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      isGenerating: project.isGenerating,
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
    }),
    response: {
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        description: t.Nullable(t.String()),
        isGenerating: t.Boolean(),
      })
    }
  })

  // Edit a project
  .put("/:id", async ({ user, params, body }) => {
    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, Number(params.id)),
      with: {
        team: true,
      }
    })

    if (!project) return status(404, { error: 'Project not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    const updated = await db.update(schema.projects)
      .set({
        name: body.name,
        description: body.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, Number(params.id)))
      .returning()
      .then(res => res[0])

    if (!updated) throw new Error('Project not updated')

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.Nullable(t.String()),
    }),
    response: {
      400: t.Object({ error: t.String() }),
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        description: t.Nullable(t.String()),
      })
    }
  })
