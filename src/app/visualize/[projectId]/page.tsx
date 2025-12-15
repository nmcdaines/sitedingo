import { ProjectHeader } from "@/components/visualization/project-header";
import { VisualizationTabs } from "@/components/visualization/visualization-tabs";
import { SitemapCanvas } from "@/components/visualization/sitemap-canvas";
import { Toolbar } from "@/components/visualization/toolbar";
import { CanvasControls } from "@/components/visualization/canvas-controls";
import { EmptyState } from "@/components/visualization/empty-state";
import { getSitemapWithPages, getActiveSitemap } from "@/lib/queries/sitemap-queries";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface VisualizeProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function VisualizeProjectPage({
  params,
}: VisualizeProjectPageProps) {
  const { projectId } = await params;

  // Fetch project
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    notFound();
  }

  // Fetch active sitemap
  const sitemap = await getActiveSitemap(projectId);

  let sitemapData = [];
  if (sitemap) {
    sitemapData = await getSitemapWithPages(sitemap.id);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Project Header */}
      <ProjectHeader projectName={project.name} />

      {/* Navigation Tabs */}
      <VisualizationTabs activeTab="sitemap" />

      {/* Toolbar */}
      <Toolbar />

      {/* Sitemap Canvas */}
      <div className="flex-1 relative">
        {sitemapData.length > 0 ? (
          <>
            <SitemapCanvas pages={sitemapData} />
            <CanvasControls />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
