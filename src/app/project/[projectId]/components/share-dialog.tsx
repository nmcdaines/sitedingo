'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Trash2, Link2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';

interface Share {
  id: number;
  shareToken: string;
  shareUrl: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

interface ShareDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ projectId, isOpen, onClose }: ShareDialogProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch existing shares
  const { data: shares = [], refetch } = useQuery({
    queryKey: ['shares', projectId],
    queryFn: async () => {
      const res = await client.api.shares.projects({ id: projectId }).get();
      return res.data || [];
    },
    enabled: isOpen,
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.shares.projects({ id: projectId }).post({});
      return res.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Delete share mutation
  const deleteShareMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await client.api.shares({ token }).delete();
      return res.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Copy to clipboard
  const handleCopy = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeShares = shares.filter(share => share.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Share Project</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Generate new link button */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public Share Links</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a link to share this project with others. Anyone with the link can view it.
                </p>
              </div>
              <Button
                onClick={() => createShareMutation.mutate()}
                disabled={createShareMutation.isPending}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Link
              </Button>
            </div>

            {/* Share links list */}
            {activeShares.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No share links yet. Click "Generate Link" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {activeShares.map((share) => (
                  <div
                    key={share.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={share.shareUrl}
                            readOnly
                            className="font-mono text-xs"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(share.createdAt).toLocaleDateString()}
                          {share.expiresAt && (
                            <> • Expires {new Date(share.expiresAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(share.shareUrl, share.shareToken)}
                          className="h-8"
                        >
                          {copiedToken === share.shareToken ? (
                            <>
                              <span className="text-xs mr-1">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this share link?')) {
                              deleteShareMutation.mutate(share.shareToken);
                            }
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deleteShareMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 shrink-0">
          <p className="text-xs text-muted-foreground">
            Share links provide read-only access to your project. Anyone with the link can view it without signing in.
          </p>
        </div>
      </div>
    </div>
  );
}

