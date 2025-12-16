"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
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

// Calculate positions for pages based on their order
function calculatePagePositions(data: ProjectData): { 
  pages: { page: ProjectPageType; x: number; y: number; isHome: boolean }[];
  connections: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  canvasWidth: number;
} {
  const homePage = data.sitemap.pages[0];
  if (!homePage) return { pages: [], connections: [], canvasWidth: 1400 };

  const pages: { page: ProjectPageType; x: number; y: number; isHome: boolean }[] = [];
  const connections: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];

  const homeWidth = 260;
  const childWidth = 220;
  const childSpacing = 235;
  const childCount = homePage.children?.length || 0;
  
  // Center home above children
  const totalChildrenWidth = childCount > 0 ? (childCount - 1) * childSpacing + childWidth : 0;
  const homeX = childCount > 0 ? (totalChildrenWidth / 2) - (homeWidth / 2) + 40 : 400;
  const homeY = 100;
  
  pages.push({ page: homePage, x: homeX, y: homeY, isHome: true });

  // Position children in a row
  if (homePage.children) {
    homePage.children.forEach((child, index) => {
      const childX = 40 + index * childSpacing;
      const childY = 580;
      
      pages.push({ page: child, x: childX, y: childY, isHome: false });
      
      // Add connection from home to child
      connections.push({
        from: { x: homeX + homeWidth / 2, y: homeY + 400 },
        to: { x: childX + childWidth / 2, y: childY },
      });
    });
  }

  const canvasWidth = Math.max(
    totalChildrenWidth + 120,
    homeX + homeWidth + 100,
    1400
  );

  return { pages, connections, canvasWidth };
}

export default function ProjectPage() {
  // Project data state
  const [projectData, setProjectData] = useState<ProjectData>(initialMockData);
  
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Calculate layout based on current data
  const { pages: allPages, connections, canvasWidth } = calculatePagePositions(projectData);

  // Get IDs for sortable contexts
  const childPageIds = projectData.sitemap.pages[0]?.children?.map(p => p.id) || [];

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
    const homePage = projectData.sitemap.pages[0];
    if (!homePage) return null;
    
    const allPagesList = [homePage, ...(homePage.children || [])];
    
    if (allPagesList.some(p => p.id === id)) return "page";
    
    for (const page of allPagesList) {
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
  }, [getItemType]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setDragType(null);
      return;
    }

    const currentDragType = dragType;

    if (currentDragType === "page") {
      // Reorder child pages
      setProjectData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev)) as ProjectData;
        const homePage = newData.sitemap.pages[0];
        
        if (homePage.children) {
          const oldIndex = homePage.children.findIndex(p => p.id === active.id);
          const newIndex = homePage.children.findIndex(p => p.id === over.id);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            homePage.children = arrayMove(homePage.children, oldIndex, newIndex);
          }
        }
        
        return newData;
      });
    } else if (currentDragType === "section") {
      // Handle section reordering within a page
      setProjectData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev)) as ProjectData;
        const homePage = newData.sitemap.pages[0];
        const allPagesList = [homePage, ...(homePage.children || [])];
        
        for (const page of allPagesList) {
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
  }, [dragType]);

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
    
    const homePage = projectData.sitemap.pages[0];
    if (!homePage) return null;
    
    const pages = [homePage, ...(homePage.children || [])];
    
    const page = pages.find(p => p.id === activeId);
    if (page) return { type: "page", item: page };
    
    for (const p of pages) {
      const section = p.sections.find(s => s.id === activeId);
      if (section) return { type: "section", item: section };
    }
    
    return null;
  };
  
  const activeDragItem = getActiveDragItem();

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

                {/* Child Pages - Sortable horizontally */}
                <SortableContext items={childPageIds} strategy={rectSortingStrategy}>
                  {allPages.map(({ page, x, y, isHome }) => (
                    <div
                      key={page.id}
                      style={{ 
                        position: "absolute", 
                        left: x, 
                        top: y,
                        transition: activeId === page.id ? 'none' : 'left 0.3s ease, top 0.3s ease',
                      }}
                    >
                      {/* Each page has its own sortable context for sections */}
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
                          isDraggable={!isHome} // Only child pages can be reordered
                        />
                      </SortableContext>
                    </div>
                  ))}
                </SortableContext>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.4",
                    },
                  },
                }),
              } as DropAnimation}
              zIndex={9999}
            >
              {activeDragItem?.type === "section" && (
                <SortableSectionCard
                  section={activeDragItem.item as ProjectSection}
                  compact={false}
                  isOverlay
                />
              )}
              {activeDragItem?.type === "page" && (
                <SortablePageCard
                  page={activeDragItem.item as ProjectPageType}
                  compact={true}
                  isDraggable={false}
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
