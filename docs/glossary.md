# Glossary

Domain-specific terminology for openbiz.

## Core Concepts

### Sitemap

A hierarchical structure of pages for a website. In openbiz, sitemaps are:
- AI-generated based on business description
- Editable by users
- Used as the foundation for page content generation

### Page

A single page in the sitemap with:
- **Slug**: URL path (e.g., `/about`, `/services/consulting`)
- **Name**: Display title for navigation
- **Sections**: Content blocks within the page
- **Children**: Nested sub-pages

### Section

A content block within a page. Represents a distinct topic or UI component area (hero, features, testimonials, etc.).

### Business Type / Domain

The category of business the website serves. Used by AI to tailor content:
- Local service (tradie, plumber, cleaner)
- Retail/e-commerce
- Hospitality (cafe, restaurant)
- Professional services (agency, consultant)
- Portfolio/creative
- Nonprofit/community

## AI Concepts

### Structured Output

AI responses that conform to a predefined schema (using Zod). Ensures consistent, parseable output rather than free-form text.

```typescript
// Structured output example
const result = await generateObject({
  schema: z.object({ title: z.string() }),
  prompt: "Generate a title",
});
// result.object.title is guaranteed to be a string
```

### System Prompt

Instructions that define the AI's role, knowledge, and constraints. Set once per feature and remain constant across user interactions.

### User Prompt

The dynamic input provided for each generation request. Contains user-specific context like business description.

### Few-Shot Examples

Example input/output pairs included in prompts to guide AI behavior. Used when output format is complex or domain-specific.

### Schema Descriptions

Documentation added to Zod schemas via `.describe()` that helps the AI understand field purposes:

```typescript
z.string().describe("URL path starting with /")
```

## Technical Terms

### Vercel AI SDK

The `ai` npm package providing unified interfaces for:
- `generateObject()` - Structured output generation
- `generateText()` - Free-form text generation
- `streamObject()` - Streaming structured output
- React hooks (`useChat`, `useObject`)

### Drizzle ORM

Type-safe database toolkit for PostgreSQL. Provides:
- Schema definition in TypeScript
- Type-safe query builder
- Migration management

### Elysia

Lightweight, type-safe API framework used for backend routes. Features:
- End-to-end type safety
- OpenAPI generation
- High performance

### shadcn/ui

Component library providing accessible, customizable UI primitives. Not a package dependency—components are copied into `src/components/ui/`.

## User Roles

### End User

Person using openbiz to generate sitemaps and content for their website.

### Organization

A team or company account that can have multiple users and projects.

### Project

A container for a single website's sitemap and generated content.

## Generation Types

### Sitemap Generation

Creating the page hierarchy from a business description. Uses faster models since output is structured and bounded.

### Page Generation

Creating content for a specific page. Uses more capable models since it requires creativity and domain understanding.

### Bulk Generation

Generating content for multiple pages in sequence or parallel.

## Output Formats (Planned)

### Wireframe

Visual representation of page layout showing section placement.

### Export

Converting generated content to external formats:
- Figma designs
- HTML/CSS code
- CMS imports (WordPress, Webflow)
