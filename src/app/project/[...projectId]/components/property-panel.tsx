'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';

interface Page {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: number | null;
}

interface PropertyPanelProps {
  page: Page | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function PropertyPanel({ page, isOpen, onClose, onDelete }: PropertyPanelProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (page) {
      setFormData({
        name: page.name,
        slug: page.slug,
        description: page.description || '',
      });
    }
  }, [page]);

  const updatePageMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description: string | null }) => {
      if (!page) throw new Error('No page selected');
      return client.api.pages({ id: page.id.toString() }).put({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parentId: page.parentId,
        sortOrder: page.sortOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async () => {
      if (!page) throw new Error('No page selected');
      return client.api.pages({ id: page.id.toString() }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      onDelete?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePageMutation.mutateAsync({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this page?')) {
      await deletePageMutation.mutateAsync();
    }
  };

  if (!isOpen || !page) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Edit Page</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Page name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">
            Slug
          </label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="page-slug"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Page description"
            rows={4}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={updatePageMutation.isPending}>
            {updatePageMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePageMutation.isPending}
          >
            {deletePageMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </form>
    </div>
  );
}

