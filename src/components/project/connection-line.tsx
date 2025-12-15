"use client";

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function ConnectionLine({
  startX,
  startY,
  endX,
  endY,
}: ConnectionLineProps) {
  // Calculate the path for a curved connector line
  const midY = (startY + endY) / 2;

  const path = `
    M ${startX} ${startY}
    L ${startX} ${midY}
    L ${endX} ${midY}
    L ${endX} ${endY}
  `;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-border"
      />
    </svg>
  );
}

// SVG connector component for rendering connection paths
export function SitemapConnections({
  connections,
}: {
  connections: { from: { x: number; y: number }; to: { x: number; y: number } }[];
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      {connections.map((conn, index) => {
        const { from, to } = conn;
        const midY = from.y + 50;

        const path = `
          M ${from.x} ${from.y}
          L ${from.x} ${midY}
          L ${to.x} ${midY}
          L ${to.x} ${to.y}
        `;

        return (
          <path
            key={index}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
        );
      })}
    </svg>
  );
}
