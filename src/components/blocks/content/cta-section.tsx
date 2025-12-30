"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ctaSectionPropsSchema = z.object({
  headline: z.string(),
  description: z.string(),
  primaryCta: buttonPropsSchema,
  secondaryCta: buttonPropsSchema.optional(),
  layout: z.enum(["centered", "split"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type CtaSectionProps = z.infer<typeof ctaSectionPropsSchema>;

export function CtaSection({
  headline,
  description,
  primaryCta,
  secondaryCta,
  layout = "centered",
  verticalPadding = "lg",
  backgroundColor = "bg-primary",
}: CtaSectionProps) {
  const paddingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
  };

  const isPrimaryBg = backgroundColor.includes("primary");
  const textColorClass = isPrimaryBg ? "text-primary-foreground" : "text-foreground";
  const subtextColorClass = isPrimaryBg ? "text-primary-foreground/80" : "text-muted-foreground";

  if (layout === "split") {
    return (
      <section className={cn("w-full", paddingClasses[verticalPadding], backgroundColor)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                variant={isPrimaryBg ? "secondary" : "default"}
                asChild
              >
                <a href={primaryCta.href}>{primaryCta.label}</a>
              </Button>
              {secondaryCta && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className={isPrimaryBg ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}
                  asChild
                >
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", paddingClasses[verticalPadding], backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              variant={isPrimaryBg ? "secondary" : "default"}
              asChild
            >
              <a href={primaryCta.href}>{primaryCta.label}</a>
            </Button>
            {secondaryCta && (
              <Button 
                size="lg" 
                variant="outline"
                className={isPrimaryBg ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}
                asChild
              >
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            )}
          </div>
        </div>
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
    backgroundColor: "bg-primary",
  },
  propsSchema: ctaSectionPropsSchema,
});
