"use client";

import { useMemo } from "react";
import { blockRegistry } from "./registry";
import type { BlockInstance, BlockRenderContext } from "./types";
import { cn } from "@/lib/utils";

interface BlockRendererProps {
  block: BlockInstance;
  context?: Partial<BlockRenderContext>;
  className?: string;
}

export function BlockRenderer({ block, context, className }: BlockRendererProps) {
  const definition = useMemo(() => blockRegistry.get(block.blockId), [block.blockId]);

  if (!definition) {
    return (
      <div className="p-4 border border-dashed border-destructive bg-destructive/10 rounded-md">
        <p className="text-destructive text-sm">
          Block not found: <code>{block.blockId}</code>
        </p>
      </div>
    );
  }

  const Component = definition.component;
  const mergedProps = { ...definition.defaultProps, ...block.props };

  const renderContext: BlockRenderContext = {
    isEditing: context?.isEditing ?? false,
    isSelected: context?.isSelected ?? false,
    onSelect: context?.onSelect,
  };

  return (
    <div
      className={cn(
        "block-wrapper relative",
        renderContext.isEditing && "hover:outline hover:outline-2 hover:outline-primary/50",
        renderContext.isSelected && "outline outline-2 outline-primary",
        className
      )}
      onClick={(e) => {
        if (renderContext.isEditing && renderContext.onSelect) {
          e.stopPropagation();
          renderContext.onSelect();
        }
      }}
    >
      <Component {...mergedProps} />
    </div>
  );
}

interface PageRendererProps {
  blocks: BlockInstance[];
  context?: Partial<BlockRenderContext>;
  selectedBlockId?: string | null;
  onSelectBlock?: (instanceId: string) => void;
}

export function PageRenderer({
  blocks,
  context,
  selectedBlockId,
  onSelectBlock,
}: PageRendererProps) {
  return (
    <div className="page-renderer w-full">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.instanceId}
          block={block}
          context={{
            ...context,
            isSelected: selectedBlockId === block.instanceId,
            onSelect: () => onSelectBlock?.(block.instanceId),
          }}
        />
      ))}
    </div>
  );
}
