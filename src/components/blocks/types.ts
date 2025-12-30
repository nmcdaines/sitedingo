import { z } from "zod";

// Block categories for organization
export const BlockCategory = {
  NAVIGATION: "navigation",
  HERO: "hero",
  CONTENT: "content",
  FEATURES: "features",
  CTA: "cta",
  LAYOUT: "layout",
  FOOTER: "footer",
} as const;

export type BlockCategoryType = (typeof BlockCategory)[keyof typeof BlockCategory];

// Base block metadata schema
export const blockMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    "navigation",
    "hero",
    "content",
    "features",
    "cta",
    "layout",
    "footer",
  ]),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type BlockMeta = z.infer<typeof blockMetaSchema>;

// Block instance in a page
export interface BlockInstance {
  instanceId: string;
  blockId: string;
  props: Record<string, unknown>;
}

// Block definition with component and default props
export interface BlockDefinition<TProps extends Record<string, unknown> = Record<string, unknown>> {
  meta: BlockMeta;
  component: React.ComponentType<TProps>;
  defaultProps: TProps;
  propsSchema: z.ZodType<TProps>;
}

// Page structure
export interface PageDefinition {
  id: string;
  name: string;
  slug: string;
  blocks: BlockInstance[];
}

// Block prop types for common patterns
export interface LinkProps {
  label: string;
  href: string;
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ButtonProps {
  label: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

// Common prop schemas
export const linkPropsSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const imagePropsSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const buttonPropsSchema = z.object({
  label: z.string(),
  href: z.string().optional(),
  variant: z.enum(["primary", "secondary", "outline", "ghost"]).optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
});

// Block render context for accessing builder state
export interface BlockRenderContext {
  isEditing: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}

// Export a type helper for creating block definitions
export type CreateBlockDefinition<TProps extends Record<string, unknown>> = {
  meta: BlockMeta;
  component: React.ComponentType<TProps>;
  defaultProps: TProps;
  propsSchema: z.ZodType<TProps>;
};
