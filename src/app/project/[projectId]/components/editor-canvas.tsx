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
        metadata: Record<string, unknown>;
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
  onSectionSelect?: (section: { id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number; pageId?: number } | null) => void;
  selectedPageId?: number | null;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function EditorCanvas({ sitemap, zoom, onZoomChange, onSaveStatusChange, onPageSelect, onSectionSelect, selectedPageId, onDragStateChange }: EditorCanvasProps) {
  // Handle empty sitemap gracefully (during generation)
  const pages = sitemap?.pages || [];
  
  return (
    <div className="flex-1 overflow-hidden bg-[#f5f5f0] relative">
      {sitemap ? (
        <SitemapDiagram 
          pages={pages} 
          zoom={zoom} 
          onZoomChange={onZoomChange}
          sitemapId={sitemap.id}
          onSaveStatusChange={onSaveStatusChange}
          onPageSelect={onPageSelect}
          onSectionSelect={onSectionSelect}
          selectedPageId={selectedPageId}
          onDragStateChange={onDragStateChange}
        />
      ) : null}
    </div>
  );
}

