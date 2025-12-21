'use client';

import { Button } from "@/components/ui/button";
import { HelpCircle, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface EditorFooterProps {
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export function EditorFooter({ zoom = 0.7, onZoomIn, onZoomOut, onZoomFit, saveStatus }: EditorFooterProps) {
  const zoomPercent = Math.round(zoom * 100);
  
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Error saving';
      default:
        return null;
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-muted-foreground';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <footer className="border-t bg-background h-12 flex items-center justify-between px-4">
      <Button variant="ghost" size="icon" title="Help">
        <HelpCircle className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-4">
        {saveStatus && saveStatus !== 'idle' && (
          <span className={`text-sm transition-colors duration-200 ${getSaveStatusColor()}`}>
            {getSaveStatusText()}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Project</span>
          <span className="text-sm text-muted-foreground">=</span>
          <span className="text-sm font-medium min-w-[3rem] text-center">{zoomPercent}%</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomFit} title="Fit to Screen">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}

