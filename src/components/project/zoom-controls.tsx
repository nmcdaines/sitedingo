"use client";

import { Plus, Minus, Maximize2, LayoutGrid } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
      {/* Project Label */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-sm">
        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Project</span>
        <div className="w-px h-4 bg-border mx-1" />
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-card border border-border rounded-lg shadow-sm">
        <button
          onClick={onZoomOut}
          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-12 text-center text-sm font-medium tabular-nums">
          {Math.round(zoom)}%
        </span>

        <button
          onClick={onZoomIn}
          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={onFitToScreen}
          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Fit to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
