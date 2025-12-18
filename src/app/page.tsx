'use client';

import { Button } from "@/components/ui/button";
import { client } from "@/lib/client";

export default function Home() {
  return (
    <form
      action={async (formData) => {
        const project = await client.api.projects.post({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
        });
        window.location.href = `/project/${project.data?.id || ''}`;
      }}
      className="flex flex-col space-y-2 px-4"
    >
      <input type="text" name="name" placeholder="Project Name" defaultValue="Gretta" />
      <textarea name="description" placeholder="Project Description" defaultValue="Gretta is a boutique Architectural firm based in Los Angeles that focuses on homes as well as smaller commercial and community projects." />

      <Button type="submit">Create Project</Button>
    </form>
  );
}
