import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { requireAuthenticated } from './helpers/auth';
import { eq } from 'drizzle-orm';

export const SectionsController = new Elysia({ prefix: "/sections", tags: ["Sections"] })
  .use(requireAuthenticated)

  // Get a section
  .get("/:id", async ({ user, params }) => {
    const section = await db.query.sections.findFirst({
      where: (sections, { eq }) => eq(sections.id, Number(params.id)),
      with: {
        page: {
          with: {
            sitemap: {
              with: {
                project: {
                  with: {
                    team: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!section) return status(404, { error: 'Section not found' })

    // Check if user has access to the project
    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(section.page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    return section
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        componentType: t.String(),
        name: t.Nullable(t.String()),
        metadata: t.Any(),
        sortOrder: t.Number(),
        pageId: t.Number(),
      })
    }
  })

  // Create a section
  .post("", async ({ user, body }) => {
    // Verify user has access to the page
    const page = await db.query.pages.findFirst({
      where: (pages, { eq }) => eq(pages.id, body.pageId),
      with: {
        sitemap: {
          with: {
            project: {
              with: {
                team: true,
              }
            }
          }
        }
      }
    })

    if (!page) return status(404, { error: 'Page not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    const section = await db.insert(schema.sections).values({
      pageId: body.pageId,
      componentType: body.componentType,
      name: body.name || null,
      metadata: body.metadata || {},
      sortOrder: body.sortOrder || 0,
    }).returning().then(res => res[0])

    if (!section) throw new Error('Section not created')

    return section
  }, {
    body: t.Object({
      pageId: t.Number(),
      componentType: t.String(),
      name: t.Nullable(t.String()),
      metadata: t.Any(),
      sortOrder: t.Number(),
    }),
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        componentType: t.String(),
        name: t.Nullable(t.String()),
        metadata: t.Any(),
        sortOrder: t.Number(),
        pageId: t.Number(),
      })
    }
  })

  // Update a section
  .put("/:id", async ({ user, params, body }) => {
    const section = await db.query.sections.findFirst({
      where: (sections, { eq }) => eq(sections.id, Number(params.id)),
      with: {
        page: {
          with: {
            sitemap: {
              with: {
                project: {
                  with: {
                    team: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!section) return status(404, { error: 'Section not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(section.page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    const updated = await db.update(schema.sections)
      .set({
        componentType: body.componentType,
        name: body.name ?? null,
        metadata: body.metadata ?? {},
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.sections.id, Number(params.id)))
      .returning()
      .then(res => res[0])

    if (!updated) throw new Error('Section not updated')

    return updated
  }, {
    body: t.Object({
      componentType: t.String(),
      name: t.Nullable(t.String()),
      metadata: t.Any(),
      sortOrder: t.Number(),
    }),
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        componentType: t.String(),
        name: t.Nullable(t.String()),
        metadata: t.Any(),
        sortOrder: t.Number(),
        pageId: t.Number(),
      })
    }
  })

  // Delete a section
  .delete("/:id", async ({ user, params }) => {
    const section = await db.query.sections.findFirst({
      where: (sections, { eq }) => eq(sections.id, Number(params.id)),
      with: {
        page: {
          with: {
            sitemap: {
              with: {
                project: {
                  with: {
                    team: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!section) return status(404, { error: 'Section not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(section.page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    await db.delete(schema.sections)
      .where(eq(schema.sections.id, Number(params.id)))

    return { success: true }
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({ success: t.Boolean() })
    }
  })

  // Reorder sections
  .put("/:id/reorder", async ({ user, params, body }) => {
    const section = await db.query.sections.findFirst({
      where: (sections, { eq }) => eq(sections.id, Number(params.id)),
      with: {
        page: {
          with: {
            sitemap: {
              with: {
                project: {
                  with: {
                    team: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!section) return status(404, { error: 'Section not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(section.page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    // Update the section's sort order
    await db.update(schema.sections)
      .set({
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.sections.id, Number(params.id)))

    // If reordering siblings, update other sections' sort orders
    if (body.siblingIds && body.siblingIds.length > 0) {
      const updates = body.siblingIds.map((siblingId: number, index: number) =>
        db.update(schema.sections)
          .set({
            sortOrder: index,
            updatedAt: new Date(),
          })
          .where(eq(schema.sections.id, siblingId))
      )
      await Promise.all(updates)
    }

    return { success: true }
  }, {
    body: t.Object({
      sortOrder: t.Number(),
      siblingIds: t.Nullable(t.Array(t.Number())),
    }),
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({ success: t.Boolean() })
    }
  })

