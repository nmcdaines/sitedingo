import * as schema from "@/db/schema";
import { defineRelations } from "drizzle-orm";

export const relations = defineRelations(schema, (r) => ({
  teams: {
    members: r.many.teamMembers(),
    projects: r.many.projects(),
  },
  teamMembers: {
    team: r.one.teams({
      from: r.teamMembers.teamId,
      to: r.teams.id,
    }),
  },
  projects: {
    team: r.one.teams({
      from: r.projects.teamId,
      to: r.teams.id,
    }),
    sitemaps: r.many.sitemaps(),
  },
  sitemaps: {
    project: r.one.projects({
      from: r.sitemaps.projectId,
      to: r.projects.id,
    }),
    pages: r.many.pages(),
  },
  pages: {
    sitemap: r.one.sitemaps({
      from: r.pages.sitemapId,
      to: r.sitemaps.id,
    }),
    parent: r.one.pages({
      from: r.pages.parentId,
      to: r.pages.id,
    }),
    children: r.many.pages({
      from: r.pages.id,
      to: r.pages.parentId,
    }),
    sections: r.many.sections(),
  },
  sections: {
    page: r.one.pages({
      from: r.sections.pageId,
      to: r.pages.id,
    }),
  },
}));
