# openbiz Architecture

## Overview

openbiz is an AI-powered sitemap and page structure builder. Users describe their business and receive:

1. **Generated Sitemap** - Hierarchical page structure tailored to business type
2. **Page Content** - Section-by-section content for each page

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Next.js    │  │  React 19   │  │  AI SDK React Hooks     │  │
│  │  App Router │  │  Components │  │  (useChat, useObject)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Elysia API (src/server/api/)                               ││
│  │  - Type-safe endpoints                                       ││
│  │  - OpenAPI documentation                                     ││
│  │  - Request validation                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     AI Generation       │     │      Database           │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │  Vercel AI SDK    │  │     │  │  Drizzle ORM      │  │
│  │  - generateObject │  │     │  │  - Type-safe      │  │
│  │  - generateText   │  │     │  │  - Migrations     │  │
│  └───────────────────┘  │     │  └───────────────────┘  │
│           │             │     │           │             │
│           ▼             │     │           ▼             │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │  LLM Providers    │  │     │  │  PostgreSQL       │  │
│  │  - Gemini         │  │     │  └───────────────────┘  │
│  │  - OpenAI         │  │     │                         │
│  └───────────────────┘  │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

## Core Components

### Frontend

| Component | Purpose |
|-----------|---------|
| Next.js App Router | Page routing, SSR, API routes |
| React 19 | UI components with latest features |
| Tailwind CSS 4 | Styling with new CSS-first config |
| shadcn/ui | Pre-built accessible components |
| AI SDK React | `useChat`, `useObject` hooks for streaming |

### Backend

| Component | Purpose |
|-----------|---------|
| Elysia | Lightweight, type-safe API framework |
| Vercel AI SDK | Unified interface to LLM providers |
| Drizzle ORM | Type-safe database access |
| Clerk | Authentication and user management |

### AI Layer

| Component | Purpose |
|-----------|---------|
| Prompts (`src/server/prompts/`) | AI prompt definitions |
| Zod Schemas | Structured output validation |
| Model Router | Select appropriate model for task |

## Data Flow

### Sitemap Generation

```
1. User enters business description
2. Client calls API: POST /api/sitemap/generate
3. API invokes generateAiSitemap()
4. AI SDK calls Gemini with structured output schema
5. Response validated against Zod schema
6. Sitemap returned to client
7. Client renders interactive sitemap editor
```

### Page Content Generation

```
1. User selects page from sitemap
2. Client calls API: POST /api/page/generate
3. API invokes generateAiPage()
4. AI SDK calls Gemini Pro for content
5. Response validated against page schema
6. Page content returned to client
7. Client renders page preview/editor
```

## AI Prompt Architecture

### Directory Structure

```
src/server/prompts/
├── generate-sitemap/
│   ├── index.ts        # Export function
│   └── prompt.md       # System prompt
├── generate-page/
│   └── index.ts        # Function with inline prompt
└── [future-feature]/
    ├── index.ts
    ├── prompt.md
    └── schema.ts       # Complex schemas
```

### Prompt Pattern

```typescript
// Standard pattern for all AI features
import { generateObject } from "ai";
import z from "zod";

const schema = z.object({
  // Schema with .describe() annotations
});

export async function generateFeature(input: Input) {
  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    system: systemPrompt,
    prompt: formatUserPrompt(input),
    schema,
  });
  return result;
}
```

## Database Schema

### Current Tables

```typescript
// organizations - Multi-tenant support
organizations {
  id: integer (PK, auto-increment)
  name: varchar
}

// Future tables (planned)
// - projects: User projects containing sitemaps
// - sitemaps: Generated sitemap structures
// - pages: Individual page content
// - generations: AI generation history
```

## Authentication

Clerk handles:
- User sign-up/sign-in
- Session management
- Organization/team support
- Middleware protection

## API Design

### Elysia Routes

```typescript
// src/server/api/index.ts
app
  .post("/sitemap/generate", generateSitemapHandler)
  .post("/page/generate", generatePageHandler)
  .get("/projects", listProjectsHandler)
  // ...
```

### OpenAPI

Elysia auto-generates OpenAPI docs via `@elysiajs/openapi`.

## Deployment Considerations

### Environment Variables

```env
# AI
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Database
DATABASE_URL=

# Auth
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

### Model Costs

| Model | Use Case | Relative Cost |
|-------|----------|---------------|
| gemini-2.5-flash | Sitemap generation | Low |
| gemini-2.5-pro | Content generation | Medium |

## Future Architecture

### Planned Features

1. **Streaming Generation** - Real-time sitemap/content generation
2. **Wireframe Generation** - Visual page layouts
3. **Export Formats** - Figma, code, CMS
4. **Template Library** - Pre-built industry templates
5. **Collaboration** - Team editing, comments

### Scaling Considerations

- Edge caching for static content
- Queue system for long-running generations
- Rate limiting per user/organization
- Model fallback chain for reliability
