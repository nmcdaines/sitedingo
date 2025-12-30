"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory } from "../types";
import { cn } from "@/lib/utils";

const statItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const statsSectionPropsSchema = z.object({
  sectionTitle: z.string().optional(),
  sectionSubtitle: z.string().optional(),
  stats: z.array(statItemSchema),
  layout: z.enum(["row", "grid"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type StatsSectionProps = z.infer<typeof statsSectionPropsSchema>;

export function StatsSection({
  sectionTitle,
  sectionSubtitle,
  stats,
  layout = "row",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: StatsSectionProps) {
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

        {/* Stats */}
        <div className={cn(
          layout === "row" 
            ? "flex flex-wrap justify-center divide-y md:divide-y-0 md:divide-x divide-border"
            : "grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        )}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={cn(
                "text-center",
                layout === "row" ? "px-8 py-6 md:py-0 first:pt-0 last:pb-0" : "p-6"
              )}
            >
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {stat.label}
              </p>
              {stat.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const statsSectionBlock = defineBlock({
  meta: {
    id: "stats-section",
    name: "Stats Section",
    description: "Display impressive numbers and statistics",
    category: BlockCategory.CONTENT,
    icon: "bar-chart",
    tags: ["stats", "numbers", "metrics", "data"],
  },
  component: StatsSection,
  defaultProps: {
    sectionTitle: "Trusted by thousands",
    sectionSubtitle: "Our platform powers businesses of all sizes around the world.",
    stats: [
      {
        value: "10K+",
        label: "Active Users",
        description: "Growing daily",
      },
      {
        value: "99.9%",
        label: "Uptime",
        description: "Enterprise reliability",
      },
      {
        value: "50M+",
        label: "Requests/Day",
        description: "Blazing fast",
      },
      {
        value: "24/7",
        label: "Support",
        description: "Always available",
      },
    ],
    layout: "row",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: statsSectionPropsSchema,
});
