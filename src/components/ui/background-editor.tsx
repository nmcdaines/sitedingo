"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ColorPicker, SwatchGroup } from "@/components/ui/color-picker";
import {
  type BackgroundConfig,
  type BackgroundColor,
  type BackgroundImage,
  colorSwatches,
  getBackgroundStyles,
} from "@/components/blocks/background-types";
import {
  Palette,
  Image,
  Trash2,
  ChevronDown,
  ChevronUp,
  Move,
  Lock,
  Unlock,
} from "lucide-react";

type BackgroundType = "color" | "image";

interface BackgroundEditorProps {
  value: BackgroundConfig;
  onChange: (config: BackgroundConfig) => void;
  className?: string;
}

export function BackgroundEditor({ value, onChange, className }: BackgroundEditorProps) {
  const [activeType, setActiveType] = useState<BackgroundType>(value.type === "gradient" ? "color" : value.type);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = (type: BackgroundType) => {
    setActiveType(type);
    if (type === "color") {
      onChange({
        type: "color",
        value: "#ffffff",
        opacity: 100,
      });
    } else if (type === "image") {
      onChange({
        type: "image",
        url: "",
        size: "cover",
        position: "center",
        repeat: "no-repeat",
        attachment: "scroll",
      });
    }
  };

  const handleColorChange = (color: string) => {
    onChange({
      type: "color",
      value: color,
      opacity: (value as BackgroundColor).opacity ?? 100,
    });
  };

  const handleOpacityChange = (opacity: number) => {
    if (value.type === "color") {
      onChange({
        ...value,
        opacity,
      });
    }
  };

  const handleImageChange = (updates: Partial<BackgroundImage>) => {
    if (value.type === "image") {
      onChange({
        ...value,
        ...updates,
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type Selector */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => handleTypeChange("color")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeType === "color"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-4 h-4" />
          Color
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("image")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeType === "image"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Image className="w-4 h-4" />
          Image
        </button>
      </div>

      {/* Preview */}
      <div
        className="h-24 rounded-lg border border-border relative overflow-hidden"
        style={getBackgroundStyles(value)}
      >
        {value.type === "image" && value.overlay && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: value.overlay.color,
              opacity: value.overlay.opacity / 100,
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium px-2 py-1 rounded bg-background/80 text-foreground">
            Preview
          </span>
        </div>
      </div>

      {/* Color Editor */}
      {activeType === "color" && value.type === "color" && (
        <div className="space-y-4">
          {/* Brand colors */}
          <SwatchGroup
            label="Theme Colors"
            swatches={colorSwatches.brand}
            value={value.value}
            onChange={handleColorChange}
          />

          {/* Neutral colors */}
          <SwatchGroup
            label="Neutral"
            swatches={colorSwatches.neutral}
            value={value.value}
            onChange={handleColorChange}
          />

          {/* Color palette */}
          <SwatchGroup
            label="Colors"
            swatches={colorSwatches.colors}
            value={value.value}
            onChange={handleColorChange}
          />

          {/* Custom color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom Color
            </label>
            <ColorPicker
              value={value.value}
              onChange={handleColorChange}
              showInput
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Opacity
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={value.opacity ?? 100}
                onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-mono w-12 text-right">
                {value.opacity ?? 100}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor */}
      {activeType === "image" && value.type === "image" && (
        <div className="space-y-4">
          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Image URL
            </label>
            <Input
              value={value.url}
              onChange={(e) => handleImageChange({ url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="font-mono text-sm"
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sample Images
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                "https://images.unsplash.com/photo-1557683316-973673baf926?w=800",
                "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
                "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800",
                "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800",
              ].map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleImageChange({ url })}
                  className={cn(
                    "aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-105",
                    value.url === url ? "border-primary" : "border-transparent"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Sample background ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Size */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Size
                </label>
                <div className="flex gap-1">
                  {(["cover", "contain", "auto"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleImageChange({ size })}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-md border transition-colors capitalize",
                        value.size === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Move className="w-3 h-3" />
                  Position
                </label>
                <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                  {(["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"] as const).map(
                    (position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => handleImageChange({ position })}
                        className={cn(
                          "aspect-square rounded border transition-colors",
                          value.position === position
                            ? "bg-primary border-primary"
                            : "border-border hover:border-primary bg-muted/50"
                        )}
                        title={position}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Repeat */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Repeat
                </label>
                <div className="flex flex-wrap gap-1">
                  {(["no-repeat", "repeat", "repeat-x", "repeat-y"] as const).map((repeat) => (
                    <button
                      key={repeat}
                      type="button"
                      onClick={() => handleImageChange({ repeat })}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                        value.repeat === repeat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {repeat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachment (Fixed/Scroll) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Scroll Behavior
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleImageChange({ attachment: "scroll" })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors",
                      value.attachment === "scroll"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary"
                    )}
                  >
                    <Unlock className="w-4 h-4" />
                    Scroll
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageChange({ attachment: "fixed" })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors",
                      value.attachment === "fixed"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary"
                    )}
                  >
                    <Lock className="w-4 h-4" />
                    Fixed
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed backgrounds stay in place while the page scrolls, creating a parallax effect.
                </p>
              </div>

              {/* Overlay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Color Overlay
                  </label>
                  {value.overlay ? (
                    <button
                      type="button"
                      onClick={() => handleImageChange({ overlay: undefined })}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleImageChange({
                          overlay: { color: "#000000", opacity: 50 },
                        })
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      Add overlay
                    </button>
                  )}
                </div>
                {value.overlay && (
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <ColorPicker
                      value={value.overlay.color}
                      onChange={(color) =>
                        handleImageChange({
                          overlay: { ...value.overlay!, color },
                        })
                      }
                      swatches={[
                        { name: "Black", value: "#000000" },
                        { name: "White", value: "#ffffff" },
                        { name: "Primary", value: "var(--primary)" },
                      ]}
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value.overlay.opacity}
                        onChange={(e) =>
                          handleImageChange({
                            overlay: {
                              ...value.overlay!,
                              opacity: parseInt(e.target.value),
                            },
                          })
                        }
                        className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-mono w-12 text-right">
                        {value.overlay.opacity}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified version for quick selection
interface BackgroundQuickPickerProps {
  value: BackgroundConfig;
  onChange: (config: BackgroundConfig) => void;
}

export function BackgroundQuickPicker({ value, onChange }: BackgroundQuickPickerProps) {
  const quickColors: BackgroundConfig[] = [
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#fafafa" },
    { type: "color", value: "#f4f4f5" },
    { type: "color", value: "var(--primary)" },
    { type: "color", value: "#18181b" },
  ];

  return (
    <div className="flex items-center gap-2">
      {quickColors.map((config, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(config)}
          className={cn(
            "w-8 h-8 rounded-md border-2 transition-all",
            value.type === "color" && value.value === config.value
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:border-muted-foreground/50"
          )}
          style={getBackgroundStyles(config)}
        />
      ))}
    </div>
  );
}
