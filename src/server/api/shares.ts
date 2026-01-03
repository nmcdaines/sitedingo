import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { requireAuthenticated } from './helpers/auth';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Helper function to generate secure share token
function generateShareToken(): string {
  return randomBytes(24).toString('base64url'); // 32 chars, URL-safe
}

// Helper function to get base URL for share links
function getShareUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${baseUrl}/share/${token}`;
}

// Authenticated endpoints
export const SharesController = new Elysia({ prefix: "/shares", tags: ["Shares"] })
  .use(requireAuthenticated)
  // Create a new share link
  .post("/projects/:id", async ({ user, params }) => {
    const projectId = Number(params.id);

    // Verify project exists and user has access
    const project = await db.query.projects.findFirst({
      where: {
        id: projectId,
        teamId: {
          in: user.teams.map(team => team.id)
        }
      }
    });

    if (!project) {
      return status(404, { error: 'Project not found' });
    }

    // Generate unique token
    let shareToken: string;
    let attempts = 0;
    do {
      shareToken = generateShareToken();
      const existing = await db.query.shares.findFirst({
        where: { shareToken }
      });
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique share token');
      }
    } while (true);

    // Create share record
    const share = await db.insert(schema.shares).values({
      projectId,
      shareToken,
      createdBy: user.id,
      isActive: true,
    }).returning().then(res => res[0]);

    if (!share) {
      throw new Error('Failed to create share');
    }

    return {
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: getShareUrl(share.shareToken),
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt?.toISOString() || null,
      isActive: share.isActive,
    };
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      200: t.Object({
        id: t.Number(),
        shareToken: t.String(),
        shareUrl: t.String(),
        createdAt: t.String(),
        expiresAt: t.Nullable(t.String()),
        isActive: t.Boolean(),
      })
    }
  })

  // List all share links for a project
  .get("/projects/:id", async ({ user, params }) => {
    const projectId = Number(params.id);

    // Verify project exists and user has access
    const project = await db.query.projects.findFirst({
      where: {
        id: projectId,
        teamId: {
          in: user.teams.map(team => team.id)
        }
      }
    });

    if (!project) {
      return status(404, { error: 'Project not found' });
    }

    // Get all shares for this project
    const shares = await db.query.shares.findMany({
      where: { projectId },
      orderBy: (shares, { desc }) => [desc(shares.createdAt)],
    });

    return shares.map(share => ({
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: getShareUrl(share.shareToken),
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt?.toISOString() || null,
      isActive: share.isActive,
    }));
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      200: t.Array(t.Object({
        id: t.Number(),
        shareToken: t.String(),
        shareUrl: t.String(),
        createdAt: t.String(),
        expiresAt: t.Nullable(t.String()),
        isActive: t.Boolean(),
      }))
    }
  })

  // Revoke a share link
  .delete("/:token", async ({ user, params }) => {
    const token = params.token;

    // Find the share
    const share = await db.query.shares.findFirst({
      where: { shareToken: token },
      with: {
        project: {
          with: {
            team: true,
          }
        }
      }
    });

    if (!share) {
      return status(404, { error: 'Share not found' });
    }

    // Verify user has access to the project
    const teamIds = user.teams.map(team => team.id);
    if (!share.project?.team || !teamIds.includes(share.project.team.id)) {
      return status(403, { error: 'Forbidden' });
    }

    // Deactivate the share
    await db.update(schema.shares)
      .set({ isActive: false })
      .where(eq(schema.shares.id, share.id));

    return { success: true };
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      403: t.Object({ error: t.String() }),
      200: t.Object({ success: t.Boolean() })
    }
  });

// Public endpoints (no authentication required)
export const PublicSharesController = new Elysia({ prefix: "/shares", tags: ["Public Shares"] })
  // Get project data via share token
  .get("/:token", async ({ params }) => {
    const token = params.token;

    try {
      // Find active, non-expired share
      const share = await db.query.shares.findFirst({
        where: {
          shareToken: token,
          isActive: true,
        },
        with: {
          project: {
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
          }
        }
      });

      if (!share) {
        return status(404, { error: 'Share not found or expired' });
      }

      // Check expiration
      if (share.expiresAt && share.expiresAt < new Date()) {
        return status(404, { error: 'Share link has expired' });
      }

      const project = share.project;
      if (!project) {
        return status(404, { error: 'Project not found' });
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        isGenerating: project.isGenerating,
        sitemaps: project.sitemaps.map((sitemap: any) => ({
          id: sitemap.id,
          name: sitemap.name,
          description: sitemap.description,
          pages: sitemap.pages.map((page: any) => ({
            id: page.id,
            name: page.name,
            slug: page.slug,
            description: page.description,
            icon: page.icon,
            sortOrder: page.sortOrder,
            parentId: page.parentId,
            sections: page.sections.map((section: any) => ({
              id: section.id,
              componentType: section.componentType,
              name: section.name,
              metadata: section.metadata,
              sortOrder: section.sortOrder,
            }))
          }))
        }))
      };
    } catch (error) {
      console.error('Error fetching share:', error);
      return status(500, { error: 'Internal server error' });
    }
  }, {
    response: {
      404: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() }),
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
          }))
        }))
      })
    }
  })

  // Stream project updates via share token
  .get("/:token/stream", async ({ params, request }) => {
    const token = params.token;
    const MAX_WAIT_TIME = 60000; // 1 minute
    const POLL_INTERVAL = 1000; // 1 second
    const startTime = Date.now();

    // Verify share exists and is active
    const initialShare = await db.query.shares.findFirst({
      where: {
        shareToken: token,
        isActive: true,
      },
      with: {
        project: true,
      }
    });

    if (!initialShare) {
      return status(404, { error: 'Share not found or expired' });
    }

    // Check expiration
    if (initialShare.expiresAt && initialShare.expiresAt < new Date()) {
      return status(404, { error: 'Share link has expired' });
    }

    const projectId = initialShare.projectId;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;
        let timeoutId: NodeJS.Timeout | null = null;

        // Helper to send data
        const send = (data: unknown) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (error) {
            console.error('Error sending stream data:', error);
            cleanup();
          }
        };

        // Helper to cleanup
        const cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          try {
            controller.close();
          } catch {
            // Stream may already be closed
          }
        };

        // Handle connection close
        request.signal.addEventListener('abort', () => {
          cleanup();
        });

        // Polling function
        const poll = async (): Promise<void> => {
          if (isClosed) return;

          // Check if we've exceeded max wait time
          if (Date.now() - startTime >= MAX_WAIT_TIME) {
            send({ error: 'Timeout: Maximum wait time exceeded' });
            cleanup();
            return;
          }

          try {
            // Verify share is still active
            const share = await db.query.shares.findFirst({
              where: {
                shareToken: token,
                isActive: true,
              }
            });

            if (!share) {
              send({ error: 'Share not found or expired' });
              cleanup();
              return;
            }

            // Check expiration
            if (share.expiresAt && share.expiresAt < new Date()) {
              send({ error: 'Share link has expired' });
              cleanup();
              return;
            }

            // Get project data
            const project = await db.query.projects.findFirst({
              where: { id: projectId },
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
            });

            if (!project) {
              send({ error: 'Project not found' });
              cleanup();
              return;
            }

            // Send current project state
            send({
              id: project.id,
              name: project.name,
              description: project.description,
              isGenerating: project.isGenerating,
              sitemaps: project.sitemaps.map(sitemap => ({
                id: sitemap.id,
                name: sitemap.name,
                description: sitemap.description,
                pages: sitemap.pages.map(page => ({
                  id: page.id,
                  name: page.name,
                  slug: page.slug,
                  description: page.description,
                  icon: page.icon,
                  sortOrder: page.sortOrder,
                  parentId: page.parentId,
                  sections: page.sections.map(section => ({
                    id: section.id,
                    componentType: section.componentType,
                    name: section.name,
                    metadata: section.metadata,
                    sortOrder: section.sortOrder,
                  }))
                }))
              }))
            });

            // If generation is complete, close the stream
            if (!project.isGenerating) {
              cleanup();
              return;
            }

            // Schedule next poll using setTimeout with a promise
            timeoutId = setTimeout(() => {
              poll().catch((error) => {
                console.error('Error in poll:', error);
                send({ error: 'Error polling project status' });
                cleanup();
              });
            }, POLL_INTERVAL);
          } catch {
            send({ error: 'Error fetching project status' });
            cleanup();
          }
        };

        // Start polling
        poll().catch((error) => {
          console.error('Error starting poll:', error);
          cleanup();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  });

