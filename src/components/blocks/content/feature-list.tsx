"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, imagePropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const featureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const featureListPropsSchema = z.object({
  sectionTitle: z.string(),
  sectionSubtitle: z.string().optional(),
  features: z.array(featureItemSchema),
  image: imagePropsSchema.optional(),
  imagePosition: z.enum(["left", "right"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type FeatureListProps = z.infer<typeof featureListPropsSchema>;

export function FeatureList({
  sectionTitle,
  sectionSubtitle,
  features,
  image,
  imagePosition = "right",
  verticalPadding = "lg",
  backgroundColor = "bg-background",
}: FeatureListProps) {
  const paddingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          {sectionTitle}
        </h2>
        {sectionSubtitle && (
          <p className="text-lg text-muted-foreground">
            {sectionSubtitle}
          </p>
        )}
      </div>
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const imageElement = image && (
    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );

  return (
    <section className={cn("w-full", paddingClasses[verticalPadding], backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {image ? (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {imagePosition === "left" ? (
              <>
                {imageElement}
                {content}
              </>
            ) : (
              <>
                {content}
                {imageElement}
              </>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {content}
          </div>
        )}
      </div>
    </section>
  );
}

export const featureListBlock = defineBlock({
  meta: {
    id: "feature-list",
    name: "Feature List",
    description: "A list of features with checkmarks and optional image",
    category: BlockCategory.FEATURES,
    icon: "list-checks",
    tags: ["features", "list", "benefits", "checkmarks"],
  },
  component: FeatureList,
  defaultProps: {
    sectionTitle: "Everything you need to succeed",
    sectionSubtitle: "Our platform comes packed with features designed to help you grow.",
    features: [
      {
        title: "Real-time collaboration",
        description: "Work together with your team in real-time, with changes synced instantly.",
      },
      {
        title: "Advanced analytics",
        description: "Get deep insights into your performance with comprehensive analytics.",
      },
      {
        title: "Automated workflows",
        description: "Save time with powerful automation tools that handle repetitive tasks.",
      },
      {
        title: "24/7 support",
        description: "Our support team is always available to help you succeed.",
      },
    ],
    image: {
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
      alt: "Team collaboration",
    },
    imagePosition: "right",
    verticalPadding: "lg",
    backgroundColor: "bg-background",
  },
  propsSchema: featureListPropsSchema,
});
