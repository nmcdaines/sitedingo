'use client';

import React from 'react';
import { useParams } from 'next/navigation'
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { EditorHeader } from "./components/editor-header";
import { EditorSidebar } from "./components/editor-sidebar";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorFooter } from "./components/editor-footer";
import { PropertyPanel } from "./components/property-panel";

function useGetProjectQuery(projectId: string) {
  const query = useSuspenseQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      return client.api.projects({ id: projectId }).get().then(res => res.data);
    }
  })
  return [query.data, query] as const;
}

export default function EditorPage() {
  const params = useParams<{ projectId: string }>()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading project...</div>}>
        <EditorContent projectId={params.projectId} />
      </Suspense>
    </div>
  );
}

function EditorContent({ projectId }: { projectId: string }) {
  const [project] = useGetProjectQuery(projectId);
  const [zoom, setZoom] = React.useState(0.7);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedPage, setSelectedPage] = React.useState<{ id: number; name: string; slug: string; description: string | null; sortOrder: number; parentId: number | null } | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  
  // Get the first sitemap (projects should have at least one)
  const sitemap = project.sitemaps?.[0];
  
  if (!sitemap) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No sitemap found for this project.</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom(prev => Math.min(2, prev * 1.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev * 0.9));
  const handleZoomFit = () => setZoom(0.7);

  const handlePageSelect = (page: typeof selectedPage) => {
    setSelectedPage(page);
    setIsPropertyPanelOpen(page !== null);
  };

  const handlePageDelete = () => {
    setSelectedPage(null);
    setIsPropertyPanelOpen(false);
  };

  return (
    <>
      <EditorHeader project={project} />
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar 
          onUndo={() => {
            // Undo is handled in SitemapDiagram via keyboard shortcuts
            // This is just for the button
          }}
          onRedo={() => {
            // Redo is handled in SitemapDiagram via keyboard shortcuts
            // This is just for the button
          }}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <EditorCanvas 
          project={project} 
          sitemap={sitemap} 
          zoom={zoom} 
          onZoomChange={setZoom}
          onSaveStatusChange={setSaveStatus}
          onPageSelect={handlePageSelect}
          selectedPageId={selectedPage?.id}
          onUndo={() => setCanUndo(false)}
          onRedo={() => setCanRedo(false)}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <PropertyPanel
          page={selectedPage}
          isOpen={isPropertyPanelOpen}
          onClose={() => {
            setIsPropertyPanelOpen(false);
            setSelectedPage(null);
          }}
          onDelete={handlePageDelete}
        />
      </div>
      <EditorFooter 
        zoom={zoom} 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        saveStatus={saveStatus}
      />
    </>
  );
}
