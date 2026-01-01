'use client';

import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown } from "lucide-react";

interface EditorFooterProps {
  zoom?: number;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export function EditorFooter({ zoom = 0.7, saveStatus }: EditorFooterProps) {
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
          <span className="text-sm text-muted-foreground">Sitemap 2</span>
          <span className="text-sm text-muted-foreground">=</span>
          <button className="text-sm font-medium flex items-center gap-1 hover:text-foreground transition-colors">
            {zoomPercent}%
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}

