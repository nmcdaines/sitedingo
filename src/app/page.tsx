'use client';

import { client } from "@/lib/client";

export default function Home() {
  return (
    <form
      action={async (formData) => {
        const project = await client.api.project.post({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
        });
        window.location.href = `/project/${project.data?.id || ''}`;
      }}
    >
      <input type="text" name="name" placeholder="Project Name" />
      <input type="text" name="description" placeholder="Project Description" />

      <button type="submit">Create Project</button>
    </form>
  );
}
