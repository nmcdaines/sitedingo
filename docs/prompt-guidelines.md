# Prompt Engineering Guidelines

This document outlines best practices for writing and maintaining AI prompts in openbiz.

## Core Principles

### 1. Domain-Aware Generation

Our AI generates content for diverse business types. Prompts must:

- **Identify the business domain** before generating content
- **Use domain-specific language** (menu vs products, book a table vs contact)
- **Consider the customer journey** for that specific business

### 2. Structured Over Free-Form

Always prefer structured output:

```typescript
// ✅ Good - Structured with schema
const result = await generateObject({
  model: "google/gemini-2.5-flash",
  schema: pageSchema,
  prompt: userPrompt,
});

// ❌ Avoid - Free-form text that needs parsing
const result = await generateText({
  model: "google/gemini-2.5-flash",
  prompt: "Generate a sitemap as JSON...",
});
```

### 3. Schema as Documentation

Zod schemas serve as documentation for the AI. Use `.describe()` extensively:

```typescript
// ✅ Good - Self-documenting schema
const pageSchema = z.object({
  slug: z.string().describe(
    'URL path starting with "/" using lowercase and hyphens (e.g., "/about-us")'
  ),
  sections: z.array(z.string()).describe(
    "Content section titles in display order"
  ),
});

// ❌ Poor - AI has to guess intent
const pageSchema = z.object({
  slug: z.string(),
  sections: z.array(z.string()),
});
```

## Prompt Structure

### System Prompts

System prompts should follow this structure:

```markdown
# Role Definition
You are a [specific role] specializing in [domain].

## Objectives
1. Primary goal
2. Secondary goals

## Domain Knowledge
- Specific knowledge the AI needs
- Domain-specific terminology
- Business type variations

## Output Guidelines
- Format expectations
- Quality criteria
- Constraints

## What NOT to Do
- Common mistakes to avoid
- Edge cases to handle
```

### User Prompts

Keep user prompts simple and focused:

```typescript
// ✅ Good - Clear, structured input
const userPrompt = `
Business: ${businessName}
Type: ${businessType}
Description: ${description}
`.trim();

// ❌ Poor - Ambiguous, unstructured
const userPrompt = description;
```

## Prompt Files Organization

### When to Use Markdown Files

Use separate `.md` files when:

- Prompt exceeds 20 lines
- Contains examples or complex formatting
- Needs version control visibility
- Will be iterated on frequently

### File Structure

```
src/server/prompts/
├── feature-name/
│   ├── index.ts          # Export function
│   ├── prompt.md         # System prompt
│   ├── schema.ts         # Zod schema (if complex)
│   └── examples.md       # Few-shot examples (if needed)
```

## Few-Shot Examples

### When to Use

- Output format is complex or unusual
- Domain has specific conventions
- Quality varies without examples

### Best Practices

```markdown
## Examples

### Example 1: Cafe Website
Input: "Cozy neighborhood cafe with specialty coffee and pastries"
Output structure:
- Homepage
- Menu (Food, Drinks, Specials)
- About Us
- Location & Hours
- Contact

### Example 2: Plumber
Input: "Emergency plumbing services in Melbourne"
Output structure:
- Homepage
- Services (Emergency, Residential, Commercial)
- Service Areas
- Get a Quote
- About
- Contact
```

### Anti-Patterns

```markdown
// ❌ Don't - Overly specific examples that bias output
## Example
Input: "Any business"
Output: Always include Blog, Newsletter, FAQ, Testimonials...
```

## Model Selection

| Task Type | Recommended Model | Reasoning |
|-----------|------------------|-----------|
| Simple classification | `gemini-2.5-flash` | Fast, cost-effective |
| Sitemap generation | `gemini-2.5-flash` | Structured, bounded output |
| Content generation | `gemini-2.5-pro` | Needs creativity, nuance |
| Complex reasoning | `gemini-2.5-pro` | Multi-step logic |

## Iteration Process

### 1. Document Experiments

Before modifying prompts, document in `docs/prompt-experiments.md`:

```markdown
## Experiment: [Feature] - [Date]

### Hypothesis
What change might improve output?

### Change
What specifically was modified?

### Results
- Test case 1: [result]
- Test case 2: [result]

### Decision
Keep / Revert / Iterate
```

### 2. Test Across Domains

Always test prompts with multiple business types:

- [ ] Local service (plumber, cleaner)
- [ ] Retail (clothing, bookshop)
- [ ] Hospitality (cafe, restaurant)
- [ ] Professional (agency, consultant)
- [ ] Creative (portfolio, freelancer)
- [ ] Nonprofit (charity, community)

### 3. Version Control

- Commit prompt changes separately from code changes
- Use descriptive commit messages: `prompt(sitemap): add domain detection for nonprofits`

## Common Patterns

### Domain Detection

```markdown
## Your Objectives

1. **Identify the Business Type**: Determine what kind of site this is:
   - Local service (tradie, cleaner, etc.)
   - Retail/e-commerce
   - Hospitality (cafe, restaurant)
   - Professional services
   - Portfolio/creative
   - Nonprofit/community
   
2. **Tailor Output**: Use domain-specific terminology and structure
```

### Constraint Setting

```markdown
## Constraints

- Generate 5-9 pages unless user specifies otherwise
- Maximum 3 levels of hierarchy
- Use specific page names over generic ones
- Homepage is always the root
```

### Negative Constraints

```markdown
## What NOT to Include

- Don't add meta-commentary in responses
- Don't include legal pages unless requested
- Don't use generic page names when specific ones fit better
- Don't over-complicate simple business sites
```

## Troubleshooting

### Output Too Generic

**Symptom**: All businesses get similar sitemaps
**Fix**: Add domain detection and domain-specific examples

### Output Too Verbose

**Symptom**: AI adds unnecessary explanation
**Fix**: Add "Don't include meta-commentary" constraint

### Inconsistent Format

**Symptom**: Output structure varies
**Fix**: Use structured output with detailed schema descriptions

### Missing Edge Cases

**Symptom**: Fails on unusual business types
**Fix**: Add examples for edge cases, expand domain knowledge section
