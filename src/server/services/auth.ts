import { db, schema } from "@/db";

/**
 * Creates a new user in the database.
 * 
 * @param clerkId - The Clerk user ID
 * @param options - Optional user data to sync from Clerk
 * @returns The newly created user
 * @throws Error if user creation fails
 */
export async function createUser(
  clerkId: string,
  options?: {
    email?: string;
    name?: string;
  }
) {
  // Insert the new user
  const [newUser] = await db
    .insert(schema.users)
    .values({
      clerkId,
      email: options?.email,
      name: options?.name,
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user record");
  }

  return newUser;
}

