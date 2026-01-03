'use client';

import React from 'react';
import { TreeNode } from '../../lib/tree-utils';
import { PageNode } from './page-node';
import { EmptySpaceDropZone } from './empty-space-drop-zone';
import { useSitemapDiagram } from './sitemap-diagram-context';
import { Page } from './types';

interface PageTreeNodeProps {
  node: TreeNode;
  selectedNodeId: number | null;
  onPageSelect?: (page: Page | null) => void;
  onPageEdit?: (page: Page | null) => void;
  onPageDelete?: (page: Page | null) => void;
  onPageDuplicate?: (page: Page | null) => void;
  onSectionSelect?: (section: { id: number; componentType: string; name: string | null; metadata: Record<string, unknown>; sortOrder: number; pageId?: number } | null) => void;
  children?: React.ReactNode;
  readOnly?: boolean;
}

// Vertical line component (SVG)
function VerticalLine() {
  const lineStyle = {
    fill: 'none',
    stroke: 'var(--border)',
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

// Horizontal arrow component (SVG)
function HorizontalArrow({ isFirst, isLast }: { isFirst: boolean; isLast: boolean }) {
  const lineStyle = {
    fill: 'none',
    stroke: 'var(--border)',
    strokeWidth: '2px',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <div className='w-full h-[40px]'>
    <svg width="100%" height="40px" className="absolute block">
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
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

      {/* Vertical line with arrow - centered to align with PageNode */}
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="30"
        markerEnd="url(#arrowhead)"
        style={lineStyle}
      />
    </svg>
    </div>
  );
}

export function PageTreeNode({
  node,
  selectedNodeId,
  onPageSelect,
  onPageEdit,
  onPageDelete,
  onPageDuplicate,
  onSectionSelect,
  children,
  readOnly = false,
}: PageTreeNodeProps) {
  const { pages, activeId, showSections } = useSitemapDiagram();
  const pageData = pages.find(p => p.id === node.id);
  const sortedChildren = [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
  const canHaveChildren = true; // Allow all pages to have children

  // Base case: render a single page node
  if (sortedChildren.length === 0) {
    return (
      <div className="flex flex-col items-center relative group pb-12">
        <PageNode
          node={node}
          isSelected={selectedNodeId === node.id}
          isDragging={activeId === `page-${node.id}`}
          showSections={showSections}
          onClick={() => onPageSelect?.(pageData || null)}
          onEdit={() => onPageEdit?.(pageData || null)}
          onDelete={async () => {
            if (pageData && confirm('Are you sure you want to delete this page?')) {
              await onPageDelete?.(pageData);
            }
          }}
          onDuplicate={onPageDuplicate ? async () => {
            if (pageData) {
              await onPageDuplicate(pageData);
            }
          } : undefined}
          onSectionSelect={onSectionSelect}
          readOnly={readOnly}
        />

        {children}
      </div>
    );
  }

  // Render parent with children
  return (
    <div className="flex flex-col items-center pointer-events-none">
      {/* Parent node */}
      <PageNode
        node={node}
        isSelected={selectedNodeId === node.id}
        isDragging={activeId === `page-${node.id}`}
        showSections={showSections}
        onClick={() => onPageSelect?.(pageData || null)}
        onEdit={() => onPageEdit?.(pageData || null)}
        onDelete={async () => {
          if (pageData && confirm('Are you sure you want to delete this page?')) {
            await onPageDelete?.(pageData);
          }
        }}
        onDuplicate={onPageDuplicate ? async () => {
          if (pageData) {
            await onPageDuplicate(pageData);
          }
        } : undefined}
        onSectionSelect={onSectionSelect}
        readOnly={readOnly}

        dropZone={<>
          {canHaveChildren && activeId && (
            <EmptySpaceDropZone
              parentId={node.parentId}
              position={node.sortOrder}
              type="page"
              width={12}
              height={60}
              isVisible={true}
              className='absolute bg-yellow-600/50 left-0 right-[calc(50%+140px)] top-0 h-full w-auto'
              currentNode={{ id: node.id, position: node.sortOrder }}
              direction="previous"
            />
          )}

          {canHaveChildren && activeId && (
            <EmptySpaceDropZone
              parentId={node.parentId}
              position={node.sortOrder + 1}
              type="page"
              width={12}
              height={60}
              isVisible={true}
              className='z-0 absolute bg-green-600/50 right-0 top-0 h-full left-[calc(50%+140px)] w-auto'
              currentNode={{ id: node.id, position: node.sortOrder }}
              direction="next"
            />
          )}
        </>}
      >

        {/* Vertical line */}
        <VerticalLine />

        {/* Children flex container - centered relative to parent */}
        <div className="relative w-full flex justify-center" style={{ minWidth: 'max-content', overflow: 'visible' }}>
          <div className="flex flex-row relative flex-nowrap">
            {sortedChildren.flatMap((child, index) => [
              <div key={child.id} className="flex flex-col items-center relative" style={{ width: 'max-content', minWidth: '280px', flexShrink: 0, flexGrow: 0 }}>
                {/* Horizontal arrow */}
                <HorizontalArrow
                  isFirst={index === 0}
                  isLast={index === sortedChildren.length - 1}
                />

                {/* Recursive child node */}
                <PageTreeNode
                  node={child}
                  selectedNodeId={selectedNodeId}
                  onPageSelect={onPageSelect}
                  onPageEdit={onPageEdit}
                  onPageDelete={onPageDelete}
                  onPageDuplicate={onPageDuplicate}
                  readOnly={readOnly}
                >
                  {canHaveChildren && activeId && (
                    <EmptySpaceDropZone
                      parentId={node.id}
                      position={index}
                      type="page"
                      width={12}
                      height={60}
                      isVisible={true}
                      className='absolute bg-pink-600/50 left-0 right-[calc(50%+140px)] top-0 h-full w-auto'
                      currentNode={{ id: child.id, position: child.sortOrder }}
                      direction="previous"
                    />
                  )}

                  {canHaveChildren && activeId && (
                    <EmptySpaceDropZone
                      parentId={node.id}
                      position={index + 1}
                      type="page"
                      width={12}
                      height={60}
                      isVisible={true}
                      className='z-0 absolute bg-blue-600/50 right-0 top-0 h-full left-[calc(50%+140px)] w-auto'
                      currentNode={{ id: child.id, position: child.sortOrder }}
                      direction="next"
                    />
                  )}
                </PageTreeNode>
              </div>,
            ]).filter(Boolean)}
          </div>
        </div>

      </PageNode>
    </div>
  );
}
