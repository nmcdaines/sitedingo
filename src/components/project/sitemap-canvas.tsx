"use client";

import { useState, useRef, useCallback } from "react";
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
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
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

  // Calculate positions for pages - centered layout with home at top
  const getPagePositions = useCallback(() => {
    const positions: Record<string, PagePosition> = {};
    const sitemap = project.sitemap;

    if (sitemap.pages.length > 0) {
      const homePage = sitemap.pages[0];
      const homeWidth = 260;
      const childWidth = 220;
      const childSpacing = 240;
      
      // Calculate total width needed for children
      const childCount = homePage.children?.length || 0;
      const totalChildrenWidth = childCount * childWidth + (childCount - 1) * (childSpacing - childWidth);
      
      // Center home page above children
      const homeX = childCount > 0 
        ? (totalChildrenWidth / 2) - (homeWidth / 2) + 80
        : 400;

      positions[homePage.id] = { 
        x: homeX, 
        y: 120, 
        width: homeWidth, 
        height: 450 
      };

      // Position child pages in a row below home
      if (homePage.children) {
        const startX = 80;
        
        homePage.children.forEach((child, index) => {
          positions[child.id] = {
            x: startX + index * childSpacing,
            y: 650,
            width: childWidth,
            height: 280,
          };
        });
      }
    }

    return positions;
  }, [project.sitemap]);

  const pagePositions = getPagePositions();

  // Calculate connection lines from home to each child page
  const getConnections = useCallback(() => {
    const connections: { from: Position; to: Position }[] = [];
    const sitemap = project.sitemap;

    if (sitemap.pages.length > 0 && sitemap.pages[0].children) {
      const homePage = sitemap.pages[0];
      const homePos = pagePositions[homePage.id];

      if (homePos) {
        const fromPoint = {
          x: homePos.x + homePos.width / 2,
          y: homePos.y + homePos.height,
        };

        homePage.children?.forEach((child) => {
          const childPos = pagePositions[child.id];
          if (childPos) {
            connections.push({
              from: fromPoint,
              to: {
                x: childPos.x + childPos.width / 2,
                y: childPos.y,
              },
            });
          }
        });
      }
    }

    return connections;
  }, [project.sitemap, pagePositions]);

  const connections = getConnections();

  // Get all pages for rendering
  const getAllPages = useCallback(() => {
    const pages: { page: ProjectPage; position: Position; isHome: boolean }[] = [];
    const sitemap = project.sitemap;

    sitemap.pages.forEach((page) => {
      const pos = pagePositions[page.id];
      if (pos) {
        pages.push({ page, position: { x: pos.x, y: pos.y }, isHome: true });
      }

      if (page.children) {
        page.children.forEach((child) => {
          const childPos = pagePositions[child.id];
          if (childPos) {
            pages.push({ page: child, position: { x: childPos.x, y: childPos.y }, isHome: false });
          }
        });
      }
    });

    return pages;
  }, [project.sitemap, pagePositions]);

  const allPages = getAllPages();

  // Calculate canvas bounds for project/sitemap headers
  const canvasWidth = Math.max(
    ...Object.values(pagePositions).map(p => p.x + p.width),
    1200
  ) + 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 bg-[#f5f5f0] overflow-hidden relative",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
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
        <div className="absolute" style={{ left: 40, top: 20, width: canvasWidth - 80 }}>
          <div className="bg-card border border-border rounded-lg shadow-sm">
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
        </div>

        {/* Sitemap Header Card */}
        <div className="absolute" style={{ left: 60, top: 65, width: canvasWidth - 120 }}>
          <div className="bg-card border border-border rounded-lg shadow-sm">
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
