import { z } from "zod";

// Background color configuration
export const backgroundColorSchema = z.object({
  type: z.literal("color"),
  value: z.string(), // CSS color value (hex, rgb, hsl, or tailwind class)
  opacity: z.number().min(0).max(100).optional(),
});

// Background image configuration
export const backgroundImageSchema = z.object({
  type: z.literal("image"),
  url: z.string(),
  size: z.enum(["cover", "contain", "auto"]).optional(),
  position: z.enum([
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ]).optional(),
  repeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]).optional(),
  attachment: z.enum(["scroll", "fixed"]).optional(),
  overlay: z.object({
    color: z.string(),
    opacity: z.number().min(0).max(100),
  }).optional(),
});

// Gradient configuration
export const backgroundGradientSchema = z.object({
  type: z.literal("gradient"),
  direction: z.enum([
    "to-t",
    "to-b",
    "to-l",
    "to-r",
    "to-tl",
    "to-tr",
    "to-bl",
    "to-br",
  ]).optional(),
  from: z.string(),
  via: z.string().optional(),
  to: z.string(),
});

// Combined background schema
export const backgroundConfigSchema = z.discriminatedUnion("type", [
  backgroundColorSchema,
  backgroundImageSchema,
  backgroundGradientSchema,
]);

export type BackgroundColor = z.infer<typeof backgroundColorSchema>;
export type BackgroundImage = z.infer<typeof backgroundImageSchema>;
export type BackgroundGradient = z.infer<typeof backgroundGradientSchema>;
export type BackgroundConfig = z.infer<typeof backgroundConfigSchema>;

// Preset color swatches
export const colorSwatches = {
  neutral: [
    { name: "White", value: "#ffffff" },
    { name: "Gray 50", value: "#fafafa" },
    { name: "Gray 100", value: "#f4f4f5" },
    { name: "Gray 200", value: "#e4e4e7" },
    { name: "Gray 300", value: "#d4d4d8" },
    { name: "Gray 800", value: "#27272a" },
    { name: "Gray 900", value: "#18181b" },
    { name: "Black", value: "#000000" },
  ],
  brand: [
    { name: "Primary", value: "var(--primary)" },
    { name: "Secondary", value: "var(--secondary)" },
    { name: "Accent", value: "var(--accent)" },
    { name: "Muted", value: "var(--muted)" },
  ],
  colors: [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Yellow", value: "#eab308" },
    { name: "Lime", value: "#84cc16" },
    { name: "Green", value: "#22c55e" },
    { name: "Emerald", value: "#10b981" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Fuchsia", value: "#d946ef" },
    { name: "Pink", value: "#ec4899" },
    { name: "Rose", value: "#f43f5e" },
  ],
};

// Helper to generate CSS styles from background config
export function getBackgroundStyles(config: BackgroundConfig): React.CSSProperties {
  switch (config.type) {
    case "color": {
      const opacity = config.opacity !== undefined ? config.opacity / 100 : 1;
      // Handle CSS variables
      if (config.value.startsWith("var(")) {
        return {
          backgroundColor: config.value,
          opacity,
        };
      }
      // Handle hex/rgb colors
      return {
        backgroundColor: config.value,
        opacity,
      };
    }
    case "image": {
      const positionMap: Record<string, string> = {
        center: "center center",
        top: "center top",
        bottom: "center bottom",
        left: "left center",
        right: "right center",
        "top-left": "left top",
        "top-right": "right top",
        "bottom-left": "left bottom",
        "bottom-right": "right bottom",
      };
      return {
        backgroundImage: `url(${config.url})`,
        backgroundSize: config.size || "cover",
        backgroundPosition: positionMap[config.position || "center"],
        backgroundRepeat: config.repeat || "no-repeat",
        backgroundAttachment: config.attachment || "scroll",
      };
    }
    case "gradient": {
      const directionMap: Record<string, string> = {
        "to-t": "to top",
        "to-b": "to bottom",
        "to-l": "to left",
        "to-r": "to right",
        "to-tl": "to top left",
        "to-tr": "to top right",
        "to-bl": "to bottom left",
        "to-br": "to bottom right",
      };
      const direction = directionMap[config.direction || "to-b"];
      const stops = config.via
        ? `${config.from}, ${config.via}, ${config.to}`
        : `${config.from}, ${config.to}`;
      return {
        backgroundImage: `linear-gradient(${direction}, ${stops})`,
      };
    }
  }
}

// Default background configs
export const defaultBackgrounds: Record<string, BackgroundConfig> = {
  white: { type: "color", value: "#ffffff" },
  light: { type: "color", value: "#fafafa" },
  muted: { type: "color", value: "var(--muted)" },
  dark: { type: "color", value: "#18181b" },
  primary: { type: "color", value: "var(--primary)" },
};
