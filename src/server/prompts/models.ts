/**
 * Model configuration for AI generation tasks.
 *
 * Centralizes model selection to make it easy to:
 * - Switch providers globally
 * - Adjust for cost/quality tradeoffs
 * - A/B test different models
 */

export const models = {
  /**
   * Fast model for structured, bounded outputs.
   * Use for: sitemap generation, classification, simple transformations
   */
  fast: "google/gemini-2.5-flash",

  /**
   * Capable model for creative, nuanced outputs.
   * Use for: content generation, complex reasoning, longer outputs
   */
  capable: "google/gemini-2.5-pro",

  /**
   * Most capable model for complex tasks.
   * Use for: advanced reasoning, high-stakes generations
   */
  advanced: "google/gemini-2.5-pro",
} as const;

export type ModelKey = keyof typeof models;

/**
 * Default token limits by task type.
 * Adjust based on expected output size.
 */
export const tokenLimits = {
  sitemap: 3000,
  pageContent: 4000,
  section: 1500,
} as const;
