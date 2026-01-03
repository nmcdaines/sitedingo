'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Spinner } from "@/components/ui/spinner";
import { SitemapDiagramProvider } from "@/app/project/[projectId]/components/sitemap-diagram/sitemap-diagram-context";
import { SitemapErrorBoundary } from "@/app/project/[projectId]/components/sitemap-diagram/components/sitemap-error-boundary";
import { SitemapDiagram } from "@/app/project/[projectId]/components/sitemap-diagram/sitemap-diagram";

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
      icon: string | null;
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

function useGetSharedProjectQuery(token: string) {
  const [projectData, setProjectData] = React.useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    // First, fetch the initial project data
    const fetchInitial = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/shares/${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch project' }));
          throw new Error(errorData.error || 'Project not found');
        }

        const data = await response.json();
        setProjectData(data);
        setIsLoading(false);

        // If project is generating, start streaming
        if (data.isGenerating) {
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
        const streamUrl = `${baseUrl}/api/shares/${token}/stream`;
        
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
  }, [token]);

  // Create a query-like object for compatibility
  const query = {
    data: projectData,
    isLoading,
    isError: error !== null,
    error,
  };

  return [projectData, query] as const;
}

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ErrorBoundary 
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Share link not found</p>
              <p className="text-sm text-muted-foreground">This share link may have expired or been revoked.</p>
            </div>
          </div>
        }
      >
        <ShareContent token={token} />
      </ErrorBoundary>
    </div>
  );
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
    console.error('SharePage error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function ShareContent({ token }: { token: string }) {
  const [project, query] = useGetSharedProjectQuery(token);
  const [zoom, setZoom] = React.useState(0.7);
  
  // Handle loading state
  if (query.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading shared project...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (query.isError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Share link not found</p>
          <p className="text-sm text-muted-foreground">
            {query.error instanceof Error ? query.error.message : 'This share link may have expired or been revoked.'}
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
        <ShareHeader project={project} />
        <div className="flex items-center justify-center h-full">
          <p>No sitemap found for this project.</p>
        </div>
      </>
    );
  }

  const handleZoomIn = () => setZoom(prev => Math.min(2, prev * 1.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev * 0.9));
  const handleZoomFit = () => setZoom(0.7);

  return (
    <>
      <ShareHeader project={project} />
      {project.isGenerating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <Spinner className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Generating sitemap...</span>
            <span className="text-blue-700 ml-2">Pages and content are being created in real-time.</span>
          </p>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
        {sitemap ? (
          <SitemapDiagramProvider
            initialPages={sitemap.pages || []}
            sitemapId={sitemap.id}
            onSaveStatusChange={() => {}} // No-op for read-only
            onPageSelect={() => {}} // No-op for read-only
          >
            <SitemapErrorBoundary>
              <div className="flex-1 flex items-center justify-center bg-[#f5f5f0]">
                <SitemapDiagram 
                  pages={sitemap.pages || []}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onPageSelect={() => {}} // Read-only: no selection
                  onSectionSelect={() => {}} // Read-only: no selection
                  selectedPageId={null} // Read-only: no selection
                  onDragStateChange={() => {}} // Read-only: no dragging
                  readOnly={true}
                />
              </div>
            </SitemapErrorBoundary>
          </SitemapDiagramProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f5f5f0]">
            <div className="text-center space-y-4">
              <Spinner className="mx-auto h-8 w-8" />
              <div>
                <p className="text-lg font-semibold">Creating sitemap</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Generating pages and content...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <ShareFooter 
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
      />
    </>
  );
}

function ShareHeader({ project }: { project: ProjectData }) {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 ml-2">
            <span className="font-semibold">{project.name}</span>
            {project.description && (
              <span className="text-xs text-muted-foreground">{project.description}</span>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-xs text-muted-foreground">Read-only view</span>
        </div>
      </div>
    </header>
  );
}

function ShareFooter({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onZoomFit 
}: { 
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}) {
  return (
    <footer className="border-t bg-background px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="px-2 py-1 text-sm hover:bg-accent rounded"
          title="Zoom out"
        >
          −
        </button>
        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="px-2 py-1 text-sm hover:bg-accent rounded"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={onZoomFit}
          className="px-2 py-1 text-sm hover:bg-accent rounded ml-2"
          title="Fit to screen"
        >
          Fit
        </button>
      </div>
    </footer>
  );
}

