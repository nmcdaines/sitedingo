"use client";

import { useState, useMemo, useCallback } from "react";
import { blockRegistry } from "@/components/blocks/registry";
import { BlockRenderer, PageRenderer } from "@/components/blocks/block-renderer";
import { 
  BlockCategory, 
  type BlockCategoryType, 
  type BlockInstance 
} from "@/components/blocks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Eye,
  Settings,
  Layers,
  GripVertical,
  X,
  Navigation,
  Sparkles,
  Layout,
  Type,
  Zap,
  Megaphone,
  PanelBottom,
  Monitor,
  Tablet,
  Smartphone,
  Code,
} from "lucide-react";

// Import all blocks to register them
import "@/components/blocks";

const categoryIcons: Record<BlockCategoryType, React.ReactNode> = {
  [BlockCategory.NAVIGATION]: <Navigation className="w-4 h-4" />,
  [BlockCategory.HERO]: <Sparkles className="w-4 h-4" />,
  [BlockCategory.CONTENT]: <Type className="w-4 h-4" />,
  [BlockCategory.FEATURES]: <Zap className="w-4 h-4" />,
  [BlockCategory.CTA]: <Megaphone className="w-4 h-4" />,
  [BlockCategory.LAYOUT]: <Layout className="w-4 h-4" />,
  [BlockCategory.FOOTER]: <PanelBottom className="w-4 h-4" />,
};

const categoryLabels: Record<BlockCategoryType, string> = {
  [BlockCategory.NAVIGATION]: "Navigation",
  [BlockCategory.HERO]: "Hero",
  [BlockCategory.CONTENT]: "Content",
  [BlockCategory.FEATURES]: "Features",
  [BlockCategory.CTA]: "CTA",
  [BlockCategory.LAYOUT]: "Layout",
  [BlockCategory.FOOTER]: "Footer",
};

type ViewMode = "desktop" | "tablet" | "mobile";
type SidebarTab = "blocks" | "settings";

export default function BuilderPage() {
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [isPreview, setIsPreview] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("blocks");
  const [selectedCategory, setSelectedCategory] = useState<BlockCategoryType | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allBlocks = useMemo(() => blockRegistry.getAll(), []);
  const categories = useMemo(() => blockRegistry.getAllCategories(), []);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.instanceId === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const selectedBlockDefinition = useMemo(
    () => (selectedBlock ? blockRegistry.get(selectedBlock.blockId) : null),
    [selectedBlock]
  );

  const activeBlock = useMemo(
    () => blocks.find((b) => b.instanceId === activeId) || null,
    [blocks, activeId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addBlock = useCallback((blockId: string) => {
    const definition = blockRegistry.get(blockId);
    if (!definition) return;

    const newBlock: BlockInstance = {
      instanceId: generateId(),
      blockId,
      props: { ...definition.defaultProps },
    };

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.instanceId);
    setSidebarTab("settings");
  }, []);

  const removeBlock = useCallback((instanceId: string) => {
    setBlocks((prev) => prev.filter((b) => b.instanceId !== instanceId));
    if (selectedBlockId === instanceId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const duplicateBlock = useCallback((instanceId: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.instanceId === instanceId);
      if (index === -1) return prev;
      const block = prev[index];
      const newBlock: BlockInstance = {
        instanceId: generateId(),
        blockId: block.blockId,
        props: JSON.parse(JSON.stringify(block.props)),
      };
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

  const updateBlockProp = useCallback((instanceId: string, propPath: string, value: unknown) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.instanceId !== instanceId) return b;
        
        const pathParts = propPath.split(".");
        const newProps = JSON.parse(JSON.stringify(b.props));
        let current: Record<string, unknown> = newProps;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (!(key in current)) {
            current[key] = {};
          }
          current = current[key] as Record<string, unknown>;
        }
        
        current[pathParts[pathParts.length - 1]] = value;
        return { ...b, props: newProps };
      })
    );
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.instanceId === active.id);
        const newIndex = prev.findIndex((b) => b.instanceId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const viewWidths: Record<ViewMode, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Left Sidebar */}
      <aside className="w-72 border-r border-border bg-background flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setSidebarTab("blocks")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              sidebarTab === "blocks"
                ? "bg-muted text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Blocks
          </button>
          <button
            onClick={() => setSidebarTab("settings")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              sidebarTab === "settings"
                ? "bg-muted text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {sidebarTab === "blocks" ? (
            <div className="p-4">
              {/* Category Grid */}
              {!selectedCategory ? (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {categoryIcons[category]}
                      <span className="text-xs font-medium">
                        {categoryLabels[category]}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    <X className="w-4 h-4" />
                    Back to categories
                  </button>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {categoryIcons[selectedCategory]}
                    {categoryLabels[selectedCategory]}
                  </h3>
                  <div className="space-y-2">
                    {allBlocks
                      .filter((b) => b.meta.category === selectedCategory)
                      .map((block) => (
                        <button
                          key={block.meta.id}
                          onClick={() => addBlock(block.meta.id)}
                          className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{block.meta.name}</span>
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {block.meta.description}
                          </p>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-4">
              {selectedBlock && selectedBlockDefinition ? (
                <BlockPropsEditor
                  block={selectedBlock}
                  definition={selectedBlockDefinition}
                  onUpdate={(propPath, value) =>
                    updateBlockProp(selectedBlock.instanceId, propPath, value)
                  }
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a block to edit its settings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Page Builder</span>
            <span className="text-sm text-muted-foreground">
              ({blocks.length} blocks)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setViewMode("desktop")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "desktop" ? "bg-muted" : "hover:bg-muted/50"
                )}
                title="Desktop view"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("tablet")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "tablet" ? "bg-muted" : "hover:bg-muted/50"
                )}
                title="Tablet view"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "mobile" ? "bg-muted" : "hover:bg-muted/50"
                )}
                title="Mobile view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-border" />

            <Button
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? "Exit Preview" : "Preview"}
            </Button>

            <Button variant="outline" size="sm">
              <Code className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div
            className={cn(
              "bg-background shadow-lg transition-all duration-300",
              viewMode !== "desktop" && "border border-border rounded-lg"
            )}
            style={{ width: viewWidths[viewMode], minHeight: "100%" }}
          >
            {blocks.length === 0 ? (
              <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-border rounded-lg m-4">
                <div className="text-center">
                  <Plus className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    Start building your page
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add blocks from the sidebar to get started
                  </p>
                </div>
              </div>
            ) : isPreview ? (
              <PageRenderer blocks={blocks} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.instanceId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border">
                    {blocks.map((block) => (
                      <SortableBlockItem
                        key={block.instanceId}
                        block={block}
                        isSelected={selectedBlockId === block.instanceId}
                        onSelect={() => {
                          setSelectedBlockId(block.instanceId);
                          setSidebarTab("settings");
                        }}
                        onRemove={() => removeBlock(block.instanceId)}
                        onDuplicate={() => duplicateBlock(block.instanceId)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeBlock && (
                    <div className="opacity-80 shadow-xl">
                      <BlockRenderer block={activeBlock} />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sortable Block Item Component
interface SortableBlockItemProps {
  block: BlockInstance;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockName = blockRegistry.get(block.blockId)?.meta.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-inset"
      )}
    >
      {/* Block Controls */}
      <div
        className={cn(
          "absolute top-2 right-2 z-10 flex items-center gap-1 bg-background border border-border rounded-md shadow-sm",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 hover:bg-muted cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={onDuplicate}
          className="p-1.5 hover:bg-muted"
          title="Duplicate block"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onSelect}
          className="p-1.5 hover:bg-muted"
          title="Edit settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-destructive/10 text-destructive"
          title="Remove block"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Block Label */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}
      >
        {blockName}
      </div>

      {/* Block Content */}
      <div onClick={onSelect} className="cursor-pointer">
        <BlockRenderer
          block={block}
          context={{
            isEditing: true,
            isSelected,
          }}
        />
      </div>
    </div>
  );
}

// Props Editor Component
function BlockPropsEditor({
  block,
  definition,
  onUpdate,
}: {
  block: BlockInstance;
  definition: ReturnType<typeof blockRegistry.get>;
  onUpdate: (propPath: string, value: unknown) => void;
}) {
  if (!definition) return null;

  const renderPropEditor = (
    value: unknown,
    propPath: string,
    depth: number = 0
  ): React.ReactNode => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      // Check if it's a long text
      if (value.length > 100 || value.includes("\n")) {
        return (
          <Textarea
            value={value}
            onChange={(e) => onUpdate(propPath, e.target.value)}
            className="text-sm"
            rows={3}
          />
        );
      }
      return (
        <Input
          value={value}
          onChange={(e) => onUpdate(propPath, e.target.value)}
          className="text-sm"
        />
      );
    }

    if (typeof value === "number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onUpdate(propPath, parseFloat(e.target.value) || 0)}
          className="text-sm"
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <button
          onClick={() => onUpdate(propPath, !value)}
          className={cn(
            "w-10 h-6 rounded-full transition-colors",
            value ? "bg-primary" : "bg-muted"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded-full bg-white shadow transition-transform mx-1",
              value && "translate-x-4"
            )}
          />
        </button>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2 pl-4 border-l border-border">
          {value.map((item, index) => (
            <div key={index} className="space-y-2">
              <span className="text-xs text-muted-foreground">Item {index + 1}</span>
              {renderPropEditor(item, `${propPath}.${index}`, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="space-y-3 pl-4 border-l border-border">
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground capitalize mb-1 block">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              {renderPropEditor(val, `${propPath}.${key}`, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <span className="text-sm text-muted-foreground">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{definition.meta.name}</h3>
      <div className="space-y-4">
        {Object.entries(block.props).map(([key, value]) => (
          <div key={key}>
            <label className="text-sm font-medium capitalize mb-2 block">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </label>
            {renderPropEditor(value, key)}
          </div>
        ))}
      </div>
    </div>
  );
}
