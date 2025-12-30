import type { BlockDefinition, BlockCategoryType, BlockMeta } from "./types";

// Global block registry
class BlockRegistry {
  private blocks: Map<string, BlockDefinition<Record<string, unknown>>> = new Map();

  register<TProps extends Record<string, unknown>>(block: BlockDefinition<TProps>) {
    if (this.blocks.has(block.meta.id)) {
      console.warn(`Block with id "${block.meta.id}" is already registered. Overwriting.`);
    }
    this.blocks.set(block.meta.id, block as BlockDefinition<Record<string, unknown>>);
  }

  get(id: string): BlockDefinition<Record<string, unknown>> | undefined {
    return this.blocks.get(id);
  }

  getAll(): BlockDefinition<Record<string, unknown>>[] {
    return Array.from(this.blocks.values());
  }

  getByCategory(category: BlockCategoryType): BlockDefinition<Record<string, unknown>>[] {
    return this.getAll().filter((block) => block.meta.category === category);
  }

  getAllCategories(): BlockCategoryType[] {
    const categories = new Set<BlockCategoryType>();
    this.getAll().forEach((block) => categories.add(block.meta.category));
    return Array.from(categories);
  }

  getMetaList(): BlockMeta[] {
    return this.getAll().map((block) => block.meta);
  }

  has(id: string): boolean {
    return this.blocks.has(id);
  }

  clear() {
    this.blocks.clear();
  }
}

// Singleton instance
export const blockRegistry = new BlockRegistry();

// Helper function to create and register a block
export function defineBlock<TProps extends Record<string, unknown>>(
  definition: BlockDefinition<TProps>
): BlockDefinition<TProps> {
  blockRegistry.register(definition);
  return definition;
}
