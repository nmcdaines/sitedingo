# AGENTS.md - AI Agent Instructions for openbiz

This document provides context and instructions for AI agents (Cursor, Copilot, Claude, etc.) working on this codebase.

## Project Overview

**openbiz** is a SaaS tool similar to relume.io - an AI-powered sitemap and page structure/content builder. Users describe their business, and the AI generates:

1. **Sitemaps** - Hierarchical page structures tailored to business type
2. **Page Content** - Section-by-section content for each page

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| AI | Vercel AI SDK (`ai` package), OpenAI-compatible providers |
| Database | Drizzle ORM, PostgreSQL |
| API | Elysia (lightweight API layer) |
| Auth | Clerk |
| Validation | Zod 4 |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Elysia proxy)
│   └── design/            # UI/design system pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── db/                    # Database layer
│   ├── schema.ts         # Drizzle schema definitions
│   ├── relations.ts      # Table relationships
│   └── types.ts          # Custom DB types
├── lib/                   # Shared utilities
├── server/               # Server-side logic
│   ├── api/              # Elysia API handlers
│   └── prompts/          # AI prompt definitions
└── proxy.ts              # Elysia proxy setup
```

## AI/Prompt Architecture

### Directory: `src/server/prompts/`

Each AI feature has its own directory with:

- `index.ts` - Function that calls the AI model
- `prompt.md` - System prompt in markdown (for complex prompts)
- Inline prompts for simpler cases

### Prompt Patterns

1. **Structured Output**: Always use `generateObject()` with Zod schemas
2. **Model Selection**: Use appropriate models for task complexity
   - `gemini-2.5-flash` - Fast, simple tasks (sitemap generation)
   - `gemini-2.5-pro` - Complex reasoning (page content)
3. **Schema Documentation**: Use `.describe()` on Zod fields for better AI understanding

### Example Prompt Structure

```typescript
import { generateObject } from "ai";
import z from "zod";

const schema = z.object({
  field: z.string().describe("Clear description for the AI"),
});

export async function generateFeature(input: string) {
  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    system: systemPrompt,
    prompt: userPrompt,
    schema,
  });
  return result;
}
```

## Coding Conventions

### General

- **File/folder names**: Use kebab-case (`generate-sitemap/`, `page-builder.ts`)
- **TypeScript**: Strict mode, prefer type inference where clear
- **Imports**: Use `@/` path alias for src directory

### Components

- Use shadcn/ui components from `@/components/ui/`
- Add new components via `bun run add-component <name>`
- Follow shadcn patterns for customization

### Database

- Schema in `src/db/schema.ts`
- Use Drizzle's type-safe query builder
- Migrations via `drizzle-kit`

## When Working on Prompts

### DO

- Keep system prompts focused and specific to the task
- Use markdown files for prompts > 20 lines
- Add detailed `.describe()` annotations to Zod schemas
- Test with diverse business types (cafe, tradie, SaaS, nonprofit)
- Consider the business domain when generating content
- Use structured output over free-form text

### DON'T

- Don't make prompts overly generic
- Don't include examples that bias output too strongly
- Don't forget edge cases (single-page sites, complex hierarchies)
- Don't hardcode business-specific assumptions

## Testing Prompts

When modifying prompts, test with these business types:

1. **Local service** (plumber, electrician)
2. **Retail/e-commerce** (clothing store, bookshop)
3. **Hospitality** (cafe, restaurant)
4. **Professional services** (agency, consultancy)
5. **Portfolio/personal** (designer, developer)
6. **Nonprofit** (charity, community org)

## Common Tasks

### Adding a New AI Feature

1. Create directory in `src/server/prompts/<feature-name>/`
2. Define Zod schema with `.describe()` annotations
3. Write system prompt (markdown for complex, inline for simple)
4. Export async function using `generateObject()` or `generateText()`
5. Wire up to API in `src/server/api/`

### Modifying Existing Prompts

1. Read the full existing prompt and schema
2. Understand the business context and edge cases
3. Make focused changes, test across business types
4. Update prompt experiments doc if significant

## Related Documentation

- `docs/prompt-experiments.md` - Prompt iteration notes and experiments
- `docs/prompt-guidelines.md` - Detailed prompt engineering standards
- `src/server/prompts/README.md` - Prompts directory documentation
