'use client';

import React from 'react';
import { PlusIcon } from 'lucide-react';
import { TreeNode } from '../../lib/tree-utils';
import { PageNode } from './page-node';
import { EmptySpaceDropZone } from './empty-space-drop-zone';
import { useSitemapDiagram } from './sitemap-diagram-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageTreeNodeProps {
  node: TreeNode;
  selectedNodeId: number | null;
  onPageSelect?: (page: any) => void;
  onPageEdit?: (page: any) => void;
  onPageDelete?: (page: any) => void;
  onPageDuplicate?: (page: any) => void;
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
  children,
}: PageTreeNodeProps) {
  const { pages, activeId, showSections, addPage } = useSitemapDiagram();
  const pageData = pages.find(p => p.id === node.id);
  const sortedChildren = [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
  const canHaveChildren = true; // Allow all pages to have children

  // Handle adding a new child page
  const handleAddChildPage = async () => {
    if (!pageData) {
      console.error('Missing page data for node:', node.id);
      return;
    }
    
    await addPage(node.id, 0);
  };

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
        />

        {/* Add child page button - appears on hover below leaf nodes */}
        <div className={cn('mt-2 hidden z-10', !activeId && 'group-hover:block')}>
          <Button 
            variant="outline"
            className='add-button'
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAddChildPage();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ zIndex: 9999 }}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        {children}
      </div>
    );
  }

  // Render parent with children
  return (
    <div className="flex flex-col items-center" style={{ width: 'max-content', minWidth: '280px', overflow: 'visible' }}>
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

        dropZone={<>
          {canHaveChildren && activeId && (
            <EmptySpaceDropZone
              id={`reorder-${node.parentId ?? 'root'}-${node.sortOrder}`}
              parentId={node.parentId}
              position={node.sortOrder}
              width={12}
              height={60}
              isVisible={true}
              className='absolute bg-yellow-600/50 left-0 right-[calc(50%+140px)] top-0 h-full w-auto'
            />
          )}

          {canHaveChildren && activeId && (
            <EmptySpaceDropZone
              id={`reorder-${node.parentId ?? 'root'}-${node.sortOrder + 1}`}
              parentId={node.parentId}
              position={node.sortOrder + 1}
              width={12}
              height={60}
              isVisible={true}
              className='z-0 absolute bg-green-600/50 right-0 top-0 h-full left-[calc(50%+140px)] w-auto'
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
                >
                  {canHaveChildren && activeId && (
                    <EmptySpaceDropZone
                      id={`reorder-${node.id}-${index}`}
                      parentId={node.id}
                      position={index}
                      width={12}
                      height={60}
                      isVisible={true}
                      className='absolute bg-pink-600/50 left-0 right-[calc(50%+140px)] top-0 h-full w-auto'
                    />
                  )}

                  {canHaveChildren && activeId && (
                    <EmptySpaceDropZone
                      id={`reorder-${node.id}-${index + 1}`}
                      parentId={node.id}
                      position={index + 1}
                      width={12}
                      height={60}
                      isVisible={true}
                      className='z-0 absolute bg-blue-600/50 right-0 top-0 h-full left-[calc(50%+140px)] w-auto'
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

