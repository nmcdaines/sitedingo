"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ProjectHeader,
  Toolbar,
  ZoomControls,
  SectionDetailPanel,
  mockProjectData as initialMockData,
  type ViewMode,
  type ProjectSection,
  type ProjectPage as ProjectPageType,
  type ProjectData,
} from "@/components/project";
import { SortablePageCard } from "@/components/project/sortable-page-card";
import { SortableSectionCard } from "@/components/project/sortable-section-card";
import { SitemapConnections } from "@/components/project/connection-line";
import { LayoutGrid, MoreHorizontal, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Page position type
interface PagePosition {
  x: number;
  y: number;
}

// Calculate initial positions for pages
function calculateInitialPositions(data: ProjectData): Record<string, PagePosition> {
  const positions: Record<string, PagePosition> = {};
  const homePage = data.sitemap.pages[0];
  
  if (!homePage) return positions;

  const homeWidth = 260;
  const childSpacing = 235;
  const childCount = homePage.children?.length || 0;
  
  // Center home above children
  const totalChildrenWidth = childCount * childSpacing;
  const homeX = childCount > 0 ? (totalChildrenWidth / 2) - (homeWidth / 2) + 40 : 400;
  
  positions[homePage.id] = { x: homeX, y: 100 };

  // Position children
  if (homePage.children) {
    homePage.children.forEach((child, index) => {
      positions[child.id] = {
        x: 40 + index * childSpacing,
        y: 580,
      };
    });
  }

  return positions;
}

export default function ProjectPage() {
  // Project data state
  const [projectData, setProjectData] = useState<ProjectData>(initialMockData);
  
  // Page positions state (for free-form movement)
  const [pagePositions, setPagePositions] = useState<Record<string, PagePosition>>(() => 
    calculateInitialPositions(initialMockData)
  );
  
  const [activeView, setActiveView] = useState<ViewMode>("sitemap");
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(75);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [pan, setPan] = useState({ x: 30, y: 10 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"page" | "section" | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialPagePos = useRef<PagePosition | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 25));
  }, []);

  const handleFitToScreen = useCallback(() => {
    setZoom(75);
    setPan({ x: 30, y: 10 });
  }, []);

  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(undefined);
  }, []);

  const handleSectionSelect = useCallback((pageId: string, sectionId: string) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(sectionId);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedSectionId(undefined);
  }, []);

  // Mouse handlers for panning canvas
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      }
    },
    [isPanning, startPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Determine if an ID is a page or section
  const getItemType = useCallback((id: string): "page" | "section" | null => {
    const allPages = [projectData.sitemap.pages[0], ...(projectData.sitemap.pages[0].children || [])];
    
    if (allPages.some(p => p.id === id)) return "page";
    
    for (const page of allPages) {
      if (page.sections.some(s => s.id === id)) return "section";
    }
    
    return null;
  }, [projectData]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const type = getItemType(id);
    
    setActiveId(id);
    setDragType(type);
    
    if (type === "page") {
      // Store initial position for page movement
      dragStartPos.current = { x: event.active.rect.current.initial?.left || 0, y: event.active.rect.current.initial?.top || 0 };
      initialPagePos.current = pagePositions[id] || { x: 0, y: 0 };
    }
  }, [getItemType, pagePositions]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (dragType !== "page" || !activeId || !initialPagePos.current) return;
    
    // Update page position in real-time during drag
    const { delta } = event;
    const scale = zoom / 100;
    
    setPagePositions(prev => ({
      ...prev,
      [activeId]: {
        x: initialPagePos.current!.x + delta.x / scale,
        y: initialPagePos.current!.y + delta.y / scale,
      },
    }));
  }, [dragType, activeId, zoom]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    if (dragType === "page" && activeId && initialPagePos.current) {
      // Finalize page position
      const scale = zoom / 100;
      setPagePositions(prev => ({
        ...prev,
        [activeId]: {
          x: initialPagePos.current!.x + delta.x / scale,
          y: initialPagePos.current!.y + delta.y / scale,
        },
      }));
    } else if (dragType === "section" && over && active.id !== over.id) {
      // Handle section reordering
      setProjectData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev)) as ProjectData;
        const allPages = [newData.sitemap.pages[0], ...(newData.sitemap.pages[0].children || [])];
        
        for (const page of allPages) {
          const oldIndex = page.sections.findIndex(s => s.id === active.id);
          const newIndex = page.sections.findIndex(s => s.id === over.id);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            page.sections = arrayMove(page.sections, oldIndex, newIndex);
            break;
          }
        }
        
        return newData;
      });
    }

    // Reset drag state
    setActiveId(null);
    setDragType(null);
    dragStartPos.current = null;
    initialPagePos.current = null;
  }, [dragType, activeId, zoom]);

  // Find the selected section and page name
  const getSelectedSection = (): { section: ProjectSection; pageName: string } | null => {
    if (!selectedPageId || !selectedSectionId) return null;

    const findInPages = (pages: ProjectPageType[]): { section: ProjectSection; pageName: string } | null => {
      for (const page of pages) {
        if (page.id === selectedPageId) {
          const section = page.sections.find((s) => s.id === selectedSectionId);
          if (section) return { section, pageName: page.name };
        }
        if (page.children) {
          const result = findInPages(page.children);
          if (result) return result;
        }
      }
      return null;
    };

    return findInPages(projectData.sitemap.pages);
  };
  
  const selectedSection = getSelectedSection();

  // Find active drag item for overlay
  const getActiveDragItem = (): { type: "page" | "section"; item: ProjectPageType | ProjectSection } | null => {
    if (!activeId) return null;
    
    const pages = [projectData.sitemap.pages[0], ...(projectData.sitemap.pages[0].children || [])];
    
    const page = pages.find(p => p.id === activeId);
    if (page) return { type: "page", item: page };
    
    for (const p of pages) {
      const section = p.sections.find(s => s.id === activeId);
      if (section) return { type: "section", item: section };
    }
    
    return null;
  };
  
  const activeDragItem = getActiveDragItem();

  // Get all pages with their positions
  const getAllPages = () => {
    const homePage = projectData.sitemap.pages[0];
    if (!homePage) return [];

    const pages: { page: ProjectPageType; x: number; y: number; isHome: boolean }[] = [];
    
    const homePos = pagePositions[homePage.id] || { x: 400, y: 100 };
    pages.push({ page: homePage, x: homePos.x, y: homePos.y, isHome: true });

    if (homePage.children) {
      homePage.children.forEach((child) => {
        const childPos = pagePositions[child.id] || { x: 0, y: 0 };
        pages.push({ page: child, x: childPos.x, y: childPos.y, isHome: false });
      });
    }

    return pages;
  };

  const allPages = getAllPages();

  // Calculate connections based on current positions
  const getConnections = () => {
    const homePage = projectData.sitemap.pages[0];
    if (!homePage?.children) return [];

    const homePos = pagePositions[homePage.id] || { x: 400, y: 100 };
    const homeWidth = 260;
    const homeHeight = 400;
    const childWidth = 220;

    return homePage.children.map((child) => {
      const childPos = pagePositions[child.id] || { x: 0, y: 0 };
      return {
        from: { x: homePos.x + homeWidth / 2, y: homePos.y + homeHeight },
        to: { x: childPos.x + childWidth / 2, y: childPos.y },
      };
    });
  };

  const connections = getConnections();

  // Calculate canvas bounds
  const canvasWidth = Math.max(
    ...allPages.map(p => p.x + 300),
    1400
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <ProjectHeader
        project={projectData}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Canvas */}
        {activeView === "sitemap" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              className={cn(
                "flex-1 bg-[#f5f5f0] overflow-hidden relative",
                isPanning ? "cursor-grabbing" : "cursor-default"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Canvas Content with transform */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                  transformOrigin: "top left",
                  width: `${canvasWidth}px`,
                  height: "1200px",
                }}
              >
                {/* Project Header Card */}
                <div 
                  style={{ 
                    position: "absolute", 
                    left: 0, 
                    top: 0, 
                    width: canvasWidth - 60,
                  }}
                  className="bg-card border border-border rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Project</span>
                    </div>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Sitemap Header Card */}
                <div 
                  style={{ 
                    position: "absolute", 
                    left: 20, 
                    top: 52, 
                    width: canvasWidth - 100,
                  }}
                  className="bg-card border border-border rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{projectData.sitemap.name}</span>
                    </div>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Connection Lines */}
                <SitemapConnections connections={connections} />

                {/* Page Cards */}
                {allPages.map(({ page, x, y, isHome }) => (
                  <div
                    key={page.id}
                    style={{ 
                      position: "absolute", 
                      left: x, 
                      top: y,
                      // Don't apply transform during drag - we update position directly
                      transition: activeId === page.id ? 'none' : 'left 0.2s, top 0.2s',
                    }}
                  >
                    <SortableContext 
                      items={page.sections.map(s => s.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <SortablePageCard
                        page={page}
                        isSelected={selectedPageId === page.id}
                        selectedSectionId={selectedPageId === page.id ? selectedSectionId : undefined}
                        onClick={() => handlePageSelect(page.id)}
                        onSectionClick={(sectionId) => handleSectionSelect(page.id, sectionId)}
                        compact={!isHome}
                        isDraggable={true}
                      />
                    </SortableContext>
                  </div>
                ))}
              </div>
            </div>

            {/* Drag Overlay for sections only (pages move in place) */}
            <DragOverlay
              dropAnimation={dragType === "section" ? {
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.4",
                    },
                  },
                }),
              } as DropAnimation : null}
              zIndex={9999}
            >
              {activeDragItem?.type === "section" && (
                <SortableSectionCard
                  section={activeDragItem.item as ProjectSection}
                  compact={false}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Placeholder for other views */}
        {activeView !== "sitemap" && (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace("-", " ")} View
              </h2>
              <p className="text-muted-foreground">This view is coming soon</p>
            </div>
          </div>
        )}

        {/* Section Detail Panel */}
        {selectedSection && (
          <SectionDetailPanel
            section={selectedSection.section}
            pageName={selectedSection.pageName}
            isOpen={!!selectedSectionId}
            onClose={handleClosePanel}
            position={{ x: 100, y: 300 }}
          />
        )}

        {/* Zoom Controls */}
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToScreen={handleFitToScreen}
        />
      </div>
    </div>
  );
}
