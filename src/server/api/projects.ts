import { Elysia, t } from 'elysia'
import { db, schema } from '@/db';

export const ProjectController = new Elysia({ prefix: "/projects", tags: ["Projects"] })
  .get("", async () => {
    return await db.query.projects.findMany({
      where: {
        teamId: 1,
      }
    })
  })
  .get("/:id", async () => {

  })
  .post("", async ({ body }) => {
    const project = await db.insert(schema.projects).values({
      teamId: 1,
      name: body.name,
      description: body.description,
    }).returning().then(res => res[0]);

    if (!project) { throw new Error('Not created!'); }

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

