'use client';

import React from 'react';
import { TreeNode } from '../../lib/tree-utils';
import { PageNode } from './page-node';
import { EmptySpaceDropZone } from './empty-space-drop-zone';

interface PageTreeNodeProps {
  node: TreeNode;
  localPages: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    parentId: number | null;
    sections: Array<{
      id: number;
      componentType: string;
      name: string | null;
      metadata: any;
      sortOrder: number;
    }>;
  }>;
  selectedNodeId: number | null;
  activeId: string | null;
  showSections: boolean;
  onPageSelect?: (page: any) => void;
  onPageEdit?: (page: any) => void;
  onPageDelete?: (page: any) => void;
  onPageDuplicate?: (page: any) => void;
  sitemapId?: number;
  children?: React.ReactNode;
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

export function PageTreeNode({
  node,
  localPages,
  selectedNodeId,
  activeId,
  showSections,
  onPageSelect,
  onPageEdit,
  onPageDelete,
  onPageDuplicate,
  sitemapId,
  children,
}: PageTreeNodeProps) {
  const pageData = localPages.find(p => p.id === node.id);
  const sortedChildren = [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
  const nodePage = localPages.find(p => p.id === node.id);
  const canHaveChildren = true; // Allow all pages to have children

  // Base case: render a single page node
  if (sortedChildren.length === 0) {
    return (
      <div className="flex flex-col items-center relative px-4">
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
        />
        {/* Drop zone for adding first child - absolutely positioned */}
        {/* {canHaveChildren && activeId && (
          <div 
            className="absolute pointer-events-auto"
            style={{
              top: '100%',
              marginTop: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              height: '60px',
            }}
          >
            <EmptySpaceDropZone
              id={`reorder-${node.id}-0`}
              parentId={node.id}
              position={0}
              width={280}
              height={60}
              isVisible={true}
              className='bg-blue-600/50'
            />
          </div>
        )} */}

        {children}
      </div>
    );
  }

  // Render parent with children
  return (
    <div className="flex flex-col items-center">
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
      >
        {canHaveChildren && activeId && (
          <EmptySpaceDropZone
            id={`reorder-${node.id}-before`}
            parentId={node.parentId}
            position={node.sortOrder}
            width={4}
            height={60}
            isVisible={true}
            className='absolute bg-yellow-600/50 left-0 top-0 h-full w-[12px] -translate-x-full'
          />
        )}

        {canHaveChildren && activeId && (
          <EmptySpaceDropZone
            id={`reorder-${node.id}-after`}
            parentId={node.parentId}
            position={node.sortOrder + 1}
            width={12}
            height={60}
            isVisible={true}
            className='absolute bg-green-600/50 right-0 top-0 h-full w-[12px]'
          />
        )}
      </PageNode>

      {/* Vertical line */}
      <VerticalLine />

      {/* Children grid */}
      <div
        className="grid w-full relative"
        style={{ gridTemplateColumns: `repeat(${sortedChildren.length}, 1fr)` }}
      >
        {sortedChildren.map((child, index) => (
          <div key={child.id} className="flex flex-col items-center relative">
            {/* Horizontal arrow */}
            <HorizontalArrow
              isFirst={index === 0}
              isLast={index === sortedChildren.length - 1}
            />

            {/* Recursive child node */}
            <PageTreeNode
              node={child}
              localPages={localPages}
              selectedNodeId={selectedNodeId}
              activeId={activeId}
              showSections={showSections}
              onPageSelect={onPageSelect}
              onPageEdit={onPageEdit}
              onPageDelete={onPageDelete}
              onPageDuplicate={onPageDuplicate}
              sitemapId={sitemapId}
            >
              {canHaveChildren && activeId && (
                <EmptySpaceDropZone
                  id={`reorder-${node.id}-${index}`}
                  parentId={node.id}
                  position={index}
                  width={4}
                  height={60}
                  isVisible={true}
                  className='absolute bg-yellow-600/50 left-0 top-0 h-full w-[12px]'
                />
              )}

              {canHaveChildren && activeId && index === sortedChildren.length - 1 && (
                <EmptySpaceDropZone
                  id={`reorder-${node.id}-${index + 1}`}
                  parentId={node.id}
                  position={index + 1}
                  width={12}
                  height={60}
                  isVisible={true}
                  className='absolute bg-green-600/50 right-0 top-0 h-full w-[12px]'
                />
              )}
            </PageTreeNode>
          </div>
        ))}
      </div>
    </div>
  );
}

