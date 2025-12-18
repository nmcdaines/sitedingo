
'use client';

import { useParams } from 'next/navigation'

import { Button } from "@/components/ui/button";
import { client } from "@/lib/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import Link from 'next/link';

function useGetProjectQuery(projectId: string) {
  const query = useSuspenseQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      return client.api.projects({ id: projectId }).get().then(res => res.data);
    }
  })
  return [query.data, query] as const;
}

export default function ListProjectsPage() {
  const params = useParams<{ projectId: string }>()

  return (
    <div>
      <Link href="/project">
        <Button>
          Back to Projects
        </Button>
      </Link>
      <h1>List of Project {JSON.stringify(params)}</h1>
      <Suspense fallback={<p>Loading project...</p>}>
        <ProjectsList projectId={params.projectId} />
      </Suspense>
    </div>
  );
}


function ProjectsList({ projectId }: { projectId: string }) {
  const [project] = useGetProjectQuery(projectId)
  return (
    <pre>
      {JSON.stringify(project, null, 2)}
    </pre>
  )
}
