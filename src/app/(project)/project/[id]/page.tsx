"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
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

export default function ProjectPage() {
  // Project data state (mutable for reordering)
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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

  // Mouse handlers for panning
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

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    setProjectData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev)) as ProjectData;
      const homePage = newData.sitemap.pages[0];

      // Check if we're reordering child pages
      if (homePage.children) {
        const oldIndex = homePage.children.findIndex(p => p.id === active.id);
        const newIndex = homePage.children.findIndex(p => p.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          homePage.children = arrayMove(homePage.children, oldIndex, newIndex);
          setActiveId(null);
          return newData;
        }
      }

      // Check if we're reordering sections within a page
      const allPages = [homePage, ...(homePage.children || [])];
      for (const page of allPages) {
        const oldIndex = page.sections.findIndex(s => s.id === active.id);
        const newIndex = page.sections.findIndex(s => s.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          page.sections = arrayMove(page.sections, oldIndex, newIndex);
          break;
        }
      }

      setActiveId(null);
      return newData;
    });
  }, []);

  // Find the selected section and page name
  const selectedSection = useMemo((): { section: ProjectSection; pageName: string } | null => {
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
  }, [selectedPageId, selectedSectionId, projectData]);

  // Find active drag item for overlay
  const getActiveDragItem = (): { type: "page" | "section"; item: ProjectPageType | ProjectSection } | null => {
    if (!activeId) return null;
    
    const pages = [projectData.sitemap.pages[0], ...(projectData.sitemap.pages[0].children || [])];
    
    // Check if it's a page
    const page = pages.find(p => p.id === activeId);
    if (page) return { type: "page", item: page };
    
    // Check if it's a section
    for (const p of pages) {
      const section = p.sections.find(s => s.id === activeId);
      if (section) return { type: "section", item: section };
    }
    
    return null;
  };
  
  const activeDragItem = getActiveDragItem();

  // Calculate page positions and connections
  const { allPages, connections, canvasWidth, childPageIds } = useMemo(() => {
    const sitemap = projectData.sitemap;
    const pagesList: { page: ProjectPageType; x: number; y: number; isHome: boolean }[] = [];
    const connectionsList: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    const childIds: string[] = [];

    if (sitemap.pages.length > 0) {
      const homePage = sitemap.pages[0];
      const homeWidth = 260;
      const childWidth = 220;
      const childSpacing = 235;
      const childCount = homePage.children?.length || 0;
      
      // Center home above children
      const totalChildrenWidth = childCount * childSpacing;
      const homeX = childCount > 0 ? (totalChildrenWidth / 2) - (homeWidth / 2) + 40 : 400;
      const homeY = 100;

      pagesList.push({ page: homePage, x: homeX, y: homeY, isHome: true });

      // Position children
      if (homePage.children) {
        homePage.children.forEach((child, index) => {
          const childX = 40 + index * childSpacing;
          const childY = 580;
          
          pagesList.push({ page: child, x: childX, y: childY, isHome: false });
          childIds.push(child.id);
          
          // Add connection
          connectionsList.push({
            from: { x: homeX + homeWidth / 2, y: homeY + 400 },
            to: { x: childX + childWidth / 2, y: childY },
          });
        });
      }
    }

    const width = Math.max(...pagesList.map(p => p.x + 280), 1400);
    return { allPages: pagesList, connections: connectionsList, canvasWidth: width, childPageIds: childIds };
  }, [projectData]);

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
                  height: "1100px",
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

                {/* Page Cards with Sortable Context for child pages */}
                <SortableContext items={childPageIds} strategy={horizontalListSortingStrategy}>
                  {allPages.map(({ page, x, y, isHome }) => (
                    <div
                      key={page.id}
                      style={{ position: "absolute", left: x, top: y }}
                    >
                      <SortablePageCard
                        page={page}
                        isSelected={selectedPageId === page.id}
                        selectedSectionId={selectedPageId === page.id ? selectedSectionId : undefined}
                        onClick={() => handlePageSelect(page.id)}
                        onSectionClick={(sectionId) => handleSectionSelect(page.id, sectionId)}
                        compact={!isHome}
                        isDraggable={!isHome} // Only child pages are draggable
                      />
                    </div>
                  ))}
                </SortableContext>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragItem?.type === "section" && (
                <div className="opacity-90">
                  <SortableSectionCard
                    section={activeDragItem.item as ProjectSection}
                    compact={false}
                  />
                </div>
              )}
              {activeDragItem?.type === "page" && (
                <div className="opacity-90">
                  <SortablePageCard
                    page={activeDragItem.item as ProjectPageType}
                    compact={true}
                    isDraggable={false}
                  />
                </div>
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
