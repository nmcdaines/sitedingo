"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Plus, MousePointer } from "lucide-react";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "ai", icon: Sparkles, label: "AI Assistant" },
  { id: "add", icon: Plus, label: "Add Page" },
];

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
      <div className="flex flex-col gap-1 p-1.5 bg-card border border-border rounded-xl shadow-lg">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                activeTool === tool.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
