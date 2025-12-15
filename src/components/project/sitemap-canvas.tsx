"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PageCard } from "./page-card";
import { SitemapConnections } from "./connection-line";
import { LayoutGrid, MoreHorizontal } from "lucide-react";
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

  // Calculate positions for pages
  const getPagePositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};

    // Position the root page (Home)
    if (project.pages.length > 0) {
      const rootPage = project.pages[0];
      positions[rootPage.id] = { x: 400, y: 80, width: 280, height: 600 };

      // Position child pages
      if (rootPage.children) {
        const startX = 100;
        const spacing = 320;

        rootPage.children.forEach((child, index) => {
          positions[child.id] = {
            x: startX + index * spacing,
            y: 750,
            width: 280,
            height: 350,
          };
        });
      }
    }

    return positions;
  }, [project.pages]);

  const pagePositions = getPagePositions();

  // Calculate connection lines
  const getConnections = useCallback(() => {
    const connections: { from: Position; to: Position }[] = [];

    if (project.pages.length > 0 && project.pages[0].children) {
      const rootPage = project.pages[0];
      const rootPos = pagePositions[rootPage.id];

      if (rootPos) {
        const fromPoint = {
          x: rootPos.x + rootPos.width / 2,
          y: rootPos.y + rootPos.height,
        };

        rootPage.children.forEach((child) => {
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
  }, [project.pages, pagePositions]);

  const connections = getConnections();

  // Flatten pages for rendering
  const getAllPages = useCallback(() => {
    const pages: { page: ProjectPage; position: Position }[] = [];

    project.pages.forEach((page) => {
      const pos = pagePositions[page.id];
      if (pos) {
        pages.push({ page, position: { x: pos.x, y: pos.y } });
      }

      if (page.children) {
        page.children.forEach((child) => {
          const childPos = pagePositions[child.id];
          if (childPos) {
            pages.push({ page: child, position: { x: childPos.x, y: childPos.y } });
          }
        });
      }
    });

    return pages;
  }, [project.pages, pagePositions]);

  const allPages = getAllPages();

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
        <div className="absolute" style={{ left: 60, top: 20, width: 1000 }}>
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

        {/* Connection Lines */}
        <SitemapConnections connections={connections} />

        {/* Page Cards */}
        {allPages.map(({ page, position }) => (
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
              compact={page.id !== "page_home"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
