"use client";

import { Plus, Trash2, Copy, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-200",
        className
      )}
    >
      <Button variant="default" size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Page
      </Button>
      <Button variant="ghost" size="sm" className="gap-2">
        <Copy className="w-4 h-4" />
        Duplicate
      </Button>
      <Button variant="ghost" size="sm" className="gap-2">
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
