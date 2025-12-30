"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema, imagePropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const heroSplitPropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: buttonPropsSchema.optional(),
  secondaryCta: buttonPropsSchema.optional(),
  image: imagePropsSchema,
  imagePosition: z.enum(["left", "right"]).optional(),
  backgroundColor: z.string().optional(),
});

export type HeroSplitProps = z.infer<typeof heroSplitPropsSchema>;

export function HeroSplit({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  image,
  imagePosition = "right",
  backgroundColor = "bg-background",
}: HeroSplitProps) {
  return (
    <section className={cn("w-full py-16 md:py-24", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "grid md:grid-cols-2 gap-12 items-center",
          imagePosition === "left" && "md:grid-flow-dense"
        )}>
          {/* Content */}
          <div className={cn(
            "flex flex-col gap-6",
            imagePosition === "left" && "md:col-start-2"
          )}>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {headline}
            </h1>
            <p className="text-lg text-muted-foreground">
              {subheadline}
            </p>
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-wrap gap-4 mt-2">
                {primaryCta && (
                  <Button size="lg" asChild>
                    <a href={primaryCta.href}>{primaryCta.label}</a>
                  </Button>
                )}
                {secondaryCta && (
                  <Button size="lg" variant="outline" asChild>
                    <a href={secondaryCta.href}>{secondaryCta.label}</a>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          <div className={cn(
            "relative aspect-[4/3] rounded-lg overflow-hidden bg-muted",
            imagePosition === "left" && "md:col-start-1"
          )}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export const heroSplitBlock = defineBlock({
  meta: {
    id: "hero-split",
    name: "Split Hero",
    description: "A two-column hero with content on one side and image on the other",
    category: BlockCategory.HERO,
    icon: "columns",
    tags: ["hero", "header", "split", "image", "two-column"],
  },
  component: HeroSplit,
  defaultProps: {
    headline: "Transform your workflow",
    subheadline: "Streamline your processes and boost productivity with our powerful platform. Start building today.",
    primaryCta: {
      label: "Start Free Trial",
      href: "/trial",
      variant: "primary",
    },
    secondaryCta: {
      label: "Watch Demo",
      href: "/demo",
      variant: "outline",
    },
    image: {
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
      alt: "Team collaboration",
    },
    imagePosition: "right",
    backgroundColor: "bg-background",
  },
  propsSchema: heroSplitPropsSchema,
});
