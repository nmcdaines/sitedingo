import { drizzle } from "drizzle-orm/bun-sql/postgres";
import { relations } from "@/db/relations";

export const db = drizzle(process.env.DATABASE_URL!, { relations });