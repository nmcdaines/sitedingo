"use client";

import { Users, Share2, Grid3x3, FileDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  projectName?: string;
  className?: string;
}

export function ProjectHeader({
  projectName = "Gretta Architectural Firm",
  className,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">S</span>
        </div>
        <span className="font-semibold text-gray-900">{projectName}</span>
        <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
          <Users className="w-4 h-4" />
          Invite & earn
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            >
              ND
            </div>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <Button variant="ghost" size="sm" className="text-gray-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button variant="ghost" size="sm" className="text-gray-600">
          <Grid3x3 className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" className="text-gray-600">
          Export
        </Button>

        <Button className="bg-gray-900 hover:bg-gray-800 text-white">
          Upgrade
        </Button>
      </div>
    </div>
  );
}
