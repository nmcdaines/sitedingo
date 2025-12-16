import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

// Helper types for table builder
type TableBuilder = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  varchar: (config: { length: number }) => any;
};

// Helper for ULID primary keys
const ulidPrimaryKey = (t: TableBuilder) =>
  t.varchar({ length: 26 }).primaryKey().$defaultFn(() => ulid());

// Helper for ULID foreign keys
const ulidForeignKey = (t: TableBuilder) =>
  t.varchar({ length: 26 });

// Enums
export const teamRoleEnum = pgEnum("team_role", ["owner", "admin", "member"]);

// Teams
export const teams = pgTable("teams", (t) => ({
  id: ulidPrimaryKey(t),
  name: t.varchar({ length: 255 }).notNull(),
  slug: t.varchar({ length: 255 }).notNull().unique(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Team Members (links Clerk users to teams)
export const teamMembers = pgTable("team_members", (t) => ({
  id: ulidPrimaryKey(t),
  teamId: ulidForeignKey(t).notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: t.varchar({ length: 255 }).notNull(), // Clerk user ID
  role: teamRoleEnum().notNull().default("member"),
  createdAt: t.timestamp().notNull().defaultNow(),
}));

// Projects
export const projects = pgTable("projects", (t) => ({
  id: ulidPrimaryKey(t),
  teamId: ulidForeignKey(t).notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Sitemaps
export const sitemaps = pgTable("sitemaps", (t) => ({
  id: ulidPrimaryKey(t),
  projectId: ulidForeignKey(t).notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  isActive: t.boolean().notNull().default(false),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Pages (flat list with parentId for tree structure)
export const pages = pgTable("pages", (t) => ({
  id: ulidPrimaryKey(t),
  sitemapId: ulidForeignKey(t).notNull().references(() => sitemaps.id, { onDelete: "cascade" }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: ulidForeignKey(t).references((): any => pages.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 255 }).notNull(),
  slug: t.varchar({ length: 255 }).notNull(),
  description: t.text(),
  sortOrder: t.integer().notNull().default(0),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));

// Sections (belong to pages, contain component type + metadata)
export const sections = pgTable("sections", (t) => ({
  id: ulidPrimaryKey(t),
  pageId: ulidForeignKey(t).notNull().references(() => pages.id, { onDelete: "cascade" }),
  componentType: t.varchar({ length: 100 }).notNull(),
  name: t.varchar({ length: 255 }),
  metadata: t.jsonb().notNull().default({}),
  sortOrder: t.integer().notNull().default(0),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
}));
