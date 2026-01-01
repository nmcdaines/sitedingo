'use client';

import React from 'react';
import { useParams } from 'next/navigation'
import { client } from "@/lib/client";
import { EditorHeader } from "./components/editor-header";
import { EditorSidebar } from "./components/editor-sidebar";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorFooter } from "./components/editor-footer";
import { PropertyPanel } from "./components/property-panel";
import { Spinner } from "@/components/ui/spinner";
import { SitemapDiagramProvider } from "./components/sitemap-diagram/sitemap-diagram-context";

interface ProjectData {
  id: number;
  name: string;
  description: string | null;
  isGenerating: boolean;
  sitemaps?: Array<{
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

function useGetProjectQuery(projectId: string) {
  const [projectData, setProjectData] = React.useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    // First, fetch the initial project data
    const fetchInitial = async () => {
      try {
        const res = await client.api.projects({ id: projectId }).get();
        if (res.data && typeof res.data === 'object' && 'error' in res.data) {
          const errorMessage = (res.data as { error?: string }).error || 'Project not found';
          throw new Error(errorMessage);
        }
        if (!res.data) {
          throw new Error('Project not found');
        }
        setProjectData(res.data);
        setIsLoading(false);

        // If project is generating, start streaming
        if (res.data.isGenerating) {
          startStreaming();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch project'));
        setIsLoading(false);
      }
    };

    const startStreaming = async () => {
      // Cancel existing stream if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this stream
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : 'http://localhost:3000';
        const streamUrl = `${baseUrl}/api/projects/${projectId}/stream`;
        
        const response = await fetch(streamUrl, {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (lines ending with \n\n)
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete message in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);
                
                // Check for errors
                if (data.error) {
                  setError(new Error(data.error));
                  abortController.abort();
                  return;
                }

                // Update project data
                setProjectData(data);

                // If generation is complete, close the stream
                if (!data.isGenerating) {
                  abortController.abort();
                  return;
                }
              } catch (err) {
                console.error('Error parsing stream data:', err);
              }
            }
          }
        }
      } catch (err) {
        // Ignore abort errors (they're expected when we close the stream)
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Stream error:', err);
          // Don't set error state on connection close - it might be intentional
        }
      }
    };

    fetchInitial();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [projectId]);

  // Create a query-like object for compatibility
  const query = {
    data: projectData,
    isLoading,
    isError: error !== null,
    error,
  };

  return [projectData, query] as const;
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
              <p className="text-sm text-muted-foreground">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
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
  const [selectedSection, setSelectedSection] = React.useState<{ id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number; pageId?: number } | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = React.useState(false);
  const prevIsGeneratingRef = React.useRef<boolean | undefined>(undefined);
  
  // Detect when generation completes (transitions from true to false)
  // This must be before any conditional returns to follow Rules of Hooks
  React.useEffect(() => {
    if (!project) return;
    
    const prevIsGenerating = prevIsGeneratingRef.current;
    const currentIsGenerating = project.isGenerating;

    // If it transitioned from generating to not generating, show success notification
    if (prevIsGenerating === true && currentIsGenerating === false) {
      setShowSuccessNotification(true);
      // Hide notification after 10 seconds
      const timeout = setTimeout(() => {
        setShowSuccessNotification(false);
      }, 10000);
      return () => clearTimeout(timeout);
    }

    // Update the ref for next comparison
    prevIsGeneratingRef.current = currentIsGenerating;
  }, [project]);
  
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
            {query.error instanceof Error ? query.error.message : 'The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.'}
          </p>
        </div>
      </div>
    );
  }
  
  // Safety check: ensure project exists
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Project not found.</p>
      </div>
    );
  }

  // Get the first sitemap (may be empty or undefined while generating)
  const sitemap = project.sitemaps?.[0];
  
  // If no sitemap exists yet and we're not generating, show error
  if (!sitemap && !project.isGenerating) {
    return (
      <>
        <EditorHeader project={project} />
        <div className="flex items-center justify-center h-full">
          <p>No sitemap found for this project.</p>
        </div>
      </>
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
      {project.isGenerating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <Spinner className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Generating your sitemap...</span>
            <span className="text-blue-700 ml-2">Pages and content are being created in real-time.</span>
          </p>
        </div>
      )}
      {showSuccessNotification && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-300 px-4 py-4 flex items-center gap-3 transition-all duration-300 ease-in-out shadow-sm">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-green-600 animate-pulse" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base text-green-900">
              <span className="font-bold text-lg">🎉 Your sitemap is ready!</span>
              <span className="text-green-800 ml-2 font-medium">Start editing and bring your vision to life.</span>
            </p>
          </div>
        </div>
      )}
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
        {sitemap ? (
          <SitemapDiagramProvider
            initialPages={sitemap.pages || []}
            sitemapId={sitemap.id}
            onSaveStatusChange={setSaveStatus}
            onPageSelect={handlePageSelect}
          >
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
          </SitemapDiagramProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f5f5f0]">
            <div className="text-center space-y-4">
              <Spinner className="mx-auto h-8 w-8" />
              <div>
                <p className="text-lg font-semibold">Creating your sitemap</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Generating pages and content...
                </p>
              </div>
            </div>
          </div>
        )}
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
