"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Check, Pipette } from "lucide-react";

interface ColorSwatchProps {
  color: string;
  name?: string;
  isSelected?: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, name, isSelected, onClick }: ColorSwatchProps) {
  const isVariable = color.startsWith("var(");
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
      )}
      style={{ backgroundColor: color }}
      title={name || color}
    >
      {isSelected && (
        <Check 
          className={cn(
            "absolute inset-0 m-auto w-4 h-4",
            isVariable || color === "#ffffff" || color === "#fafafa" || color === "#f4f4f5"
              ? "text-foreground" 
              : "text-white"
          )} 
        />
      )}
    </button>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  swatches?: Array<{ name: string; value: string }>;
  showInput?: boolean;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  swatches = [],
  showInput = true,
  className,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Only update if it looks like a valid color
    if (
      newValue.match(/^#[0-9A-Fa-f]{6}$/) ||
      newValue.match(/^#[0-9A-Fa-f]{3}$/) ||
      newValue.match(/^rgb\(/) ||
      newValue.match(/^hsl\(/) ||
      newValue.startsWith("var(")
    ) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if invalid
    if (!inputValue.match(/^#[0-9A-Fa-f]{3,6}$/) && 
        !inputValue.match(/^rgb\(/) && 
        !inputValue.match(/^hsl\(/) &&
        !inputValue.startsWith("var(")) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Color swatches */}
      {swatches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {swatches.map((swatch) => (
            <ColorSwatch
              key={swatch.value}
              color={swatch.value}
              name={swatch.name}
              isSelected={value === swatch.value}
              onClick={() => onChange(swatch.value)}
            />
          ))}
        </div>
      )}

      {/* Custom color input */}
      {showInput && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              placeholder="#000000"
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              title="Pick color"
            >
              <Pipette className="w-4 h-4 text-muted-foreground" />
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={value.startsWith("#") ? value : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
          </div>
          <div
            className="w-10 h-10 rounded-md border border-border shrink-0"
            style={{ backgroundColor: value }}
          />
        </div>
      )}
    </div>
  );
}

// Grouped swatches component
interface SwatchGroupProps {
  label: string;
  swatches: Array<{ name: string; value: string }>;
  value: string;
  onChange: (color: string) => void;
}

export function SwatchGroup({ label, swatches, value, onChange }: SwatchGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((swatch) => (
          <ColorSwatch
            key={swatch.value}
            color={swatch.value}
            name={swatch.name}
            isSelected={value === swatch.value}
            onClick={() => onChange(swatch.value)}
          />
        ))}
      </div>
    </div>
  );
}
