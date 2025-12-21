'use client';

import { SitemapDiagram } from "./sitemap-diagram/sitemap-diagram";

interface Project {
  id: number;
  name: string;
  description: string | null;
  sitemaps: Array<{
    id: number;
    name: string;
    description: string | null;
    pages: Array<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
      parentId: number | null;
      sections: Array<{
        id: number;
        componentType: string;
        name: string | null;
        metadata: any;
        sortOrder: number;
      }>;
    }>;
  }>;
}

interface EditorCanvasProps {
  project: Project;
  sitemap: Project['sitemaps'][0];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onPageSelect?: (page: { id: number; name: string; slug: string; description: string | null; sortOrder: number; parentId: number | null } | null) => void;
  selectedPageId?: number | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function EditorCanvas({ project, sitemap, zoom, onZoomChange, onSaveStatusChange, onPageSelect, selectedPageId, onUndo, onRedo, canUndo, canRedo }: EditorCanvasProps) {
  return (
    <div className="flex-1 overflow-hidden bg-muted/30 relative">
      <SitemapDiagram 
        pages={sitemap.pages} 
        zoom={zoom} 
        onZoomChange={onZoomChange}
        sitemapId={sitemap.id}
        onSaveStatusChange={onSaveStatusChange}
        onPageSelect={onPageSelect}
        selectedPageId={selectedPageId}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}

