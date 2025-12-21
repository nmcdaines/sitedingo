'use client';

import { Button } from "@/components/ui/button";
import { Edit, Plus, HelpCircle, Undo2, Redo2 } from "lucide-react";

interface EditorSidebarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function EditorSidebar({ onUndo, onRedo, canUndo, canRedo }: EditorSidebarProps) {
  return (
    <aside className="w-16 border-r bg-background flex flex-col items-center py-4 gap-4">
      <Button variant="ghost" size="icon" title="Edit">
        <Edit className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" title="Add">
        <Plus className="w-5 h-5" />
      </Button>
      <div className="flex-1" />
      <Button 
        variant="ghost" 
        size="icon" 
        title="Undo (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2 className="w-5 h-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        title="Redo (Ctrl+Y)"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo2 className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" title="Help">
        <HelpCircle className="w-5 h-5" />
      </Button>
    </aside>
  );
}

