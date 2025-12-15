"use client";

import { useState } from "react";
import { PageCard } from "./page-card";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  description?: string;
  componentType: string;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  sections: Section[];
  children?: Page[];
}

interface SitemapCanvasProps {
  pages: Page[];
  className?: string;
}

export function SitemapCanvas({ pages, className }: SitemapCanvasProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const togglePageExpansion = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const renderPage = (page: Page, level: number = 0) => {
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedPages.has(page.id);

    return (
      <div key={page.id} className="relative">
        {/* Page Card */}
        <div className="flex justify-center mb-8">
          <PageCard
            id={page.id}
            name={page.name}
            sections={page.sections}
            isExpanded={isExpanded}
            onToggleExpand={() => togglePageExpansion(page.id)}
            className="w-80"
          />
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="relative">
            {/* Connecting line from parent */}
            <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-gray-300 -translate-x-1/2 -translate-y-8" />

            {/* Horizontal line connecting children */}
            {page.children!.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-gray-300"
                style={{
                  left: "calc(16.666% + 10rem)",
                  right: "calc(16.666% + 10rem)",
                }}
              />
            )}

            {/* Child pages */}
            <div
              className={cn(
                "grid gap-8",
                page.children!.length === 1 && "grid-cols-1",
                page.children!.length === 2 && "grid-cols-2",
                page.children!.length === 3 && "grid-cols-3",
                page.children!.length >= 4 && "grid-cols-4"
              )}
            >
              {page.children!.map((child) => (
                <div key={child.id} className="relative">
                  {/* Vertical line to child */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-gray-300 -translate-x-1/2" />
                  {renderPage(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootPages = pages.filter((p) => !p.children || p.children.length === 0);
  const homePageIndex = pages.findIndex(
    (p) => p.slug === "/" || p.slug === "home" || p.name.toLowerCase() === "home"
  );
  const homePage = homePageIndex !== -1 ? pages[homePageIndex] : pages[0];

  return (
    <div
      className={cn(
        "w-full min-h-screen bg-gray-50 p-8 overflow-auto",
        className
      )}
    >
      <div className="max-w-[1600px] mx-auto pt-8">
        {homePage ? (
          renderPage(homePage)
        ) : (
          <div className="text-center text-gray-500 py-12">
            No pages found in this sitemap
          </div>
        )}
      </div>
    </div>
  );
}
