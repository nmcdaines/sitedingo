import * as schema from "@/db/schema";
import { defineRelations } from "drizzle-orm";

export const relations = defineRelations(schema, (r) => ({}))

