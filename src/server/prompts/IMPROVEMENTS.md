# Page Generator Improvements

## Problem

Getting error: **"No object generated: could not parse the response"**

This happens when the AI's response doesn't match the expected Zod schema structure.

## Root Causes

1. **Vague schema** - Optional fields confused the AI about what to generate
2. **Unclear prompt** - No explicit output format specified
3. **Missing descriptions** - AI SDK uses field descriptions to guide generation
4. **No error handling** - Hard to debug when things go wrong

## Solutions Implemented

### 1. Enhanced Schema with Descriptions

**Before:**
```typescript
const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(z.object({
    title: z.string().optional(),    // ❌ Optional confused AI
    content: z.string().optional(),   // ❌ Optional = sometimes empty
  }))
})
```

**After:**
```typescript
const pageSchema = z.object({
  title: z.string().describe('The title of the page (should match the input page title)'),
  description: z.string().describe('A brief 1-2 sentence description summarizing what this page is about'),
  sections: z.array(z.object({
    title: z.string().describe('A clear, descriptive heading for this content section'),
    content: z.string().describe('The actual content text for this section (2-4 paragraphs of relevant, detailed information)'),
  })).describe('Array of 3-6 content sections for the page')
})
```

**Why this helps:** The `.describe()` strings are sent to the AI to guide generation.

### 2. Improved Prompt Clarity

**Before:**
- Vague instructions
- No output format specified
- No example structure

**After:**
- Clear requirements for each field
- Explicit JSON structure example
- Minimum content requirements (2-4 paragraphs)
- Clear statement that all fields are REQUIRED

Key addition:
```markdown
## Output Format

You MUST return valid JSON with this exact structure:

{
  "title": "Page Title Here",
  "description": "Brief summary...",
  "sections": [
    {
      "title": "Section Heading",
      "content": "Full paragraph content here..."
    }
  ]
}

IMPORTANT: 
- All fields are REQUIRED
- Each section must have both title AND content
- Content should be actual paragraphs, not placeholders
```

### 3. Added JSON Mode

```typescript
const result = await generateObject({
  // ...
  mode: 'json',  // ✅ Forces proper JSON output
  schemaName: 'PageContent',
  schemaDescription: 'Generated page content with title, description, and content sections',
});
```

### 4. Better Error Handling

```typescript
try {
  const result = await generateObject({ /* ... */ });
  
  // Validate output
  if (!result.object.sections || result.object.sections.length === 0) {
    throw new Error('Generated page has no sections');
  }
  
  return result;
} catch (error) {
  console.error('Error generating page:', error);
  console.error('Page Title:', pageTitle);
  console.error('Business Description:', businessDescription);
  throw new Error(`Failed to generate page content: ${error.message}`);
}
```

### 5. API Error Handling

```typescript
.get("/page", async () => {
  try {
    const result = await generateAiPage('Our Story', prompt)
    return JSON.stringify(result.object, null, 2)
  } catch (error) {
    console.error('API Error generating page:', error)
    return JSON.stringify({
      error: 'Failed to generate page',
      message: error.message
    }, null, 2)
  }
})
```

## Testing the Fix

Try the `/api/page` endpoint again. You should now see:

✅ **Success response:**
```json
{
  "title": "Our Story",
  "description": "Learn about Finn and Co's journey...",
  "sections": [
    {
      "title": "Our Beginning",
      "content": "Finn and Co started in the heart..."
    },
    {
      "title": "Our Philosophy",
      "content": "We believe in..."
    }
  ]
}
```

❌ **If it still fails:**
```json
{
  "error": "Failed to generate page",
  "message": "Detailed error message here"
}
```

Check the console logs for more details.

## Key Takeaways

When using `generateObject()`:

1. **Always add `.describe()` to schema fields** - The AI uses these descriptions
2. **Make required fields explicit** - Optional fields can confuse the model
3. **Specify output format in prompt** - Show an example structure
4. **Use `mode: 'json'`** - Ensures proper JSON formatting
5. **Add error handling** - Makes debugging easier
6. **Validate the output** - Check critical fields exist

## Additional Improvements to Consider

If you still see issues:

1. **Add examples to prompt** - Show 1-2 example outputs
2. **Reduce complexity** - Start with fewer sections
3. **Try different model** - Some models handle structured output better
4. **Add retries** - Retry with exponential backoff
5. **Fallback schemas** - Have a simpler schema as backup

## Related Files

- `src/server/prompts/generate-page.ts` - Main generator
- `src/server/prompts/generate-page/prompt.md` - System prompt
- `src/server/api/index.ts` - API endpoint
