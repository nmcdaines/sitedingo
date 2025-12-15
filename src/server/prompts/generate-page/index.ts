import { generateObject } from "ai";
import { loadPrompt, formatUserPrompt } from "@/lib/prompts";
import { models, tokenLimits } from "../models";
import { pageContentSchema, type PageContent } from "./schema";

// Load system prompt from markdown file
const systemPrompt = loadPrompt("generate-page/prompt.md");

export interface GeneratePageInput {
  /** The page title/name (e.g., "About Us", "Our Services") */
  pageTitle: string;
  /** Description of the business/website */
  businessDescription: string;
  /** Optional: specific sections to include */
  requestedSections?: string[];
  /** Optional: tone/style preference */
  tone?: string;
  /** Optional: target audience */
  audience?: string;
}

export interface GeneratePageResult {
  page: PageContent;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate content for a specific page.
 *
 * @example
 * ```ts
 * const result = await generatePageContent({
 *   pageTitle: "About Us",
 *   businessDescription: "Family-owned Italian restaurant in Melbourne",
 *   tone: "warm and welcoming",
 * });
 * console.log(result.page.sections);
 * ```
 */
export async function generatePageContent(
  input: GeneratePageInput
): Promise<GeneratePageResult> {
  const {
    pageTitle,
    businessDescription,
    requestedSections,
    tone,
    audience,
  } = input;

  const userPrompt = formatUserPrompt({
    "Page": pageTitle,
    "Business": businessDescription,
    ...(requestedSections && {
      "Include Sections": requestedSections.join(", "),
    }),
    ...(tone && { "Tone": tone }),
    ...(audience && { "Target Audience": audience }),
  });

  const result = await generateObject({
    model: models.capable,
    system: systemPrompt,
    prompt: userPrompt,
    schema: pageContentSchema,
    maxOutputTokens: tokenLimits.pageContent,
  });

  return {
    page: result.object,
    usage: {
      promptTokens: result.usage?.promptTokens ?? 0,
      completionTokens: result.usage?.completionTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    },
  };
}

// Legacy export for backwards compatibility
export const generateAiPage = async (
  pageTitle: string,
  description: string
) => {
  const result = await generatePageContent({
    pageTitle,
    businessDescription: description,
  });
  return { object: result.page };
};

// Re-export types
export type { PageContent, Section } from "./schema";
