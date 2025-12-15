# AI Prompts Directory

This directory contains all AI prompt definitions for sitedingo.

## Structure

Each AI feature has its own directory:

```
prompts/
├── generate-sitemap/       # Sitemap generation from business description
│   ├── index.ts           # Exported function
│   └── prompt.md          # System prompt
├── generate-page/          # Page content generation
│   └── index.ts           # Function with inline prompt
└── README.md              # This file
```

## Adding a New Prompt

### 1. Create Directory

```bash
mkdir src/server/prompts/my-feature
```

### 2. Define Schema

Create a Zod schema with detailed descriptions:

```typescript
// src/server/prompts/my-feature/index.ts
import z from "zod";

const mySchema = z.object({
  field: z.string().describe("Clear description of what this field contains"),
});
```

### 3. Write System Prompt

For complex prompts, use a markdown file:

```markdown
<!-- src/server/prompts/my-feature/prompt.md -->
# Role

You are a [specific role]...

## Objectives

1. Primary goal
2. Secondary goal
```

### 4. Export Function

```typescript
import { generateObject } from "ai";
import { readFileSync } from "fs";
import path from "path";

const systemPrompt = readFileSync(
  path.join(__dirname, "prompt.md"),
  "utf-8"
);

export async function generateMyFeature(input: string) {
  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    system: systemPrompt,
    prompt: input,
    schema: mySchema,
  });
  return result;
}
```

## Current Features

### generate-sitemap

**Purpose**: Generate a hierarchical sitemap from a business description

**Input**: Business description text + optional page count

**Output**: Array of pages with slugs, names, sections, and children

**Model**: `gemini-2.5-flash` (fast, structured output)

### generate-page

**Purpose**: Generate content for a specific page

**Input**: Page title + business description

**Output**: Page title, description, and sections array

**Model**: `gemini-2.5-pro` (needs creativity for content)

## Best Practices

1. **Use structured output** - Always use `generateObject()` with Zod schemas
2. **Document schemas** - Add `.describe()` to every schema field
3. **Test across domains** - Verify with different business types
4. **Keep prompts focused** - One clear task per prompt
5. **Version prompts** - Use markdown files for visibility in git

## Testing

When modifying prompts, test with diverse inputs:

```typescript
// Test cases to cover
const testCases = [
  "Local plumber in Sydney",
  "Artisan coffee roastery with online shop",
  "Freelance UX designer portfolio",
  "Community nonprofit helping homeless youth",
  "Italian restaurant with catering services",
];
```

## Related Docs

- `/docs/prompt-guidelines.md` - Detailed prompt engineering standards
- `/docs/prompt-experiments.md` - Experiment tracking
- `/AGENTS.md` - AI agent instructions
