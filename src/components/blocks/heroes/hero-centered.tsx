"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema } from "../types";
import { backgroundConfigSchema, getBackgroundStyles } from "../background-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const heroCenteredPropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: buttonPropsSchema.optional(),
  secondaryCta: buttonPropsSchema.optional(),
  background: backgroundConfigSchema,
  textAlignment: z.enum(["left", "center", "right"]).optional(),
});

export type HeroCenteredProps = z.infer<typeof heroCenteredPropsSchema>;

export function HeroCentered({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  background,
  textAlignment = "center",
}: HeroCenteredProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  const bgStyles = getBackgroundStyles(background);
  const hasImageBg = background.type === "image";
  const hasOverlay = background.type === "image" && background.overlay;

  // Determine text color based on background
  const isDarkBg = 
    hasImageBg || 
    (background.type === "color" && (
      background.value === "#000000" ||
      background.value === "#18181b" ||
      background.value === "#27272a" ||
      background.value.includes("--primary")
    ));

  return (
    <section className="relative w-full py-20 md:py-32" style={hasImageBg ? {} : bgStyles}>
      {/* Background for images */}
      {hasImageBg && (
        <>
          <div className="absolute inset-0" style={bgStyles} />
          {hasOverlay && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: background.overlay!.color,
                opacity: background.overlay!.opacity / 100,
              }}
            />
          )}
        </>
      )}

      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", hasImageBg && "relative z-10")}>
        <div className={cn("flex flex-col gap-6 max-w-3xl mx-auto", alignmentClasses[textAlignment])}>
          <h1 className={cn(
            "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
            isDarkBg ? "text-white" : "text-foreground"
          )}>
            {headline}
          </h1>
          <p className={cn(
            "text-lg md:text-xl max-w-2xl",
            isDarkBg ? "text-white/80" : "text-muted-foreground"
          )}>
            {subheadline}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap gap-4 mt-4">
              {primaryCta && (
                <Button 
                  size="lg" 
                  variant={isDarkBg ? "secondary" : "default"}
                  asChild
                >
                  <a href={primaryCta.href}>{primaryCta.label}</a>
                </Button>
              )}
              {secondaryCta && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={isDarkBg ? "border-white text-white hover:bg-white/10" : ""}
                  asChild
                >
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
    background: {
      type: "color",
      value: "#ffffff",
      opacity: 100,
    },
    textAlignment: "center",
  },
  propsSchema: heroCenteredPropsSchema,
});
