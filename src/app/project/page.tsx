'use client';

import { client } from "@/lib/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";

function useListProjectsQuery() {
  const query = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      return client.api.projects.get().then(res => res.data);
    }
  })
  return [query.data, query] as const;
}

export default function ListProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recent Projects</h1>
      <Suspense fallback={<p>Loading projects...</p>}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}

function ProjectsList() {
  const [projects] = useListProjectsQuery()
  
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <Link key={project.id} href={`/project/${project.id}`}>
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{project.pageCount} {project.pageCount === 1 ? 'page' : 'pages'}</span>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <span>Edited {formatTimeAgo(project.updatedAt)}</span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
