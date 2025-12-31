'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText, Link2, Trash2 } from "lucide-react";
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

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface PropertyPanelProps {
  page: Page | null;
  project: Project | null;
  isOpen: boolean;
  isDragging?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function PropertyPanel({ page, project, isOpen, isDragging = false, onClose, onDelete }: PropertyPanelProps) {
  const isEditingProject = !page && project !== null;
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
    } else if (project) {
      setFormData({
        name: project.name,
        slug: '',
        description: project.description || '',
      });
    }
  }, [page, project]);

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

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string | null }) => {
      if (!project) throw new Error('No project selected');
      return client.api.projects({ id: project.id.toString() }).put({
        name: data.name,
        description: data.description || null,
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
    if (isEditingProject) {
      await updateProjectMutation.mutateAsync({
        name: formData.name,
        description: formData.description || null,
      });
    } else if (page) {
      await updatePageMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this page?')) {
      await deletePageMutation.mutateAsync();
    }
  };

  if (!isOpen || (!page && !project)) return null;

  return (
    <div className={`absolute left-[72px] top-4 h-auto min-w-[320px] max-w-[420px] w-auto bg-background border shadow-xl flex flex-col rounded-lg z-50 transition-opacity duration-200 ${
      isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">{isEditingProject ? 'Project' : 'Page'}</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex flex-col min-w-0">
        <div className="px-5 py-5 space-y-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name *
            </label>
            <div className="relative">
              <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isEditingProject ? "Project name" : "Page name"}
                className="pl-8"
                required
              />
            </div>
          </div>

          {/* Slug Field - Only for pages */}
          {!isEditingProject && (
            <div className="space-y-1.5">
              <label htmlFor="slug" className="text-sm font-medium text-foreground">
                Slug *
              </label>
              <div className="relative">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="page-slug"
                  className="pl-8"
                  required
                />
              </div>
            </div>
          )}

          {/* Description Field */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this page..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-5 py-4 space-y-2 mt-auto">
          <Button 
            type="submit" 
            disabled={isEditingProject ? updateProjectMutation.isPending : updatePageMutation.isPending}
            className="w-full"
            size="default"
          >
            {(isEditingProject ? updateProjectMutation.isPending : updatePageMutation.isPending) ? 'Saving...' : 'Save Changes'}
          </Button>
          {!isEditingProject && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deletePageMutation.isPending}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              size="default"
            >
              <Trash2 className="w-4 h-4" />
              {deletePageMutation.isPending ? 'Deleting...' : 'Delete Page'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

