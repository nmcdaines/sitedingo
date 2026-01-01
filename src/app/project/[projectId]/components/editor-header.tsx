'use client';

import { Button } from "@/components/ui/button";
import { Home, Gift, Share2, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  
  const tabs = [
    { name: 'Sitemap', path: `/project/${projectId}` },
    { name: 'Style Guide', path: `/project/${projectId}/style-guide` },
    { name: 'Design', path: `/project/${projectId}/design` },
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
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side: Project name and tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{project.name}</span>
              <span className="text-muted-foreground text-sm">▼</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 border-l pl-4">
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
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Gift className="w-4 h-4 mr-2" />
            Invite & earn
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="bg-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
}


