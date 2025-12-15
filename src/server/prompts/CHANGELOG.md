# Prompt System Changelog

## v2.0.0 - Corrected Architecture (Current)

### ✅ What Changed

**Fixed the variable interpolation pattern** to properly separate system and user prompts:

- **System prompts** are now loaded as static role definitions with `loadPrompt()`
- **User data** is passed dynamically via the `prompt` parameter in AI SDK calls
- Variable interpolation (`loadPromptWithVars`) is now reserved for configuration, not user data

### Updated Files

- `src/server/prompts/generate-page.ts` - Now properly separates system/user prompts
- `src/server/prompts/generate-sitemap/index.ts` - Now properly separates system/user prompts
- `src/server/prompts/generate-page/prompt.md` - Removed variable placeholders from system prompt
- `src/server/prompts/_template/` - Updated with correct usage pattern

### New Documentation

- `USAGE.md` - Quick guide with correct patterns
- `README.md` - Comprehensive documentation with best practices
- `CHANGELOG.md` - This file

## v1.0.0 - Initial Implementation (Incorrect)

### ❌ What Was Wrong

Initially tried to interpolate user data directly into system prompts using `{{variables}}`:

```typescript
// ❌ Original (incorrect) approach
const prompt = await loadPromptWithVars('prompt.md', {
  pageTitle,        // User data in system prompt
  businessDescription
});
```

**Why this was wrong:**
- Violates AI SDK's system/user prompt separation
- Inefficient token usage (can't cache system prompts)
- Harder to debug and test
- Mixes static instructions with dynamic data

### Features (Still Useful)

- ✅ Markdown-based prompts
- ✅ Frontmatter metadata
- ✅ Type-safe loading
- ✅ Caching support

## Migration Guide

If you have existing code using the old pattern:

### Before (v1.0.0)
```typescript
const prompt = await loadPromptWithVars('my-prompt.md', {
  userName: 'Alice',
  userRequest: 'something'
});

await generateText({
  prompt: prompt.content
});
```

### After (v2.0.0)
```typescript
const systemPrompt = await loadPrompt('my-prompt.md');
const userPrompt = `Name: ${userName}\nRequest: ${userRequest}`;

await generateText({
  system: systemPrompt.content,
  prompt: userPrompt
});
```

## Best Practices Going Forward

1. **System prompts**: Static, define role and instructions
2. **User prompts**: Dynamic, constructed from user input
3. **Variable interpolation**: Only for configuration/meta-prompts
4. **Test both separately**: System prompt structure and user prompt format

## Questions?

See `USAGE.md` for quick examples or `README.md` for comprehensive documentation.
