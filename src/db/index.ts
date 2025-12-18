import { drizzle } from 'drizzle-orm/neon-http';
import { relations } from "@/db/relations";

export * as schema from "@/db/schema";

export const db = drizzle(process.env.DATABASE_URL!, { relations });
