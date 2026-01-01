'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText, Link2, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';
import { useSitemapDiagram } from './sitemap-diagram/sitemap-diagram-context';

interface Page {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: number | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface Section {
  id: number;
  componentType: string;
  name: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
  pageId?: number;
}

interface PropertyPanelProps {
  page: Page | null;
  project: Project | null;
  section: Section | null;
  isOpen: boolean;
  isDragging?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function PropertyPanel({ page, project, section, isOpen, isDragging = false, onClose, onDelete }: PropertyPanelProps) {
  const isEditingProject = !page && !section && project !== null;
  const isEditingSection = section !== null;
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    componentType: '',
  });
  const queryClient = useQueryClient();
  
  // Get updatePage function from context for optimistic updates
  // Note: This will only work when PropertyPanel is within SitemapDiagramProvider
  let updatePage: ((pageId: number, updates: { name?: string; slug?: string; description?: string | null; icon?: string | null }) => void) | null = null;
  try {
    const context = useSitemapDiagram();
    updatePage = context.updatePage;
  } catch {
    // Not within provider, optimistic updates won't work
    // This is fine - the mutation will still work and invalidate queries
  }

  useEffect(() => {
    if (section) {
      setFormData({
        name: section.name || '',
        slug: '',
        description: '',
        componentType: section.componentType,
      });
    } else if (page) {
      setFormData({
        name: page.name,
        slug: page.slug,
        description: page.description || '',
        icon: page.icon || '',
        componentType: '',
      });
    } else if (project) {
      setFormData({
        name: project.name,
        slug: '',
        description: project.description || '',
        componentType: '',
      });
    }
  }, [page, project, section]);

  const updatePageMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description: string | null; icon: string | null }) => {
      if (!page) throw new Error('No page selected');
      return client.api.pages({ id: page.id.toString() }).put({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
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

  const updateSectionMutation = useMutation({
    mutationFn: async (data: { name: string | null; componentType: string }) => {
      if (!section) throw new Error('No section selected');
      if (!section.pageId) throw new Error('Section missing pageId');
      return client.api.sections({ id: section.id.toString() }).put({
        name: data.name || null,
        componentType: data.componentType,
        metadata: section.metadata || {},
        sortOrder: section.sortOrder,
        pageId: section.pageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async () => {
      if (!section) throw new Error('No section selected');
      return client.api.sections({ id: section.id.toString() }).delete();
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
    } else if (isEditingSection) {
      await updateSectionMutation.mutateAsync({
        name: formData.name,
        componentType: formData.componentType,
      });
    } else if (page) {
      // Optimistically update the sitemap before the API call
      if (updatePage) {
        updatePage(page.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          icon: formData.icon || null,
        });
      }
      await updatePageMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        icon: formData.icon || null,
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this page?')) {
      await deletePageMutation.mutateAsync();
    }
  };

  if (!isOpen || (!page && !project && !section)) return null;

  return (
    <div className={`absolute left-[72px] top-4 h-auto min-w-[320px] max-w-[420px] w-auto bg-background border shadow-xl flex flex-col rounded-lg z-50 transition-opacity duration-200 ${
      isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">{isEditingProject ? 'Project' : isEditingSection ? 'Section' : 'Page'}</h2>
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
          {!isEditingProject && !isEditingSection && (
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

          {/* Icon Field - Only for pages */}
          {!isEditingProject && !isEditingSection && (
            <div className="space-y-1.5">
              <label htmlFor="icon" className="text-sm font-medium text-foreground">
                Icon
              </label>
              <select
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Default</option>
                <option value="home">Home</option>
                <option value="info">Info</option>
                <option value="folder">Folder</option>
                <option value="phone">Phone</option>
                <option value="shopping-cart">Shopping Cart</option>
                <option value="users">Users</option>
                <option value="settings">Settings</option>
                <option value="mail">Mail</option>
                <option value="calendar">Calendar</option>
                <option value="image">Image</option>
                <option value="music">Music</option>
                <option value="video">Video</option>
                <option value="book">Book</option>
                <option value="map">Map</option>
                <option value="heart">Heart</option>
                <option value="star">Star</option>
                <option value="search">Search</option>
                <option value="bell">Bell</option>
                <option value="camera">Camera</option>
                <option value="gift">Gift</option>
                <option value="coffee">Coffee</option>
                <option value="gamepad-2">Gamepad</option>
                <option value="laptop">Laptop</option>
                <option value="smartphone">Smartphone</option>
                <option value="globe">Globe</option>
                <option value="lock">Lock</option>
                <option value="unlock">Unlock</option>
                <option value="eye">Eye</option>
                <option value="download">Download</option>
                <option value="upload">Upload</option>
                <option value="share">Share</option>
              </select>
            </div>
          )}

          {/* Component Type Field - Only for sections */}
          {isEditingSection && (
            <div className="space-y-1.5">
              <label htmlFor="componentType" className="text-sm font-medium text-foreground">
                Component Type *
              </label>
              <select
                id="componentType"
                value={formData.componentType}
                onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="hero">Hero</option>
                <option value="text">Text</option>
                <option value="features">Features</option>
                <option value="testimonials">Testimonials</option>
                <option value="cta">Call to Action</option>
                <option value="gallery">Gallery</option>
                <option value="pricing">Pricing</option>
                <option value="faq">FAQ</option>
                <option value="contact">Contact</option>
                <option value="footer">Footer</option>
                <option value="header">Header</option>
                <option value="navigation">Navigation</option>
              </select>
            </div>
          )}

          {/* Description Field - Only for pages and projects */}
          {!isEditingSection && (
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
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t px-5 py-4 space-y-2 mt-auto">
          <Button 
            type="submit" 
            disabled={
              isEditingProject 
                ? updateProjectMutation.isPending 
                : isEditingSection 
                  ? updateSectionMutation.isPending 
                  : updatePageMutation.isPending
            }
            className="w-full"
            size="default"
          >
            {(
              isEditingProject 
                ? updateProjectMutation.isPending 
                : isEditingSection 
                  ? updateSectionMutation.isPending 
                  : updatePageMutation.isPending
            ) ? 'Saving...' : 'Save Changes'}
          </Button>
          {!isEditingProject && (
            <Button
              type="button"
              variant="outline"
              onClick={isEditingSection ? async () => {
                if (confirm('Are you sure you want to delete this section?')) {
                  await deleteSectionMutation.mutateAsync();
                }
              } : handleDelete}
              disabled={isEditingSection ? deleteSectionMutation.isPending : deletePageMutation.isPending}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              size="default"
            >
              <Trash2 className="w-4 h-4" />
              {isEditingSection 
                ? (deleteSectionMutation.isPending ? 'Deleting...' : 'Delete Section')
                : (deletePageMutation.isPending ? 'Deleting...' : 'Delete Page')
              }
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

