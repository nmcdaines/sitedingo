"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const heroCenteredPropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: buttonPropsSchema.optional(),
  secondaryCta: buttonPropsSchema.optional(),
  backgroundColor: z.string().optional(),
  textAlignment: z.enum(["left", "center", "right"]).optional(),
});

export type HeroCenteredProps = z.infer<typeof heroCenteredPropsSchema>;

export function HeroCentered({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  backgroundColor = "bg-background",
  textAlignment = "center",
}: HeroCenteredProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <section className={cn("w-full py-20 md:py-32", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn("flex flex-col gap-6 max-w-3xl mx-auto", alignmentClasses[textAlignment])}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            {headline}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            {subheadline}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap gap-4 mt-4">
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
      </div>
    </section>
  );
}

export const heroCenteredBlock = defineBlock({
  meta: {
    id: "hero-centered",
    name: "Centered Hero",
    description: "A centered hero section with headline, subheadline, and CTAs",
    category: BlockCategory.HERO,
    icon: "layout-template",
    tags: ["hero", "header", "centered", "headline"],
  },
  component: HeroCentered,
  defaultProps: {
    headline: "Build something amazing",
    subheadline: "Create beautiful, responsive websites with our intuitive block-based builder. No coding required.",
    primaryCta: {
      label: "Get Started",
      href: "/signup",
      variant: "primary",
    },
    secondaryCta: {
      label: "Learn More",
      href: "/features",
      variant: "outline",
    },
    backgroundColor: "bg-background",
    textAlignment: "center",
  },
  propsSchema: heroCenteredPropsSchema,
});
