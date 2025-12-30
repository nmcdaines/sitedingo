"use client";

import { useState, useMemo } from "react";
import { blockRegistry } from "@/components/blocks/registry";
import { BlockCategory, type BlockCategoryType } from "@/components/blocks/types";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  Search, 
  Layers,
  Navigation,
  Sparkles,
  Layout,
  Type,
  Zap,
  Megaphone,
  PanelBottom
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
  [BlockCategory.HERO]: "Hero Sections",
  [BlockCategory.CONTENT]: "Content",
  [BlockCategory.FEATURES]: "Features",
  [BlockCategory.CTA]: "Call to Action",
  [BlockCategory.LAYOUT]: "Layout",
  [BlockCategory.FOOTER]: "Footers",
};

export default function BlocksPage() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.values(BlockCategory))
  );

  const blocks = useMemo(() => blockRegistry.getAll(), []);
  const categories = useMemo(() => blockRegistry.getAllCategories(), []);

  const filteredBlocks = useMemo(() => {
    if (!searchQuery) return blocks;
    const query = searchQuery.toLowerCase();
    return blocks.filter(
      (block) =>
        block.meta.name.toLowerCase().includes(query) ||
        block.meta.description.toLowerCase().includes(query) ||
        block.meta.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [blocks, searchQuery]);

  const blocksByCategory = useMemo(() => {
    const grouped: Record<string, typeof blocks> = {};
    for (const block of filteredBlocks) {
      if (!grouped[block.meta.category]) {
        grouped[block.meta.category] = [];
      }
      grouped[block.meta.category].push(block);
    }
    return grouped;
  }, [filteredBlocks]);

  const selectedBlock = useMemo(
    () => (selectedBlockId ? blockRegistry.get(selectedBlockId) : null),
    [selectedBlockId]
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-lg">Block Library</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {categories.map((category) => {
            const categoryBlocks = blocksByCategory[category] || [];
            if (categoryBlocks.length === 0) return null;

            return (
              <div key={category} className="mb-1">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedCategories.has(category) && "rotate-90"
                    )}
                  />
                  {categoryIcons[category as BlockCategoryType]}
                  <span className="font-medium text-sm">
                    {categoryLabels[category as BlockCategoryType]}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {categoryBlocks.length}
                  </span>
                </button>

                {expandedCategories.has(category) && (
                  <div className="ml-4 pl-4 border-l border-border">
                    {categoryBlocks.map((block) => (
                      <button
                        key={block.meta.id}
                        onClick={() => setSelectedBlockId(block.meta.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          selectedBlockId === block.meta.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {block.meta.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {blocks.length} blocks available
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedBlock ? (
          <>
            {/* Block Header */}
            <header className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {categoryIcons[selectedBlock.meta.category as BlockCategoryType]}
                <span>{categoryLabels[selectedBlock.meta.category as BlockCategoryType]}</span>
              </div>
              <h2 className="text-2xl font-bold">{selectedBlock.meta.name}</h2>
              <p className="text-muted-foreground mt-1">
                {selectedBlock.meta.description}
              </p>
              {selectedBlock.meta.tags && (
                <div className="flex gap-2 mt-3">
                  {selectedBlock.meta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Block Preview */}
            <div className="flex-1 overflow-auto bg-muted/30">
              <div className="p-8">
                <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
                  <selectedBlock.component {...selectedBlock.defaultProps} />
                </div>
              </div>
            </div>

            {/* Props Panel */}
            <div className="border-t border-border bg-card p-4 max-h-64 overflow-auto">
              <h3 className="font-semibold mb-3">Default Props</h3>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(selectedBlock.defaultProps, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground">
                Select a block
              </h2>
              <p className="text-muted-foreground mt-1">
                Choose a block from the sidebar to preview it
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
