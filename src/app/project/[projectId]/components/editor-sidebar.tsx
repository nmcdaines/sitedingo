'use client';

import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";

interface EditorSidebarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isPropertyPanelOpen?: boolean;
  onTogglePropertyPanel?: () => void;
}

export function EditorSidebar({ onUndo, onRedo, canUndo, canRedo, isPropertyPanelOpen, onTogglePropertyPanel }: EditorSidebarProps) {
  return (
    <aside className="absolute left-4 top-4 z-40 flex flex-col gap-2">
      {/* Floating Edit button */}
      <Button 
        variant={ isPropertyPanelOpen ? "default" : "secondary" }
        size="icon" 
        title="Toggle edit panel"
        onClick={onTogglePropertyPanel}
        className={`h-10 w-10 border shadow-sm transition-colors`}
      >
        <Edit className="w-5 h-5" />
      </Button>
      
      {/* Floating Add button */}
      <Button 
        variant="ghost" 
        size="icon" 
        title="Add"
        className="h-10 w-10 bg-background border shadow-sm hover:bg-accent"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </aside>
  );
}

