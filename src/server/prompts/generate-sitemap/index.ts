import { generateObject } from "ai";
import { loadPrompt, formatUserPrompt } from "@/lib/prompts";
import { models, tokenLimits } from "../models";
import { sitemapSchema, type Sitemap } from "./schema";

// Load system prompt from markdown file (cached at module load)
const systemPrompt = loadPrompt("generate-sitemap/prompt.md");

export interface GenerateSitemapInput {
  /** Description of the business/website */
  description: string;
  /** Target number of pages (e.g., "5-7", "3-5") */
  pagesCount?: string;
  /** Optional business type hint */
  businessType?: string;
  /** Optional tone/style preference */
  style?: string;
}

export interface GenerateSitemapResult {
  sitemap: Sitemap;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a sitemap structure from a business description.
 *
 * @example
 * ```ts
 * const result = await generateSitemap({
 *   description: "Cozy neighborhood cafe with specialty coffee",
 *   pagesCount: "5-7",
 *   businessType: "cafe",
 * });
 * console.log(result.sitemap);
 * ```
 */
export async function generateSitemap(
  input: GenerateSitemapInput
): Promise<GenerateSitemapResult> {
  const { description, pagesCount = "5-7", businessType, style } = input;

  const userPrompt = formatUserPrompt({
    "Business Description": description,
    "Target Pages": pagesCount,
    ...(businessType && { "Business Type": businessType }),
    ...(style && { "Style": style }),
  });

  const result = await generateObject({
    model: models.fast,
    system: systemPrompt,
    prompt: userPrompt,
    schema: sitemapSchema,
    maxOutputTokens: tokenLimits.sitemap,
  });

  return {
    sitemap: result.object,
    usage: {
      promptTokens: result.usage?.promptTokens ?? 0,
      completionTokens: result.usage?.completionTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    },
  };
}

// Keep legacy export for backwards compatibility
export const generateAiSitemap = async (
  prompt: string,
  pagesCount: string = "5-7"
) => {
  const result = await generateSitemap({ description: prompt, pagesCount });
  return { object: result.sitemap };
};