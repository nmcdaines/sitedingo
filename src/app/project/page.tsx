'use client';

import { Button } from "@/components/ui/button";
import { client } from "@/lib/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

function useListProjectsQuery() {
  const query = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      return client.api.project.get().then(res => res.data);
    }
  })
  return [query.data, query] as const;
}

export default function ListProjectsPage() {
  return (
    <div>
      <h1>List of Projects</h1>
      <Suspense fallback={<p>Loading projects...</p>}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}


function ProjectsList() {
  const [projects] = useListProjectsQuery()
  return (
    <>
      {
        projects
          ? projects.map(project => (
            <div key={project.id} style={{ marginBottom: '1rem' }}>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              <Button>
                View Project
              </Button>
            </div>
          ))
          : <p>No projects found.</p>
      }
    </>
  )
}
