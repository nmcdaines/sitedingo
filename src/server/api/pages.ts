import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { requireAuthenticated } from './helpers/auth';
import { eq } from 'drizzle-orm';

export const PagesController = new Elysia({ prefix: "/pages", tags: ["Pages"] })
  .use(requireAuthenticated)

  // Get a page
  .get("/:id", async ({ user, params }) => {
    const page = await db.query.pages.findFirst({
      where: (pages, { eq }) => eq(pages.id, Number(params.id)),
      with: {
        sitemap: {
          with: {
            project: {
              with: {
                team: true,
              }
            }
          }
        },
        sections: true,
      }
    })

    if (!page) return status(404, { error: 'Page not found' })

    // Check if user has access to the project
    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(page.sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    return page
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        slug: t.String(),
        description: t.Nullable(t.String()),
        icon: t.Nullable(t.String()),
        sortOrder: t.Number(),
        parentId: t.Nullable(t.Number()),
        sections: t.Array(t.Object({
          id: t.Number(),
          componentType: t.String(),
          name: t.Nullable(t.String()),
          metadata: t.Any(),
          sortOrder: t.Number(),
        }))
      })
    }
  })

  // Create a page
  .post("", async ({ user, body }) => {
    // Verify user has access to the sitemap
    const sitemap = await db.query.sitemaps.findFirst({
      where: (sitemaps, { eq }) => eq(sitemaps.id, body.sitemapId),
      with: {
        project: {
          with: {
            team: true,
          }
        }
      }
    })

    if (!sitemap) return status(404, { error: 'Sitemap not found' })

    const teamIds = user.teams.map(team => team.id)
    if (!teamIds.includes(sitemap.project.team.id)) {
      return status(403, { error: 'Forbidden' })
    }

    // Prevent a page from being its own parent
    // Note: This check is for future pages, but we validate here for consistency
    // The actual page ID will be generated, so we can't check against it yet
    // But we validate that parentId is not the same as any existing page in the same sitemap
    if (body.parentId) {
      const parentPage = await db.query.pages.findFirst({
        where: (pages, { eq, and }) => and(
          eq(pages.id, body.parentId),
          eq(pages.sitemapId, body.sitemapId)
        )
      })
      if (!parentPage) {
        return status(400, { error: 'Parent page not found' })
      }
    }

    // Set home icon by default for home pages (slug === '/' or name is "Home")
    const isHomePage = body.slug === '/' || body.name.toLowerCase() === 'home';
    const defaultIcon = body.icon || (isHomePage ? 'home' : null);

    const page = await db.insert(schema.pages).values({
      sitemapId: body.sitemapId,
      parentId: body.parentId || null,
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      icon: defaultIcon,
      sortOrder: body.sortOrder || 0,
    }).returning().then(res => res[0])

    if (!page) throw new Error('Page not created')

    return page
  }, {
    body: t.Object({
      sitemapId: t.Number(),
      parentId: t.Nullable(t.Number()),
      name: t.String(),
      slug: t.String(),
      description: t.Nullable(t.String()),
      icon: t.Nullable(t.String()),
      sortOrder: t.Number(),
    }),
    response: {
      400: t.Object({ error: t.String() }),
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        slug: t.String(),
        description: t.Nullable(t.String()),
        icon: t.Nullable(t.String()),
        sortOrder: t.Number(),
        parentId: t.Nullable(t.Number()),
        sitemapId: t.Number(),
      })
    }
  })

  // Update a page
  .put("/:id", async ({ user, params, body }) => {
    const page = await db.query.pages.findFirst({
      where: (pages, { eq }) => eq(pages.id, Number(params.id)),
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

    // Prevent a page from being its own parent
    if (body.parentId !== null && body.parentId === Number(params.id)) {
      return status(400, { error: 'A page cannot be its own parent' })
    }

    const updated = await db.update(schema.pages)
      .set({
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        icon: body.icon ?? null,
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.pages.id, Number(params.id)))
      .returning()
      .then(res => res[0])

    if (!updated) throw new Error('Page not updated')

    return updated
  }, {
    body: t.Object({
      name: t.String(),
      slug: t.String(),
      description: t.Nullable(t.String()),
      icon: t.Nullable(t.String()),
      parentId: t.Nullable(t.Number()),
      sortOrder: t.Number(),
    }),
    response: {
      400: t.Object({ error: t.String() }),
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        slug: t.String(),
        description: t.Nullable(t.String()),
        icon: t.Nullable(t.String()),
        sortOrder: t.Number(),
        parentId: t.Nullable(t.Number()),
        sitemapId: t.Number(),
      })
    }
  })

  // Delete a page
  .delete("/:id", async ({ user, params }) => {
    const page = await db.query.pages.findFirst({
      where: (pages, { eq }) => eq(pages.id, Number(params.id)),
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

    await db.delete(schema.pages)
      .where(eq(schema.pages.id, Number(params.id)))

    return { success: true }
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({ success: t.Boolean() })
    }
  })

  // Reorder pages
  .put("/:id/reorder", async ({ user, params, body }) => {
    const page = await db.query.pages.findFirst({
      where: (pages, { eq }) => eq(pages.id, Number(params.id)),
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

    // Prevent a page from being its own parent
    if (body.parentId !== null && body.parentId === Number(params.id)) {
      return status(400, { error: 'A page cannot be its own parent' })
    }

    // Update the page's parent and sort order
    await db.update(schema.pages)
      .set({
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.pages.id, Number(params.id)))

    // If reordering siblings, update other pages' sort orders
    if (body.siblingIds && body.siblingIds.length > 0) {
      const updates = body.siblingIds.map((siblingId: number, index: number) =>
        db.update(schema.pages)
          .set({
            sortOrder: index,
            updatedAt: new Date(),
          })
          .where(eq(schema.pages.id, siblingId))
      )
      await Promise.all(updates)
    }

    return { success: true }
  }, {
    body: t.Object({
      parentId: t.Nullable(t.Number()),
      sortOrder: t.Number(),
      siblingIds: t.Nullable(t.Array(t.Number())),
    }),
    response: {
      400: t.Object({ error: t.String() }),
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({ success: t.Boolean() })
    }
  })

