"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, buttonPropsSchema } from "../types";
import { backgroundImageSchema, getBackgroundStyles } from "../background-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const heroWithImagePropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: buttonPropsSchema.optional(),
  secondaryCta: buttonPropsSchema.optional(),
  background: backgroundImageSchema,
  textColor: z.enum(["light", "dark"]).optional(),
});

export type HeroWithImageProps = z.infer<typeof heroWithImagePropsSchema>;

export function HeroWithImage({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  background,
  textColor = "light",
}: HeroWithImageProps) {
  const textClasses = textColor === "light" 
    ? "text-white" 
    : "text-foreground";

  const subtextClasses = textColor === "light"
    ? "text-white/80"
    : "text-muted-foreground";

  const bgStyles = getBackgroundStyles(background);

  return (
    <section className="relative w-full min-h-[600px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0" style={bgStyles} />
      
      {/* Overlay */}
      {background.overlay && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: background.overlay.color,
            opacity: background.overlay.opacity / 100,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col gap-6 max-w-3xl">
            <h1 className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
              textClasses
            )}>
              {headline}
            </h1>
            <p className={cn("text-lg md:text-xl max-w-2xl", subtextClasses)}>
              {subheadline}
            </p>
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-wrap gap-4 mt-4">
                {primaryCta && (
                  <Button 
                    size="lg" 
                    variant={textColor === "light" ? "secondary" : "default"}
                    asChild
                  >
                    <a href={primaryCta.href}>{primaryCta.label}</a>
                  </Button>
                )}
                {secondaryCta && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className={textColor === "light" ? "border-white text-white hover:bg-white/10" : ""}
                    asChild
                  >
                    <a href={secondaryCta.href}>{secondaryCta.label}</a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const heroWithImageBlock = defineBlock({
  meta: {
    id: "hero-with-image",
    name: "Image Background Hero",
    description: "A full-width hero with a background image and overlay",
    category: BlockCategory.HERO,
    icon: "image",
    tags: ["hero", "header", "background", "image", "fullwidth"],
  },
  component: HeroWithImage,
  defaultProps: {
    headline: "Experience the difference",
    subheadline: "Join thousands of customers who have transformed their business with our innovative solutions.",
    primaryCta: {
      label: "Get Started Now",
      href: "/signup",
      variant: "primary",
    },
    secondaryCta: {
      label: "Learn More",
      href: "/about",
      variant: "outline",
    },
    background: {
      type: "image",
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=900&fit=crop",
      size: "cover",
      position: "center",
      repeat: "no-repeat",
      attachment: "scroll",
      overlay: {
        color: "#000000",
        opacity: 50,
      },
    },
    textColor: "light",
  },
  propsSchema: heroWithImagePropsSchema,
});
