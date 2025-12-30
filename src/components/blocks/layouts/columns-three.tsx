"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory } from "../types";
import { cn } from "@/lib/utils";

const columnContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

const columnsThreePropsSchema = z.object({
  sectionTitle: z.string().optional(),
  sectionSubtitle: z.string().optional(),
  columns: z.array(columnContentSchema).max(3),
  gap: z.enum(["sm", "md", "lg", "xl"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type ColumnsThreeProps = z.infer<typeof columnsThreePropsSchema>;

export function ColumnsThree({
  sectionTitle,
  sectionSubtitle,
  columns,
  gap = "lg",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: ColumnsThreeProps) {
  const gapClasses = {
    sm: "gap-4",
    md: "gap-8",
    lg: "gap-12",
    xl: "gap-16",
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

        {/* Columns */}
        <div className={cn("grid md:grid-cols-3", gapClasses[gap])}>
          {columns.map((column, index) => (
            <div key={index} className="space-y-4 text-center">
              {column.icon && (
                <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">{column.icon}</span>
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground">
                {column.title}
              </h3>
              <p className="text-muted-foreground">
                {column.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const columnsThreeBlock = defineBlock({
  meta: {
    id: "columns-three",
    name: "Three Columns",
    description: "A three-column layout perfect for features or benefits",
    category: BlockCategory.LAYOUT,
    icon: "layout-grid",
    tags: ["layout", "columns", "three-column", "grid", "features"],
  },
  component: ColumnsThree,
  defaultProps: {
    sectionTitle: "Why Choose Us",
    sectionSubtitle: "Discover the benefits that set us apart from the competition.",
    columns: [
      {
        title: "Fast Performance",
        description: "Lightning-fast load times and smooth interactions keep your users engaged.",
        icon: "⚡",
      },
      {
        title: "Easy to Use",
        description: "Intuitive interface that anyone can master in minutes, not hours.",
        icon: "✨",
      },
      {
        title: "Secure & Reliable",
        description: "Enterprise-grade security and 99.9% uptime guarantee for peace of mind.",
        icon: "🔒",
      },
    ],
    gap: "lg",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: columnsThreePropsSchema,
});
