"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory } from "../types";
import { cn } from "@/lib/utils";

const sectionContainerPropsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  maxWidth: z.enum(["sm", "md", "lg", "xl", "full"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type SectionContainerProps = z.infer<typeof sectionContainerPropsSchema>;

export function SectionContainer({
  title,
  subtitle,
  content,
  textAlign = "center",
  maxWidth = "lg",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: SectionContainerProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  const maxWidthClasses = {
    sm: "max-w-xl",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
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
        <div className={cn(maxWidthClasses[maxWidth], alignClasses[textAlign])}>
          {title && (
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground mb-6">
              {subtitle}
            </p>
          )}
          <div className="text-muted-foreground prose prose-neutral max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const sectionContainerBlock = defineBlock({
  meta: {
    id: "section-container",
    name: "Section Container",
    description: "A flexible container for text content with configurable width and alignment",
    category: BlockCategory.LAYOUT,
    icon: "square",
    tags: ["layout", "container", "section", "text"],
  },
  component: SectionContainer,
  defaultProps: {
    title: "About Our Company",
    subtitle: "Learn more about who we are and what we do.",
    content: "We are a team of passionate individuals dedicated to building tools that help people create beautiful websites. Our mission is to democratize web design by making it accessible to everyone, regardless of technical skill.\n\nWith years of experience in the industry, we understand the challenges that businesses face when trying to establish their online presence. That's why we've built a solution that combines powerful features with an intuitive interface.",
    textAlign: "center",
    maxWidth: "lg",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: sectionContainerPropsSchema,
});
