'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AddPageButtonProps {
  onClick?: () => void;
  parentId?: number | null;
  position?: number;
  className?: string;
}

// Horizontal line component (without arrow)
export function HorizontalLine() {
  const lineStyle = {
    fill: 'none',
    stroke: 'var(--border)',
    strokeWidth: '2px',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg width="100%" height="2px" viewBox="0 0 100 2" preserveAspectRatio="none" className="block">
      <line
        x1="0"
        y1="1"
        x2="100"
        y2="1"
        style={lineStyle}
      />
    </svg>
  );
}

export function AddPageButton({ onClick, parentId, position, className }: AddPageButtonProps) {
  return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className={cn("rounded-full w-10 h-10 p-0 border-2 border-dashed hover:border-solid hover:bg-primary/10 transition-all", className)}
        aria-label="Add new page"
      >
        <Plus className="w-5 h-5 text-muted-foreground" />
      </Button>
  );
}

