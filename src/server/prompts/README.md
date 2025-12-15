# AI Prompts Directory

This directory contains all AI prompt definitions for sitedingo.

## Structure

```
prompts/
├── generate-sitemap/       # Sitemap generation
│   ├── index.ts           # Exported function
│   ├── schema.ts          # Zod schema + types
│   └── prompt.md          # System prompt
├── generate-page/          # Page content generation
│   ├── index.ts           # Exported function
│   ├── schema.ts          # Zod schema + types
│   └── prompt.md          # System prompt
├── shared/                 # Reusable prompt components
│   ├── business-types.md  # Business domain reference
│   └── output-rules.md    # Common output constraints
├── models.ts              # Model configuration
└── README.md              # This file
```

## Quick Start: Adding a New Prompt

### 1. Create Directory Structure

```bash
mkdir src/server/prompts/my-feature
touch src/server/prompts/my-feature/{index.ts,schema.ts,prompt.md}
```

### 2. Define Schema (`schema.ts`)

```typescript
import z from "zod";

// Always use .describe() on every field
export const mySchema = z.object({
  field: z.string().describe("Clear description for the AI"),
  items: z.array(
    z.object({
      name: z.string().describe("What this represents"),
    })
  ).describe("Collection of items"),
});

// Export inferred types for use in app code
export type MyOutput = z.infer<typeof mySchema>;
```

### 3. Write System Prompt (`prompt.md`)

```markdown
# Role Definition

You are a [specific role] specializing in [domain].

## Objectives

1. Primary goal
2. Secondary goal

## Domain Knowledge

- Key context the AI needs
- Domain-specific terminology

## Output Guidelines

- Format expectations
- Quality criteria

## What NOT to Do

- Common mistakes to avoid
```

### 4. Export Function (`index.ts`)

```typescript
import { generateObject } from "ai";
import { loadPrompt, formatUserPrompt } from "@/lib/prompts";
import { models, tokenLimits } from "../models";
import { mySchema, type MyOutput } from "./schema";

const systemPrompt = loadPrompt("my-feature/prompt.md");

export interface MyFeatureInput {
  description: string;
  // ... other inputs
}

export interface MyFeatureResult {
  output: MyOutput;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function generateMyFeature(
  input: MyFeatureInput
): Promise<MyFeatureResult> {
  const userPrompt = formatUserPrompt({
    "Description": input.description,
  });

  const result = await generateObject({
    model: models.fast, // or models.capable
    system: systemPrompt,
    prompt: userPrompt,
    schema: mySchema,
    maxOutputTokens: tokenLimits.sitemap,
  });

  return {
    output: result.object,
    usage: {
      promptTokens: result.usage?.promptTokens ?? 0,
      completionTokens: result.usage?.completionTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    },
  };
}
```

## Utilities

### `loadPrompt(path)`

Load a markdown prompt file:

```typescript
import { loadPrompt } from "@/lib/prompts";

const systemPrompt = loadPrompt("generate-sitemap/prompt.md");
```

### `loadPromptWithVariables(path, vars)`

Load prompt with `{{variable}}` replacement:

```typescript
import { loadPromptWithVariables } from "@/lib/prompts";

// prompt.md: "Generate {{count}} pages for {{type}}"
const prompt = loadPromptWithVariables("feature/prompt.md", {
  count: "5",
  type: "restaurant",
});
```

### `formatUserPrompt(sections)`

Create consistent user prompts:

```typescript
import { formatUserPrompt } from "@/lib/prompts";

const userPrompt = formatUserPrompt({
  "Business": "Coffee shop in Melbourne",
  "Pages": "5-7",
});
// Output:
// Business: Coffee shop in Melbourne
// Pages: 5-7
```

### `composePrompt(sections)`

Combine multiple prompt files:

```typescript
import { composePrompt, loadPrompt } from "@/lib/prompts";

const systemPrompt = composePrompt([
  loadPrompt("shared/business-types.md"),
  loadPrompt("generate-sitemap/prompt.md"),
]);
```

## Current Features

### generate-sitemap

| Property | Value |
|----------|-------|
| Purpose | Generate hierarchical sitemap from business description |
| Model | `gemini-2.5-flash` (fast, structured) |
| Input | Business description, page count, optional hints |
| Output | Array of pages with slugs, sections, children |

### generate-page

| Property | Value |
|----------|-------|
| Purpose | Generate content sections for a page |
| Model | `gemini-2.5-pro` (creative, nuanced) |
| Input | Page title, business description, optional tone |
| Output | Title, meta description, content sections |

## Model Selection

Defined in `models.ts`:

| Model | Use Case |
|-------|----------|
| `models.fast` | Structured output, classification, simple tasks |
| `models.capable` | Content generation, creative tasks |
| `models.advanced` | Complex reasoning (currently same as capable) |

## Best Practices

### Schema Design

1. **Use `.describe()` on every field** - This is documentation for the AI
2. **Be specific about formats** - "URL starting with /" not just "URL"
3. **Use enums for constrained values** - Helps AI pick valid options
4. **Export types** - Use `z.infer<>` for type safety in app code

### Prompt Writing

1. **Start with role definition** - "You are a..."
2. **List clear objectives** - What should the AI accomplish?
3. **Include domain knowledge** - Business types, terminology
4. **Add negative constraints** - "What NOT to do" section
5. **Keep prompts focused** - One task per prompt

### Code Organization

1. **Separate schema from function** - Reusability and clarity
2. **Use shared prompt components** - DRY for common sections
3. **Return usage stats** - Track token consumption
4. **Provide typed interfaces** - Input and output types

## Testing Prompts

Test with diverse business types:

```typescript
const testCases = [
  { description: "Local plumber in Sydney", type: "tradie" },
  { description: "Artisan coffee roastery", type: "hospitality" },
  { description: "Freelance UX designer", type: "portfolio" },
  { description: "Youth homeless charity", type: "nonprofit" },
  { description: "Italian restaurant with catering", type: "hospitality" },
  { description: "B2B SaaS analytics platform", type: "saas" },
];
```

## Related Docs

- `/docs/prompt-guidelines.md` - Detailed prompt engineering standards
- `/docs/prompt-experiments.md` - Experiment tracking
- `/AGENTS.md` - AI agent instructions
