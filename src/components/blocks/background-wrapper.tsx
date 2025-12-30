"use client";

import { type BackgroundConfig, getBackgroundStyles } from "./background-types";
import { cn } from "@/lib/utils";

interface BackgroundWrapperProps {
  background: BackgroundConfig | string;
  className?: string;
  children: React.ReactNode;
}

export function BackgroundWrapper({
  background,
  className,
  children,
}: BackgroundWrapperProps) {
  // Handle legacy string backgrounds (tailwind classes)
  if (typeof background === "string") {
    return (
      <div className={cn(background, className)}>
        {children}
      </div>
    );
  }

  // Handle new BackgroundConfig
  const styles = getBackgroundStyles(background);
  
  // For images with overlays, we need a wrapper
  if (background.type === "image" && background.overlay) {
    return (
      <div className={cn("relative", className)} style={styles}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: background.overlay.color,
            opacity: background.overlay.opacity / 100,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={className} style={styles}>
      {children}
    </div>
  );
}

// Utility to get a safe background value for blocks
// Converts BackgroundConfig to inline styles or handles legacy strings
export function useBackgroundStyle(
  background: BackgroundConfig | string | undefined,
  fallback: string = "#ffffff"
): { style?: React.CSSProperties; className?: string; overlay?: BackgroundConfig["type"] extends "image" ? { color: string; opacity: number } : never } {
  if (!background) {
    return { style: { backgroundColor: fallback } };
  }

  if (typeof background === "string") {
    // Legacy tailwind class
    if (background.startsWith("bg-")) {
      return { className: background };
    }
    // Direct color value
    return { style: { backgroundColor: background } };
  }

  const styles = getBackgroundStyles(background);
  
  if (background.type === "image" && background.overlay) {
    return { 
      style: styles, 
      overlay: background.overlay as { color: string; opacity: number }
    };
  }

  return { style: styles };
}
