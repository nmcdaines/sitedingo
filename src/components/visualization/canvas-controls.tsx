"use client";

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  className?: string;
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  className,
}: CanvasControlsProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 flex flex-col gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2",
        className
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        className="h-8 w-8 p-0"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        className="h-8 w-8 p-0"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <div className="h-px bg-gray-200 my-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onFitView}
        className="h-8 w-8 p-0"
        title="Fit to view"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
