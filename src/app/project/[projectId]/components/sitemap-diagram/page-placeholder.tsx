'use client';

import React from 'react';
import { Home, Info, Folder, Phone, FileText, ShoppingCart, Users, Settings, Mail, Calendar, Image, Music, Video, Book, Map, Heart, Star, Search, Bell, Camera, Gift, Coffee, Gamepad2, Laptop, Smartphone, Globe, Lock, Unlock, Eye, Download, Upload, Share } from "lucide-react";
import { TreeNode } from "../../lib/tree-utils";
import { cn } from '@/lib/utils';

interface PagePlaceholderProps {
  node: TreeNode;
  className?: string;
}

const pageIcons: Record<string, typeof Home> = {
  home: Home,
  info: Info,
  folder: Folder,
  phone: Phone,
  'shopping-cart': ShoppingCart,
  users: Users,
  settings: Settings,
  mail: Mail,
  calendar: Calendar,
  image: Image,
  music: Music,
  video: Video,
  book: Book,
  map: Map,
  heart: Heart,
  star: Star,
  search: Search,
  bell: Bell,
  camera: Camera,
  gift: Gift,
  coffee: Coffee,
  'gamepad-2': Gamepad2,
  laptop: Laptop,
  smartphone: Smartphone,
  globe: Globe,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  download: Download,
  upload: Upload,
  share: Share,
  // Legacy mappings for backward compatibility
  about: Info,
  portfolio: Folder,
  contact: Phone,
  default: FileText,
};

export function PagePlaceholder({ node, className }: PagePlaceholderProps) {
  // Use stored icon if available, otherwise fall back to slug-based logic
  const iconName = node.icon || (
    node.slug.toLowerCase().includes('home') ? 'home' :
    node.slug.toLowerCase().includes('about') ? 'info' :
      node.slug.toLowerCase().includes('portfolio') ? 'folder' :
        node.slug.toLowerCase().includes('contact') ? 'phone' : 'default'
  );
  const Icon = pageIcons[iconName] || pageIcons.default;

  return (
    <div className={cn("w-[280px] ml-auto mr-auto relative", className)}>
      {/* Header - placeholder style */}
      <div className="relative flex items-center justify-between mb-2 bg-primary/20 border-2 border-dashed border-primary/50 rounded py-2 px-2 shadow-sm opacity-80">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary/70" />
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-foreground/70">{node.name}</h3>
            <span className="text-xs text-muted-foreground/70">{node.slug}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

