"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema } from "../types";
import { backgroundConfigSchema, getBackgroundStyles } from "../background-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ctaSectionPropsSchema = z.object({
  headline: z.string(),
  description: z.string(),
  primaryCta: buttonPropsSchema,
  secondaryCta: buttonPropsSchema.optional(),
  layout: z.enum(["centered", "split"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  background: backgroundConfigSchema,
});

export type CtaSectionProps = z.infer<typeof ctaSectionPropsSchema>;

export function CtaSection({
  headline,
  description,
  primaryCta,
  secondaryCta,
  layout = "centered",
  verticalPadding = "lg",
  background,
}: CtaSectionProps) {
  const paddingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
  };

  const bgStyles = getBackgroundStyles(background);
  const hasImageBg = background.type === "image";
  const hasOverlay = background.type === "image" && background.overlay;

  // Determine if we have a dark background
  const isDarkBg = 
    hasImageBg ||
    (background.type === "color" && (
      background.value === "#000000" ||
      background.value === "#18181b" ||
      background.value === "#27272a" ||
      background.value === "var(--primary)"
    ));

  const textColorClass = isDarkBg ? "text-white" : "text-foreground";
  const subtextColorClass = isDarkBg ? "text-white/80" : "text-muted-foreground";

  const content = layout === "split" ? (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="space-y-2">
        <h2 className={cn("text-2xl md:text-3xl font-bold", textColorClass)}>
          {headline}
        </h2>
        <p className={cn("text-lg", subtextColorClass)}>
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button 
          size="lg" 
          variant={isDarkBg ? "secondary" : "default"}
          asChild
        >
          <a href={primaryCta.href}>{primaryCta.label}</a>
        </Button>
        {secondaryCta && (
          <Button 
            size="lg" 
            variant="outline"
            className={isDarkBg ? "border-white/30 text-white hover:bg-white/10" : ""}
            asChild
          >
            <a href={secondaryCta.href}>{secondaryCta.label}</a>
          </Button>
        )}
      </div>
    </div>
  ) : (
    <div className="max-w-3xl mx-auto text-center space-y-6">
      <h2 className={cn("text-3xl md:text-4xl font-bold", textColorClass)}>
        {headline}
      </h2>
      <p className={cn("text-lg", subtextColorClass)}>
        {description}
      </p>
      <div className="flex flex-wrap justify-center gap-4 pt-2">
        <Button 
          size="lg" 
          variant={isDarkBg ? "secondary" : "default"}
          asChild
        >
          <a href={primaryCta.href}>{primaryCta.label}</a>
        </Button>
        {secondaryCta && (
          <Button 
            size="lg" 
            variant="outline"
            className={isDarkBg ? "border-white/30 text-white hover:bg-white/10" : ""}
            asChild
          >
            <a href={secondaryCta.href}>{secondaryCta.label}</a>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <section 
      className={cn("relative w-full", paddingClasses[verticalPadding])} 
      style={hasImageBg ? {} : bgStyles}
    >
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
        {content}
      </div>
    </section>
  );
}

export const ctaSectionBlock = defineBlock({
  meta: {
    id: "cta-section",
    name: "Call to Action",
    description: "A prominent call-to-action section to drive conversions",
    category: BlockCategory.CTA,
    icon: "megaphone",
    tags: ["cta", "call-to-action", "conversion", "button"],
  },
  component: CtaSection,
  defaultProps: {
    headline: "Ready to get started?",
    description: "Join thousands of satisfied customers using our platform to grow their business.",
    primaryCta: {
      label: "Start Free Trial",
      href: "/signup",
      variant: "primary",
    },
    secondaryCta: {
      label: "Contact Sales",
      href: "/contact",
      variant: "outline",
    },
    layout: "centered",
    verticalPadding: "lg",
    background: {
      type: "color",
      value: "var(--primary)",
      opacity: 100,
    },
  },
  propsSchema: ctaSectionPropsSchema,
});
