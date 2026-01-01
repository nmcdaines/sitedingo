'use client';

import { EditorHeader } from "../components/editor-header";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";

function useGetProjectQuery(projectId: string) {
  const query = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const res = await client.api.projects({ id: projectId }).get();
      if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        const errorMessage = (res.data as { error?: string }).error || 'Project not found';
        throw new Error(errorMessage);
      }
      if (!res.data) {
        throw new Error('Project not found');
      }
      return res.data;
    }
  })
  return [query.data, query] as const;
}

export default function DesignPage() {
  const params = useParams<{ projectId: string }>();
  const [project, query] = useGetProjectQuery(params.projectId);

  if (query.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }

  if (query.isError || !project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Project not found</p>
          <p className="text-sm text-muted-foreground">
            {query.error instanceof Error ? query.error.message : 'The project you\'re looking for doesn\'t exist or you don\'t have access to it.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorHeader project={project} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Design</h1>
          <p className="text-muted-foreground">Design content will go here.</p>
        </div>
      </div>
    </div>
  );
}

