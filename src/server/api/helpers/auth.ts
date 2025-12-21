import { Elysia, status } from "elysia";
import { clerkPlugin } from "elysia-clerk";

export type User = {
  id: number,
  clerkId: string,
};

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
    
    return {
      user: {
        id: 0, // TODO: Look up user ID from database if needed
        clerkId: clerkAuth.userId,
      }
    }
  })
  .as('scoped')
