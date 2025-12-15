"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: "sitemap", label: "Sitemap" },
  { id: "wireframe", label: "Wireframe" },
  { id: "style-guide", label: "Style Guide" },
  { id: "design", label: "Design" },
];

interface VisualizationTabsProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function VisualizationTabs({
  activeTab: controlledActiveTab,
  onTabChange,
  className,
}: VisualizationTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("sitemap");
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  return (
    <div
      className={cn(
        "border-b border-gray-200 bg-white",
        className
      )}
    >
      <div className="flex gap-1 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
