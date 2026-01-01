'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Share2, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAutoSave } from "../hooks/use-auto-save";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface EditorHeaderProps {
  project: Project;
}

export function EditorHeader({ project }: EditorHeaderProps) {
  const pathname = usePathname();
  const projectId = project.id.toString();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update local state when project prop changes
  useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Auto-save project name
  const saveStatus = useAutoSave(
    projectName,
    async (name: string) => {
      await client.api.projects({ id: projectId }).put({
        name,
        description: project.description,
      });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    { debounceMs: 500 }
  );

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setProjectName(project.name);
      setIsEditing(false);
    }
  };
  
  const tabs = [
    { name: 'Sitemap', path: `/project/${projectId}` },
    { name: 'Style Guide', path: `/project/${projectId}/style-guide` },
    { name: 'Design', path: `/project/${projectId}/design` },
    { name: 'Assets', path: `/project/${projectId}/assets` },
    { name: 'Database', path: `/project/${projectId}/database` },
  ];

  const isActive = (path: string) => {
    if (path === `/project/${projectId}`) {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="border-b bg-background">
      <div className="flex items-center h-14 px-4 relative">
        {/* Left side: Project name */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-primary" />
            </div>
          </Link>
          <div className="flex items-center gap-1 ml-2">
            {isEditing ? (
              <Input
                ref={inputRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
              />
            ) : (
              <span 
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={handleNameClick}
              >
                {project.name}
              </span>
            )}
          </div>
        </div>

        {/* Center: Navigation tabs */}
        <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {tabs.map((tab) => (
            <Link key={tab.path} href={tab.path}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={isActive(tab.path) ? "bg-accent" : ""}
              >
                {tab.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
          {/* <Button size="sm" className="bg-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade
          </Button> */}
        </div>
      </div>
    </header>
  );
}


