"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory } from "../types";
import { cn } from "@/lib/utils";

const gridItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

const gridFourPropsSchema = z.object({
  sectionTitle: z.string().optional(),
  sectionSubtitle: z.string().optional(),
  items: z.array(gridItemSchema).max(8),
  gap: z.enum(["sm", "md", "lg"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type GridFourProps = z.infer<typeof gridFourPropsSchema>;

export function GridFour({
  sectionTitle,
  sectionSubtitle,
  items,
  gap = "md",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: GridFourProps) {
  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  const paddingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
  };

  return (
    <section className={cn("w-full", paddingClasses[verticalPadding], backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12">
            {sectionTitle && (
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className={cn("grid sm:grid-cols-2 lg:grid-cols-4", gapClasses[gap])}>
          {items.map((item, index) => (
            <div 
              key={index} 
              className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
            >
              {item.icon && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-xl">{item.icon}</span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const gridFourBlock = defineBlock({
  meta: {
    id: "grid-four",
    name: "Four Column Grid",
    description: "A four-column grid layout for showcasing multiple items",
    category: BlockCategory.LAYOUT,
    icon: "grid",
    tags: ["layout", "grid", "four-column", "cards"],
  },
  component: GridFour,
  defaultProps: {
    sectionTitle: "Our Features",
    sectionSubtitle: "Everything you need to build amazing websites.",
    items: [
      {
        title: "Drag & Drop",
        description: "Easily arrange blocks with intuitive drag and drop.",
        icon: "🎯",
      },
      {
        title: "Responsive",
        description: "Looks great on all devices automatically.",
        icon: "📱",
      },
      {
        title: "Customizable",
        description: "Tailor every detail to match your brand.",
        icon: "🎨",
      },
      {
        title: "Fast Export",
        description: "Export clean code in seconds.",
        icon: "🚀",
      },
    ],
    gap: "md",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: gridFourPropsSchema,
});
