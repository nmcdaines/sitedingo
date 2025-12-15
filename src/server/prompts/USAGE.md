# Prompt System Usage Guide

## TL;DR

✅ **Load static system prompts** with `loadPrompt()`  
✅ **Pass dynamic data** via the `prompt` parameter  
❌ **Don't interpolate user data** into system prompts

## The Correct Pattern

### 1. Create a System Prompt (Static)

```markdown
---
model: google/gemini-2.5-pro
maxTokens: 4000
---

# Content Generator

You are a professional content writer.

When given a topic and target audience, create engaging content that:
- Matches the audience's knowledge level
- Uses appropriate tone and style
- Includes relevant examples
- Has clear structure
```

### 2. Use It in Code (Dynamic)

```typescript
import { loadPrompt } from '@/server/prompts';
import { generateText } from 'ai';

async function generateContent(topic: string, audience: string) {
  // Load static system prompt
  const systemPrompt = await loadPrompt('content-generator/prompt.md');
  
  // Construct dynamic user prompt
  const userPrompt = `
Topic: ${topic}
Target Audience: ${audience}
  `.trim();
  
  // Generate with AI SDK
  const result = await generateText({
    model: systemPrompt.metadata.model,
    system: systemPrompt.content,  // Static role/instructions
    prompt: userPrompt,             // Dynamic user data
    maxTokens: systemPrompt.metadata.maxTokens,
  });
  
  return result.text;
}
```

## Why This Pattern?

The AI SDK distinguishes between:
- **System messages**: Define the AI's role, behavior, and instructions (should be static)
- **User messages**: Contain the actual request with dynamic data

This separation is intentional and follows best practices for:
- **Token efficiency**: System prompts can be cached
- **Prompt engineering**: Easier to test and iterate on static instructions
- **Security**: Dynamic user input doesn't pollute system instructions

## When to Use Variable Interpolation

The `loadPromptWithVars()` function is still useful for:

### ✅ Configuration-based Prompts

```typescript
// Different system prompts based on configuration
const systemPrompt = await loadPromptWithVars('configurable.md', {
  role: 'technical writer',
  specialty: 'API documentation',
  outputFormat: 'markdown'
});
```

### ✅ Multi-tenant Systems

```typescript
// Different instructions per tenant/client
const systemPrompt = await loadPromptWithVars('branded-writer.md', {
  brandName: tenant.brandName,
  brandVoice: tenant.voiceGuidelines,
  restrictions: tenant.contentPolicy
});
```

### ❌ Not for User Requests

```typescript
// Don't do this
const prompt = await loadPromptWithVars('generator.md', {
  userInput: request.body.text,  // ❌ This is user data
  userTopic: request.query.topic // ❌ This should go in user prompt
});
```

## Real Examples from This Project

### generate-sitemap

```typescript
// ✅ Correct implementation
export async function generateAiSitemap(userPrompt: string, pagesCount: string) {
  const systemPrompt = await loadPrompt('generate-sitemap/prompt.md');
  
  const userRequest = `
Please generate ${pagesCount} pages.
${userPrompt}
  `.trim();
  
  return await generateObject({
    model: systemPrompt.metadata.model,
    system: systemPrompt.content,  // Role definition
    prompt: userRequest,            // User's business description
    schema: sitemapSchema,
  });
}
```

### generate-page

```typescript
// ✅ Correct implementation
export async function generateAiPage(pageTitle: string, businessDescription: string) {
  const systemPrompt = await loadPrompt('generate-page/prompt.md');
  
  const userRequest = `
Page Title: ${pageTitle}
Business Description: ${businessDescription}
  `.trim();
  
  return await generateObject({
    model: systemPrompt.metadata.model,
    system: systemPrompt.content,  // Instructions
    prompt: userRequest,            // Specific page request
    schema: pageSchema,
  });
}
```

## Quick Reference

| Use Case | Function | Example |
|----------|----------|---------|
| Static system prompts | `loadPrompt()` | Role definitions, instructions |
| Configuration prompts | `loadPromptWithVars()` | Tenant-specific, environment-based |
| User requests | String concatenation | Dynamic data, user input |

## Summary

1. **System prompts** = Static markdown files (use `loadPrompt()`)
2. **User prompts** = Dynamic strings constructed in code
3. **Variable interpolation** = For configuration, not user data

This pattern keeps your prompts maintainable, testable, and efficient! 🚀
