import { pgTable } from "drizzle-orm/pg-core";
import { Address } from "@/db/types";

export const organizations = pgTable("organizations", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: t.varchar().notNull(),
}));
