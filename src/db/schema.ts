import { pgTable } from "drizzle-orm/pg-core";

// Teams
export const teams = pgTable("teams", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: t.varchar({ length: 255 }).notNull(),
  slug: t.varchar({ length: 255 }).notNull().unique(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Team Members (links Clerk users to teams)
export const teamMembers = pgTable("team_members", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  teamId: t.integer().notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: t.integer().notNull(), // Clerk user ID
  role: t.varchar({ enum: ["owner", "admin", "member"] }).notNull().default("member"),
  createdAt: t.timestamp().notNull().defaultNow(),
}));

// Projects
export const projects = pgTable("projects", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  teamId: t.integer().notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Sitemaps
export const sitemaps = pgTable("sitemaps", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: t.integer().notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Pages (flat list with parentId for tree structure)
export const pages = pgTable("pages", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  sitemapId: t.integer().notNull().references(() => sitemaps.id, { onDelete: "cascade" }),
  parentId: t.integer(), // Self-reference to pages.id
  name: t.varchar({ length: 255 }).notNull(),
  slug: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  sortOrder: t.integer().notNull().default(0),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Sections (belong to pages, contain component type + metadata)
export const sections = pgTable("sections", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  pageId: t.integer().notNull().references(() => pages.id, { onDelete: "cascade" }),
  componentType: t.varchar({ length: 100 }).notNull(),
  name: t.varchar({ length: 255 }),
  metadata: t.jsonb().notNull().default({}),
  sortOrder: t.integer().notNull().default(0),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));
