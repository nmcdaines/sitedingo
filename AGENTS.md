# AGENTS.md - AI Agent Instructions for sitedingo

This document provides context and instructions for AI agents (Cursor, Copilot, Claude, etc.) working on this codebase.

## Project Overview

**sitedingo** is a SaaS tool similar to relume.io - an AI-powered sitemap and page structure/content builder. Users describe their business, and the AI generates:

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

```
prompts/
├── feature-name/
│   ├── index.ts      # Export function with typed input/output
│   ├── schema.ts     # Zod schema + exported types
│   └── prompt.md     # System prompt in markdown
├── shared/           # Reusable prompt components
│   ├── business-types.md
│   └── output-rules.md
└── models.ts         # Centralized model configuration
```

### Utilities (`src/lib/prompts.ts`)

- `loadPrompt(path)` - Load markdown prompt file
- `loadPromptWithVariables(path, vars)` - Load with `{{var}}` replacement
- `formatUserPrompt(sections)` - Create consistent user prompts
- `composePrompt(sections)` - Combine multiple prompt files

### Prompt Patterns

1. **Structured Output**: Always use `generateObject()` with Zod schemas
2. **Model Selection**: Use `models.fast` or `models.capable` from `models.ts`
3. **Schema Documentation**: Use `.describe()` on every Zod field
4. **Typed Interfaces**: Export input/output types for each feature
5. **Usage Tracking**: Return token usage stats from generation functions

### Example Prompt Structure

```typescript
import { generateObject } from "ai";
import { loadPrompt, formatUserPrompt } from "@/lib/prompts";
import { models, tokenLimits } from "../models";
import { mySchema, type MyOutput } from "./schema";

const systemPrompt = loadPrompt("my-feature/prompt.md");

export interface MyFeatureInput {
  description: string;
}

export interface MyFeatureResult {
  output: MyOutput;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function generateMyFeature(input: MyFeatureInput): Promise<MyFeatureResult> {
  const userPrompt = formatUserPrompt({
    "Description": input.description,
  });

  const result = await generateObject({
    model: models.fast,
    system: systemPrompt,
    prompt: userPrompt,
    schema: mySchema,
    maxOutputTokens: tokenLimits.sitemap,
  });

  return {
    output: result.object,
    usage: { /* ... */ },
  };
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

- Use `loadPrompt()` utility to load markdown files
- Use `formatUserPrompt()` for consistent user prompt formatting
- Keep system prompts focused and specific to the task
- Add detailed `.describe()` annotations to every Zod field
- Separate schemas into `schema.ts` files with exported types
- Test with diverse business types (cafe, tradie, SaaS, nonprofit)
- Return usage stats from generation functions
- Use `models.fast` or `models.capable` from `models.ts`

### DON'T

- Don't hardcode model names - use `models.ts`
- Don't make prompts overly generic
- Don't include examples that bias output too strongly
- Don't forget edge cases (single-page sites, complex hierarchies)
- Don't hardcode business-specific assumptions
- Don't skip `.describe()` on schema fields

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

1. Create directory: `src/server/prompts/<feature-name>/`
2. Create `schema.ts` with Zod schema and exported types
3. Create `prompt.md` with system prompt
4. Create `index.ts` with:
   - Typed input/output interfaces
   - Function using `loadPrompt()` and `formatUserPrompt()`
   - Model from `models.ts`, limits from `tokenLimits`
   - Usage stats in return value
5. Wire up to API in `src/server/api/`

### Modifying Existing Prompts

1. Read the full existing prompt and schema
2. Understand the business context and edge cases
3. Make focused changes, test across business types
4. Update `docs/prompt-experiments.md` if significant

### Using Shared Prompt Components

Compose prompts from shared components:

```typescript
import { composePrompt, loadPrompt } from "@/lib/prompts";

const systemPrompt = composePrompt([
  loadPrompt("shared/business-types.md"),
  loadPrompt("my-feature/prompt.md"),
  loadPrompt("shared/output-rules.md"),
]);
```

## Related Documentation

- `docs/prompt-experiments.md` - Prompt iteration notes and experiments
- `docs/prompt-guidelines.md` - Detailed prompt engineering standards
- `src/server/prompts/README.md` - Prompts directory documentation
