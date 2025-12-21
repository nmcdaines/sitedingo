import { Elysia, status } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { db } from "@/db";
import { createUser } from "@/server/services/auth";

export type User = {
  id: number,
  clerkId: string,
  teams: Array<{
    id: number,
    name: string,
    role: "owner" | "admin" | "member",
  }>,
};

function getUserWithRoles(clerkUserId: string) {
  return db.query.users.findFirst({
    where: {
      clerkId: clerkUserId,
    },
    with: {
      teamMemberships: {
        columns: {
          teamId: true,
          role: true,
        },
        with: {
          team: true,
        },
      },
    },
  });
}

export const requireAuthenticated = new Elysia({ name: 'require-authenticated' })
  .use(clerkPlugin({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  }))
  .state('user', null as User | null)
  .resolve(async ({ auth }) => {
    const clerkAuth = auth()
    if (!clerkAuth.userId) {
      throw status(401, {
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in to access this resource.'
      })
    }
    
    // Look up user in database with teams and roles
    const user = await getUserWithRoles(clerkAuth.userId)

    if (!user) {
      // Create user on first login using transaction
      try {
        const newUser = await createUser(clerkAuth.userId, {
          // Optionally sync email/name from Clerk here if available
          // email: clerkAuth.email,
          // name: clerkAuth.name,
        });
        
        // New user has no team memberships yet
        return {
          user: {
            id: newUser.id,
            clerkId: newUser.clerkId,
            teams: [],
          }
        };
      } catch (error) {
        throw status(500, {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Failed to create user record.'
        });
      }
    }
    
    // Transform team memberships into teams array with roles
    const teams = user.teamMemberships
      .filter((membership) => membership.team !== null)
      .map((membership) => ({
        id: membership.team!.id,
        name: membership.team!.name,
        slug: membership.team!.slug,
        role: membership.role as "owner" | "admin" | "member",
      }));
    
    return {
      user: {
        id: user.id,
        clerkId: user.clerkId,
        teams,
      }
    }
  })
  .as('scoped')
