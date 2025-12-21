'use client';

interface ConnectionLineProps {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number };
}

export function ConnectionLine({ from, to }: ConnectionLineProps) {
  // Connect from the bottom center of the parent page card (120px is the base page height)
  const pageCardHeight = 120;
  const startX = from.x + from.width / 2;
  const startY = from.y + pageCardHeight;
  const endX = to.x + to.width / 2;
  const endY = to.y;

  // Calculate intermediate points for a stepped line (vertical, horizontal, vertical)
  // This creates the classic tree diagram appearance
  const midY = startY + (endY - startY) / 2;
  
  // Create a path: down from parent, horizontal, then down to child
  // Format as a single line to avoid parsing issues
  const pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;

  return (
    <path
      d={pathData}
      stroke="var(--border)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd="url(#arrowhead)"
      className="transition-opacity duration-200"
    />
  );
}

