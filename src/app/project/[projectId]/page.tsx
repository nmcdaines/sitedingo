'use client';

import React from 'react';
import { useParams } from 'next/navigation'
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { EditorHeader } from "./components/editor-header";
import { EditorSidebar } from "./components/editor-sidebar";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorFooter } from "./components/editor-footer";
import { PropertyPanel } from "./components/property-panel";

function useGetProjectQuery(projectId: string) {
  const query = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const res = await client.api.projects({ id: projectId }).get();
      // Check if response contains an error
      if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        const errorMessage = (res.data as { error?: string }).error || 'Project not found';
        throw new Error(errorMessage);
      }
      // Check if data is missing (which would indicate an error)
      if (!res.data) {
        throw new Error('Project not found');
      }
      return res.data;
    }
  })
  return [query.data, query] as const;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EditorPage error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function EditorPage() {
  const params = useParams<{ projectId: string }>()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ErrorBoundary 
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Project not found</p>
              <p className="text-sm text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          </div>
        }
      >
        <EditorContent projectId={params.projectId} />
      </ErrorBoundary>
    </div>
  );
}

function EditorContent({ projectId }: { projectId: string }) {
  const [project, query] = useGetProjectQuery(projectId);
  const [zoom, setZoom] = React.useState(0.7);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedPage, setSelectedPage] = React.useState<{ id: number; name: string; slug: string; description: string | null; sortOrder: number; parentId: number | null } | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<{ id: number; componentType: string; name: string | null; metadata: any; sortOrder: number; pageId?: number } | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Handle loading state
  if (query.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }
  
  // Handle error state
  if (query.isError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Project not found</p>
          <p className="text-sm text-muted-foreground">
            {query.error instanceof Error ? query.error.message : 'The project you\'re looking for doesn\'t exist or you don\'t have access to it.'}
          </p>
        </div>
      </div>
    );
  }
  
  // Safety check: ensure project exists and has sitemaps
  if (!project || !project.sitemaps) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Project not found or has no sitemaps.</p>
      </div>
    );
  }
  
  // Get the first sitemap (projects should have at least one)
  const sitemap = project.sitemaps[0];
  
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
    setSelectedSection(null);
    setIsPropertyPanelOpen(page !== null);
  };

  const handleSectionSelect = (section: typeof selectedSection) => {
    setSelectedSection(section);
    setSelectedPage(null);
    setIsPropertyPanelOpen(section !== null);
  };

  const handlePageDelete = () => {
    setSelectedPage(null);
    setIsPropertyPanelOpen(false);
  };

  const handleSectionDelete = () => {
    setSelectedSection(null);
    setIsPropertyPanelOpen(false);
  };

  const handleTogglePropertyPanel = () => {
    // Always toggle - if no page selected, will edit project
    setIsPropertyPanelOpen(prev => !prev);
  };

  return (
    <>
      <EditorHeader project={project} />
      <div className="flex flex-1 overflow-hidden relative">
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
          isPropertyPanelOpen={isPropertyPanelOpen}
          onTogglePropertyPanel={handleTogglePropertyPanel}
        />
        <EditorCanvas 
          project={project} 
          sitemap={sitemap} 
          zoom={zoom} 
          onZoomChange={setZoom}
          onSaveStatusChange={setSaveStatus}
          onPageSelect={handlePageSelect}
          onSectionSelect={handleSectionSelect}
          selectedPageId={selectedPage?.id}
          onUndo={() => setCanUndo(false)}
          onRedo={() => setCanRedo(false)}
          canUndo={canUndo}
          canRedo={canRedo}
          onDragStateChange={setIsDragging}
        />
        <PropertyPanel
          page={selectedPage}
          project={project}
          section={selectedSection}
          isOpen={isPropertyPanelOpen}
          isDragging={isDragging}
          onClose={() => {
            setIsPropertyPanelOpen(false);
            setSelectedPage(null);
            setSelectedSection(null);
          }}
          onDelete={selectedSection ? handleSectionDelete : handlePageDelete}
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
