'use client';

type PageName = string;
type PageTree = PageName | PageTree[];
type SiblingPages = PageTree[];
type ParentWithChildren = [PageName, SiblingPages];

export default function EditorPage() {
  const pageTree: PageTree[] = [
    "Home",
    [
      "About",
      "Contact",
      "Browse",
      ["Services", [
        ["Services 1", ["Sub-Page 1", "Sub-Page 2"]],
        "Service 2",
        "Service 3"
        ],
      ],
      "Another Page",
    ],
  ];

  return (
    <div 
      className="w-full h-[calc(100vh-200px)]" 
      style={{ display: 'grid', gridTemplateColumns: `repeat(${pageTree.length}, 1fr)` }}
    >
      <PageTreeNode node={pageTree} />
    </div>
  );
}

function PageTreeNode({ node }: { node: PageTree }) {
  // Base case: render a single page name
  if (typeof node === 'string') {
    return (
      <div className="flex flex-col items-center">
        <PageCard name={node} />
      </div>
    );
  }

  // Check if this is a parent with children: [pageName, [children...]]
  if (
    Array.isArray(node) && 
    node.length === 2 && 
    typeof node[0] === 'string' && 
    Array.isArray(node[1])
  ) {
    const [parentName, children] = node as ParentWithChildren;
    return (
      <div>
        <PageTreeNode node={parentName} />
        <VerticalLine />
        <div 
          className="grid"
          style={{ gridTemplateColumns: `repeat(${children.length}, 1fr)` }}
        >
          {children.map((child: PageTree, index: number) => (
            <div key={index}>
              <HorizontalArrow 
                isFirst={index === 0} 
                isLast={index === children.length - 1} 
              />
              <PageTreeNode node={child} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Otherwise, it's an array of sibling pages
  const siblings = node as SiblingPages;
  return (
    <div 
      className="grid"
      style={{ gridTemplateColumns: `repeat(${siblings.length}, 1fr)` }}
    >
      {siblings.map((sibling: PageTree, index: number) => (
        <PageTreeNode key={index} node={sibling} />
      ))}
    </div>
  );
}

function PageCard({ name }: { name: string }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-md inline-flex w-70 justify-center px-2 py-4 mx-2">
      <pre className="m-0">{name}</pre>
    </div>
  );
}

function VerticalLine() {
  const lineStyle = {
    fill: 'none',
    stroke: '#e5e7eb',
    strokeWidth: '2px',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg width="100%" height="30px" className="block">
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="30"
        style={lineStyle}
      />
    </svg>
  );
}

function HorizontalArrow({ isFirst, isLast }: { isFirst: boolean; isLast: boolean }) {
  const lineStyle = {
    fill: 'none',
    stroke: '#e5e7eb',
    strokeWidth: '2px',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg width="100%" height="40px" className="block">
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#e5e7eb" />
        </marker>
      </defs>

      {/* Horizontal connector line */}
      <line
        x1={isFirst ? "50%" : "0"}
        y1="1"
        x2={isLast ? "50%" : "100%"}
        y2="1"
        style={lineStyle}
      />

      {/* Vertical line with arrow */}
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="30"
        markerEnd="url(#arrowhead)"
        style={lineStyle}
      />
    </svg>
  );
}