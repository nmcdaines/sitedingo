'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/lib/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
          const formData = new FormData(e.currentTarget);
          const project = await client.api.projects.post({
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            pagesCount: formData.get('pagesCount') as string,
          });
          if (project.data?.id) {
            router.push(`/project/${project.data.id}`);
          }
        } catch (error) {
          setIsLoading(false);
          throw error;
        }
      }}
      className="flex flex-col space-y-2 px-4 max-w-2xl"
    >
      <Input type="text" name="name" placeholder="Project Name" defaultValue="Gretta" disabled={isLoading} />
      <Textarea name="description" placeholder="Project Description" defaultValue="Gretta is a boutique Architectural firm based in Los Angeles that focuses on homes as well as smaller commercial and community projects." disabled={isLoading} />
      <Select name="pagesCount" defaultValue="2-5" disabled={isLoading}>
        <option value="1">1</option>
        <option value="2-5">2-5</option>
        <option value="5-10">5-10</option>
        <option value="10-15">10-15</option>
        <option value="15-20">15-20</option>
        <option value="20+">20+</option>
      </Select>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        Create Project
      </Button>
    </form>
  );
}
