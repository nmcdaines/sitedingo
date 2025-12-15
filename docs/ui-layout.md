# Visualization UI Layout

## Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT HEADER                                                  │
│ [Logo] Gretta Architectural Firm  [👤👤👤] [Share] [Export] [⚡] │
├─────────────────────────────────────────────────────────────────┤
│ TABS                                                            │
│ [Sitemap] [Wireframe] [Style Guide] [Design]                   │
├─────────────────────────────────────────────────────────────────┤
│ TOOLBAR                                                         │
│ [+ Add Page] [Copy] [Delete]              [Export JSON] [⚙️]    │
├─────────────────────────────────────────────────────────────────┤
│ CANVAS                                                          │
│                                                                 │
│                    ┌─────────────┐                             │
│                    │    Home     │                             │
│                    │  10 sections│                             │
│                    └──────┬──────┘                             │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐             │
│    │  About  │      │Portfolio│      │ Contact │             │
│    │3 sections│     │2 sections│     │3 sections│             │
│    └─────────┘      └─────────┘      └─────────┘             │
│                                                                 │
│                                                                 │
│                                               ┌──────┐          │
│                                               │  🔍+ │          │
│                                               │  🔍- │  CONTROLS│
│                                               │  ⊡  │          │
│                                               └──────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Project Header (`project-header.tsx`)
- Project logo and name
- Collaboration features (avatars, invite button)
- Action buttons (Share, Export, Upgrade)

### 2. Navigation Tabs (`visualization-tabs.tsx`)
- Sitemap (active)
- Wireframe (coming soon)
- Style Guide (coming soon)
- Design (coming soon)

### 3. Toolbar (`toolbar.tsx`)
- Left: Creation/editing actions
  - Add Page
  - Duplicate
  - Delete
- Right: Export and settings
  - Export JSON
  - Settings

### 4. Canvas (`sitemap-canvas.tsx`)
- Main workspace area
- Shows page hierarchy as a tree
- Connects pages with lines
- Expandable page cards showing sections

### 5. Page Cards (`page-card.tsx`)
- Page name and section count
- Expand/collapse button
- More options menu (⋯)
- Section list when expanded:
  - Section name
  - Section description
  - Visual grouping

### 6. Canvas Controls (`canvas-controls.tsx`)
- Zoom in (+)
- Zoom out (-)
- Fit to view (⊡)

## Interaction Flow

```
User visits /visualize
    ↓
Sees demo with mock data
    ↓
Clicks on page card
    ↓
Card expands showing sections
    ↓
Can navigate to /visualize/[projectId]
    ↓
Sees real data from database
```

## Page States

### Home Page (`/`)
```
┌────────────────────────────────────────┐
│ [S] sitedingo                          │
├────────────────────────────────────────┤
│                                        │
│ AI-Powered Sitemap & Page             │
│ Structure Builder                      │
│                                        │
│ ┌─────────────┐ ┌─────────────┐       │
│ │ Sitemap  →  │ │ AI Design → │       │
│ │ Visualize   │ │ Studio      │       │
│ └─────────────┘ └─────────────┘       │
│                                        │
│ ┌─────────────┐ ┌─────────────┐       │
│ │ Style Guide │ │ Code Export │       │
│ │ Coming Soon │ │ Coming Soon │       │
│ └─────────────┘ └─────────────┘       │
└────────────────────────────────────────┘
```

### Visualization Page with Data
Shows full sitemap with:
- Home page at top
- Child pages below
- Connecting lines
- Expandable sections

### Empty State
When no sitemap exists:
```
┌────────────────────────────────────────┐
│      No sitemap created yet            │
│                                        │
│  Get started by generating a sitemap   │
│  using AI or create pages manually     │
│                                        │
│  [✨ Generate with AI] [+ Create]     │
└────────────────────────────────────────┘
```

## Color Scheme

Based on Relume's aesthetic:
- **Background**: `bg-gray-50`
- **Cards**: `bg-white` with `border-gray-200`
- **Text Primary**: `text-gray-900`
- **Text Secondary**: `text-gray-600`
- **Accents**: `bg-gray-900` (buttons)
- **Hover States**: `hover:bg-gray-100`

## Typography

- **Page Names**: `font-semibold text-sm`
- **Section Names**: `font-medium text-xs`
- **Descriptions**: `text-xs text-gray-600`
- **Headers**: `text-2xl font-semibold`

## Spacing

- **Card Padding**: `p-3` to `p-6`
- **Gaps**: `gap-2` to `gap-8`
- **Border Radius**: `rounded-lg` (8px)
- **Shadows**: `shadow-sm` to `shadow-lg`

## Responsive Behavior

- Desktop: Full grid layout with multiple columns
- Tablet: Smaller grid, fewer columns
- Mobile: Single column stack (planned)

## Animation & Transitions

- Card hover: `transition-shadow`
- Button hover: `transition-colors`
- Expand/collapse: Smooth height transition
- Zoom controls: Smooth scale transition (planned)
