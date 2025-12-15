# AI Prompt Templating System

A type-safe, markdown-based prompt templating system for AI interactions.

## Features

- ✅ **Markdown-based prompts** - Easy to edit and version control
- ✅ **Frontmatter metadata** - Configure model, tokens, and other settings per prompt
- ✅ **Variable interpolation** - Type-safe variable substitution with `{{variable}}` syntax
- ✅ **Caching support** - Optional prompt preloading for performance
- ✅ **TypeScript-first** - Full type safety and IntelliSense support

## Quick Start

### 1. Create a Prompt File

Create a markdown file in `src/server/prompts/`:

```markdown
---
model: google/gemini-2.5-pro
maxTokens: 4000
temperature: 0.7
description: Generates user profiles
---

# User Profile Generator

You are an expert at creating detailed user profiles.

Generate a profile for:
- Name: {{userName}}
- Role: {{userRole}}
- Industry: {{industry}}

Create a comprehensive profile with skills, interests, and goals.
```

### 2. Load and Use the Prompt

```typescript
import { loadPromptWithVars } from '@/server/prompts/prompt-loader';
import { generateText } from 'ai';

async function generateProfile(userName: string, userRole: string, industry: string) {
  // Load prompt with type-safe variable interpolation
  const prompt = await loadPromptWithVars('user-profile/prompt.md', {
    userName,
    userRole,
    industry,
  });

  // Use the prompt with AI SDK
  const result = await generateText({
    model: prompt.metadata.model || 'google/gemini-2.5-flash',
    prompt: prompt.content,
    maxTokens: prompt.metadata.maxTokens,
    temperature: prompt.metadata.temperature,
  });

  return result;
}
```

## API Reference

### `loadPrompt(promptPath: string): Promise<ParsedPrompt>`

Loads a prompt file from the prompts directory.

```typescript
const prompt = await loadPrompt('generate-sitemap/prompt.md');
console.log(prompt.content); // The prompt text
console.log(prompt.metadata.model); // 'google/gemini-2.5-flash'
```

### `loadPromptWithVars<T>(promptPath: string, variables: T): Promise<ParsedPrompt>`

Loads a prompt and interpolates variables.

```typescript
const prompt = await loadPromptWithVars('welcome.md', {
  userName: 'Alice',
  businessType: 'cafe'
});
```

### `interpolate<T>(template: string, variables: T): string`

Interpolates variables into a template string.

```typescript
const text = interpolate(
  'Hello {{name}}, you are {{age}} years old',
  { name: 'Alice', age: 30 }
);
// Result: 'Hello Alice, you are 30 years old'
```

### `preloadPrompt(promptPath: string): Promise<void>`

Preloads a prompt into cache for synchronous access.

```typescript
// At app startup
await preloadPrompt('generate-sitemap/prompt.md');

// Later, in a hot path
const prompt = getPromptSync('generate-sitemap/prompt.md');
```

### `getPromptSync(promptPath: string): ParsedPrompt`

Gets a preloaded prompt synchronously (throws if not preloaded).

```typescript
const prompt = getPromptSync('generate-sitemap/prompt.md');
```

## Frontmatter Options

All frontmatter fields are optional:

| Field | Type | Description |
|-------|------|-------------|
| `model` | `string` | AI model to use (e.g., 'google/gemini-2.5-pro') |
| `temperature` | `number` | Temperature setting (0-1) |
| `maxTokens` | `number` | Maximum output tokens |
| `description` | `string` | Human-readable description of the prompt |

### Example Frontmatter

```yaml
---
model: google/gemini-2.5-pro
maxTokens: 4000
temperature: 0.7
description: Generates creative marketing copy
---
```

## Variable Interpolation

Use `{{variableName}}` syntax in your markdown prompts:

```markdown
---
model: google/gemini-2.5-flash
---

# Greeting Generator

Create a greeting for {{userName}} who works as a {{jobTitle}}.
The greeting should be {{tone}} in tone.
```

Then load with variables:

```typescript
const prompt = await loadPromptWithVars('greeting.md', {
  userName: 'Alice',
  jobTitle: 'Software Engineer',
  tone: 'professional'
});
```

**Important:** If a variable is missing, an error will be thrown. This ensures type safety and prevents bugs.

## File Organization

Organize prompts by feature or domain:

```
src/server/prompts/
├── README.md
├── prompt-loader.ts
├── generate-page/
│   └── prompt.md
├── generate-sitemap/
│   └── prompt.md
└── user-profile/
    └── prompt.md
```

## Best Practices

### 1. Use Descriptive Names

✅ Good: `generate-product-description.md`
❌ Bad: `prompt1.md`

### 2. Add Metadata

Always include frontmatter with at least a description:

```markdown
---
description: What this prompt does
---
```

### 3. Document Variables

In your prompt, clearly indicate what variables are needed:

```markdown
## Required Variables
- {{businessName}} - Name of the business
- {{businessType}} - Type/industry of business
- {{targetAudience}} - Primary target audience
```

### 4. Version Control Friendly

- Keep prompts in separate files for easier diffing
- Use meaningful commit messages when changing prompts
- Consider adding a changelog for major prompt changes

### 5. Test Your Prompts

```typescript
// Create a test file for your prompt
import { loadPromptWithVars } from '@/server/prompts/prompt-loader';

describe('User Profile Prompt', () => {
  it('should load and interpolate variables', async () => {
    const prompt = await loadPromptWithVars('user-profile/prompt.md', {
      userName: 'Test User',
      userRole: 'Developer',
      industry: 'Technology'
    });
    
    expect(prompt.content).toContain('Test User');
    expect(prompt.metadata.model).toBe('google/gemini-2.5-pro');
  });
});
```

## Performance Tips

### Preload Frequently Used Prompts

For prompts used in hot paths, preload them at app startup:

```typescript
// app/startup.ts
import { preloadPrompt } from '@/server/prompts/prompt-loader';

export async function initializeApp() {
  // Preload commonly used prompts
  await Promise.all([
    preloadPrompt('generate-sitemap/prompt.md'),
    preloadPrompt('generate-page/prompt.md'),
  ]);
}
```

### Use Caching for Static Prompts

If a prompt doesn't have variables and won't change during runtime, load it once and reuse:

```typescript
let cachedPrompt: ParsedPrompt | null = null;

async function getStaticPrompt() {
  if (!cachedPrompt) {
    cachedPrompt = await loadPrompt('static-prompt.md');
  }
  return cachedPrompt;
}
```

## Migration Guide

### From Inline Strings

**Before:**
```typescript
const systemPrompt = `
You are a helpful assistant.
Generate content for: ${topic}
`;
```

**After:**

1. Create `prompts/my-prompt.md`:
```markdown
---
model: google/gemini-2.5-flash
---

You are a helpful assistant.
Generate content for: {{topic}}
```

2. Update code:
```typescript
const prompt = await loadPromptWithVars('my-prompt.md', { topic });
```

### From File Paths

**Before:**
```typescript
const promptPath = path.join(process.cwd(), 'prompts', 'system.md');
const systemPrompt = await fs.readFile(promptPath, 'utf-8');
```

**After:**
```typescript
const prompt = await loadPrompt('system.md');
const systemPrompt = prompt.content;
```

## Troubleshooting

### Error: "Prompt file not found"

Make sure the path is relative to `src/server/prompts/`:

```typescript
// ✅ Correct
await loadPrompt('generate-page/prompt.md');

// ❌ Wrong
await loadPrompt('src/server/prompts/generate-page/prompt.md');
```

### Error: "Missing template variable"

Ensure all `{{variables}}` in your prompt are provided:

```typescript
// If prompt has {{userName}} and {{userRole}}
await loadPromptWithVars('prompt.md', {
  userName: 'Alice',
  userRole: 'Developer' // Don't forget this!
});
```

### Error: "Prompt not preloaded"

When using `getPromptSync()`, make sure to preload first:

```typescript
await preloadPrompt('my-prompt.md'); // Do this first
const prompt = getPromptSync('my-prompt.md'); // Then this works
```

## Examples

See the existing prompts for reference:
- [`generate-sitemap/prompt.md`](./generate-sitemap/prompt.md) - Complex prompt with detailed instructions
- [`generate-page/prompt.md`](./generate-page/prompt.md) - Prompt with variable interpolation

## Contributing

When adding new prompts:

1. Create a new directory for your prompt
2. Add a `prompt.md` file with frontmatter
3. Create a TypeScript file to use the prompt
4. Update this README if introducing new patterns
5. Test your prompt thoroughly

## License

Part of the sitedingo project.
