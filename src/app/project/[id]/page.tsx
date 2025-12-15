"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ProjectHeader,
  Toolbar,
  ZoomControls,
  SitemapCanvas,
  SectionDetailPanel,
  mockProjectData,
  type ViewMode,
  type ProjectSection,
} from "@/components/project";

export default function ProjectPage() {
  const [activeView, setActiveView] = useState<ViewMode>("sitemap");
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(68);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 25));
  }, []);

  const handleFitToScreen = useCallback(() => {
    setZoom(68);
  }, []);

  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(undefined);
  }, []);

  const handleSectionSelect = useCallback((pageId: string, sectionId: string) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(sectionId);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedSectionId(undefined);
  }, []);

  // Find the selected section and page name
  const selectedSection = useMemo((): { section: ProjectSection; pageName: string } | null => {
    if (!selectedPageId || !selectedSectionId) return null;

    // Search through all pages
    const findInPages = (pages: typeof mockProjectData.pages): { section: ProjectSection; pageName: string } | null => {
      for (const page of pages) {
        if (page.id === selectedPageId) {
          const section = page.sections.find((s) => s.id === selectedSectionId);
          if (section) return { section, pageName: page.name };
        }
        if (page.children) {
          const result = findInPages(page.children);
          if (result) return result;
        }
      }
      return null;
    };

    return findInPages(mockProjectData.pages);
  }, [selectedPageId, selectedSectionId]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <ProjectHeader
        project={mockProjectData}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Canvas */}
        {activeView === "sitemap" && (
          <SitemapCanvas
            project={mockProjectData}
            zoom={zoom}
            selectedPageId={selectedPageId}
            selectedSectionId={selectedSectionId}
            onPageSelect={handlePageSelect}
            onSectionSelect={handleSectionSelect}
          />
        )}

        {/* Placeholder for other views */}
        {activeView !== "sitemap" && (
          <div className="flex-1 h-full flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace("-", " ")} View
              </h2>
              <p className="text-muted-foreground">
                This view is coming soon
              </p>
            </div>
          </div>
        )}

        {/* Section Detail Panel */}
        {selectedSection && (
          <SectionDetailPanel
            section={selectedSection.section}
            pageName={selectedSection.pageName}
            isOpen={!!selectedSectionId}
            onClose={handleClosePanel}
            position={{ x: 100, y: 300 }}
          />
        )}

        {/* Zoom Controls */}
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToScreen={handleFitToScreen}
        />
      </div>
    </div>
  );
}
