import { Elysia, status, t } from 'elysia'
import { db, schema } from '@/db';
import { generateSitemapWorkflow } from '../workflows/generate-sitemap';
import { requireAuthenticated } from './helpers/auth';
import { eq } from 'drizzle-orm';

export const ProjectController = new Elysia({ prefix: "/projects", tags: ["Projects"] })
  .use(requireAuthenticated)

  // Stream project updates (for watching generation status)
  .get("/:id/stream", async ({ user, params, request }) => {
    const projectId = Number(params.id);
    const MAX_WAIT_TIME = 60000; // 1 minute
    const POLL_INTERVAL = 1000; // 1 second
    const startTime = Date.now();

    // Verify project exists and user has access
    const initialProject = await db.query.projects.findFirst({
      where: {
        id: projectId,
        teamId: {
          in: user.teams.map(team => team.id)
        }
      }
    });

    if (!initialProject) {
      return status(404, { error: 'Project not found' });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;
        let timeoutId: NodeJS.Timeout | null = null;

        // Helper to send data
        const send = (data: any) => {
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
          } catch (error) {
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
            const project = await db.query.projects.findFirst({
              where: {
                id: projectId,
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
            });

            if (!project) {
              send({ error: 'Project not found' });
              cleanup();
              return;
            }

            // Send current project state
            send(project);

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
          } catch (error) {
            console.error('Error fetching project:', error);
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
  })

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
