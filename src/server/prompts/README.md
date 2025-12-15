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

Loads a prompt and interpolates variables. **Note:** This is useful for static configurations or meta-prompts, but for AI SDK usage, you should typically keep system prompts static and pass dynamic data via the user prompt.

```typescript
// Example: Configuration-based prompts
const prompt = await loadPromptWithVars('config-template.md', {
  modelType: 'creative',
  outputFormat: 'json'
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

The system supports `{{variableName}}` syntax for variable interpolation, but **this should primarily be used for meta-prompts or configuration**, not for dynamic user data in AI SDK calls.

### ✅ Good Use Case: Configuration Templates

```markdown
---
model: {{aiModel}}
---

# {{taskType}} Generator

You are a {{role}} specializing in {{specialty}}.
```

```typescript
const prompt = await loadPromptWithVars('configurable-prompt.md', {
  aiModel: 'google/gemini-2.5-pro',
  taskType: 'Content',
  role: 'copywriter',
  specialty: 'technical documentation'
});
```

### ❌ Avoid: Dynamic User Data in System Prompts

Instead of interpolating user data into system prompts:

```typescript
// ❌ Don't do this
const prompt = await loadPromptWithVars('prompt.md', {
  userName: 'Alice',  // Dynamic user data
  userInput: request.body.text
});
```

Do this instead:

```typescript
// ✅ Do this
const systemPrompt = await loadPrompt('prompt.md');
const userPrompt = `User: ${userName}\nRequest: ${userInput}`;

await generateText({
  system: systemPrompt.content,
  prompt: userPrompt  // Dynamic data goes here
});
```

**Why?** This maintains proper separation between the AI's role definition (system) and the user's request (prompt), which is how the AI SDK is designed to work.

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
model: google/gemini-2.5-flash
description: What this prompt does
---
```

### 3. Separate System and User Prompts

Keep your system prompts focused on role and instructions, pass dynamic data via the user prompt:

```typescript
// ✅ Good: Static system prompt, dynamic user prompt
const systemPrompt = await loadPrompt('generate-content.md');
const userPrompt = `Topic: ${topic}\nAudience: ${audience}`;

await generateText({
  system: systemPrompt.content,
  prompt: userPrompt
});

// ❌ Avoid: Interpolating user data into system prompt
const prompt = await loadPromptWithVars('generate-content.md', {
  topic, audience  // Don't do this for user data
});
```

### 4. Document Expected Input Format

In your prompt, clearly describe what information you expect in the user prompt:

```markdown
## Expected Input

The user prompt should provide:
- **Topic**: The main subject to write about
- **Target Audience**: Who the content is for
- **Tone**: Desired tone (e.g., professional, casual, technical)
```

### 5. Version Control Friendly

- Keep prompts in separate files for easier diffing
- Use meaningful commit messages when changing prompts
- Consider adding a changelog for major prompt changes

### 6. Test Your Prompts

```typescript
// Create a test file for your prompt
import { loadPrompt } from '@/server/prompts/prompt-loader';

describe('User Profile Prompt', () => {
  it('should load prompt with correct metadata', async () => {
    const prompt = await loadPrompt('user-profile/prompt.md');
    
    expect(prompt.content).toBeTruthy();
    expect(prompt.metadata.model).toBe('google/gemini-2.5-pro');
    expect(prompt.metadata.maxTokens).toBe(4000);
  });

  it('should generate valid profiles', async () => {
    const systemPrompt = await loadPrompt('user-profile/prompt.md');
    const userPrompt = 'Name: Test User\nRole: Developer\nIndustry: Technology';
    
    // Test with your AI SDK calls
    // const result = await generateText({ system: systemPrompt.content, prompt: userPrompt });
    // expect(result).toBeDefined();
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
