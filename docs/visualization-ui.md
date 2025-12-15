# Sitemap Visualization UI

A Relume-style sitemap visualization interface for sitedingo that allows users to view and manage their project structure hierarchically.

## Features

### ✅ Implemented

- **Hierarchical Page Structure**: Display pages in a tree layout showing parent-child relationships
- **Expandable Sections**: Click to expand/collapse page sections
- **Section Details**: View section names, types, and descriptions
- **Navigation Tabs**: Switch between Sitemap, Wireframe, Style Guide, and Design views
- **Project Header**: Shows project name, collaboration features, and actions
- **Toolbar**: Quick actions for adding, duplicating, and deleting pages
- **Canvas Controls**: Zoom in, zoom out, and fit-to-view controls
- **Responsive Design**: Works on different screen sizes
- **Database Integration**: Fetches real data from PostgreSQL via Drizzle ORM

### 🚧 Future Enhancements

- **Drag & Drop**: Reorder pages and sections
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Undo/Redo**: Action history
- **Search & Filter**: Find specific pages or sections
- **Export**: Download as JSON, PDF, or images
- **Wireframe View**: Show actual page layouts
- **Style Guide View**: Display design tokens and components
- **Design View**: Full design mockups

## Component Structure

```
src/components/visualization/
├── page-card.tsx           # Individual page card with sections
├── sitemap-canvas.tsx      # Main canvas with tree layout
├── visualization-tabs.tsx  # Navigation tabs
├── project-header.tsx      # Top header with project info
├── toolbar.tsx            # Action toolbar
└── canvas-controls.tsx    # Zoom/pan controls
```

## Usage

### Basic Usage (Mock Data)

Visit `/visualize` to see the visualization with sample data:

```typescript
import { SitemapCanvas } from "@/components/visualization/sitemap-canvas";

const mockData = [
  {
    id: "home",
    name: "Home",
    slug: "/",
    sections: [...],
    children: [...]
  }
];

<SitemapCanvas pages={mockData} />
```

### With Database Integration

Visit `/visualize/[projectId]` to see real project data:

```typescript
import { getSitemapWithPages } from "@/lib/queries/sitemap-queries";

const pages = await getSitemapWithPages(sitemapId);
```

## Data Model

The visualization works with this data structure:

```typescript
interface Page {
  id: string;
  name: string;
  slug: string;
  sections: Section[];
  children?: Page[];
}

interface Section {
  id: string;
  name: string;
  componentType: string;
  description?: string;
}
```

This maps directly to the database schema:
- `teams` → `projects` → `sitemaps` → `pages` → `sections`

## Styling

The UI uses:
- **Tailwind CSS 4** for styling
- **shadcn/ui** components (Button)
- **lucide-react** for icons
- Custom color palette matching Relume's aesthetic

## Routes

- `/` - Home page with links to features
- `/visualize` - Demo with mock data
- `/visualize/[projectId]` - Real project visualization
- `/design` - AI-powered sitemap generation (existing)

## Database Queries

Key queries in `src/lib/queries/sitemap-queries.ts`:

- `getSitemapWithPages(sitemapId)` - Fetch full sitemap tree
- `getProjectSitemaps(projectId)` - List all sitemaps for a project
- `getActiveSitemap(projectId)` - Get the currently active sitemap

## Examples

### Architectural Firm (Gretta)

The mock data demonstrates a typical architectural firm website with:
- **Home page**: Hero, portfolio, team, testimonials, CTA
- **About page**: Company information, contact
- **Portfolio page**: Project showcases
- **Contact page**: Contact form

### Customization

To customize the appearance:

1. **Colors**: Edit Tailwind classes in components
2. **Layout**: Modify `SitemapCanvas` grid columns
3. **Card Style**: Update `PageCard` component
4. **Connectors**: Adjust connecting lines in canvas

## Performance

- Uses React Server Components for data fetching
- Client components only where interactivity is needed
- Optimized with proper key props and memoization
- Scales to hundreds of pages (tree structure prevents deep nesting issues)

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management for expand/collapse

## Browser Support

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
