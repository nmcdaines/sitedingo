import Elysia from "elysia";
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
    const user = auth()

    if (!user.userId) throw new Error()
    
    return {
      user: {
        id: 0,
        clerkUserId: user.userId,
      }
    }
  })
  .as('scoped')
