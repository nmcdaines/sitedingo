"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PageCard } from "./page-card";
import { SitemapConnections } from "./connection-line";
import { LayoutGrid, MoreHorizontal, Map } from "lucide-react";
import type { ProjectPage, ProjectData } from "./types";

interface SitemapCanvasProps {
  project: ProjectData;
  zoom: number;
  selectedPageId?: string;
  selectedSectionId?: string;
  onPageSelect: (pageId: string) => void;
  onSectionSelect: (pageId: string, sectionId: string) => void;
}

interface Position {
  x: number;
  y: number;
}

interface PagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SitemapCanvas({
  project,
  zoom,
  selectedPageId,
  selectedSectionId,
  onPageSelect,
  onSectionSelect,
}: SitemapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<Position>({ x: 50, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Position>({ x: 0, y: 0 });

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      }
    },
    [pan]
  );

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      }
    },
    [isPanning, startPan]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Calculate all page positions using useMemo for stability
  const { connections, allPages, canvasWidth } = useMemo(() => {
    const positions: Record<string, PagePosition> = {};
    const sitemap = project.sitemap;
    const connectionsList: { from: Position; to: Position }[] = [];
    const pagesList: { page: ProjectPage; position: Position; isHome: boolean }[] = [];

    if (sitemap.pages.length > 0) {
      const homePage = sitemap.pages[0];
      const homeWidth = 260;
      const childWidth = 220;
      const childSpacing = 240;

      // Calculate total width needed for children
      const childCount = homePage.children?.length || 0;
      const totalChildrenWidth = childCount > 0 
        ? childCount * childSpacing 
        : 0;

      // Center home page above children
      const homeX = childCount > 0
        ? (totalChildrenWidth / 2) - (homeWidth / 2) + 40
        : 400;

      positions[homePage.id] = {
        x: homeX,
        y: 100,
        width: homeWidth,
        height: 420,
      };

      // Add home page to list
      pagesList.push({
        page: homePage,
        position: { x: homeX, y: 100 },
        isHome: true,
      });

      // Position child pages in a row below home
      if (homePage.children && homePage.children.length > 0) {
        const startX = 40;

        homePage.children.forEach((child, index) => {
          const childX = startX + index * childSpacing;
          const childY = 600;

          positions[child.id] = {
            x: childX,
            y: childY,
            width: childWidth,
            height: 260,
          };

          // Add child page to list
          pagesList.push({
            page: child,
            position: { x: childX, y: childY },
            isHome: false,
          });

          // Add connection from home to child
          connectionsList.push({
            from: {
              x: homeX + homeWidth / 2,
              y: 100 + 420, // home bottom
            },
            to: {
              x: childX + childWidth / 2,
              y: childY,
            },
          });
        });
      }
    }

    // Calculate canvas width
    const positionValues = Object.values(positions);
    const width = positionValues.length > 0
      ? Math.max(...positionValues.map((p) => p.x + p.width), 1200) + 100
      : 1300;

    return {
      connections: connectionsList,
      allPages: pagesList,
      canvasWidth: width,
    };
  }, [project.sitemap]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 min-h-0 bg-[#f5f5f0] overflow-hidden relative",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
      style={{ minHeight: "400px" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas Content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
          transformOrigin: "top left",
        }}
      >
        {/* Project Header Card */}
        <div 
          className="absolute bg-card border border-border rounded-lg shadow-sm"
          style={{ left: 0, top: 0, width: canvasWidth - 40 }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Project</span>
            </div>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Sitemap Header Card */}
        <div 
          className="absolute bg-card border border-border rounded-lg shadow-sm"
          style={{ left: 20, top: 55, width: canvasWidth - 80 }}
        >
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{project.sitemap.name}</span>
            </div>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Connection Lines */}
        <SitemapConnections connections={connections} />

        {/* Page Cards */}
        {allPages.map(({ page, position, isHome }) => (
          <div
            key={page.id}
            className="absolute"
            style={{ left: position.x, top: position.y }}
          >
            <PageCard
              page={page}
              isSelected={selectedPageId === page.id}
              selectedSectionId={selectedPageId === page.id ? selectedSectionId : undefined}
              onClick={() => onPageSelect(page.id)}
              onSectionClick={(sectionId) => onSectionSelect(page.id, sectionId)}
              compact={!isHome}
            />
          </div>
        ))}

      </div>
    </div>
  );
}
