'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy, MoreVertical } from "lucide-react";

interface ContextMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export function ContextMenu({ onEdit, onDelete, onDuplicate }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-48 rounded-md border bg-background shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="p-1">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit();
              }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {onDuplicate && (
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onDuplicate();
                }}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
            )}
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-destructive rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

