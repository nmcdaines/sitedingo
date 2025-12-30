"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory } from "../types";
import { cn } from "@/lib/utils";

const columnsTwoPropsSchema = z.object({
  leftContent: z.object({
    title: z.string(),
    description: z.string(),
  }),
  rightContent: z.object({
    title: z.string(),
    description: z.string(),
  }),
  gap: z.enum(["sm", "md", "lg", "xl"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type ColumnsTwoProps = z.infer<typeof columnsTwoPropsSchema>;

export function ColumnsTwo({
  leftContent,
  rightContent,
  gap = "lg",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: ColumnsTwoProps) {
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
        <div className={cn("grid md:grid-cols-2", gapClasses[gap])}>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">
              {leftContent.title}
            </h3>
            <p className="text-muted-foreground">
              {leftContent.description}
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">
              {rightContent.title}
            </h3>
            <p className="text-muted-foreground">
              {rightContent.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export const columnsTwoBlock = defineBlock({
  meta: {
    id: "columns-two",
    name: "Two Columns",
    description: "A simple two-column layout with title and description",
    category: BlockCategory.LAYOUT,
    icon: "columns",
    tags: ["layout", "columns", "two-column", "grid"],
  },
  component: ColumnsTwo,
  defaultProps: {
    leftContent: {
      title: "First Column",
      description: "Add your content here. This column takes up half of the available width on larger screens.",
    },
    rightContent: {
      title: "Second Column",
      description: "Add your content here. This column takes up the other half of the available width.",
    },
    gap: "lg",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: columnsTwoPropsSchema,
});
