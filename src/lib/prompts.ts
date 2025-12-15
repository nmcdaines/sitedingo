import { readFileSync } from "fs";
import path from "path";

/**
 * Load a markdown prompt file from the prompts directory.
 *
 * @param promptPath - Path relative to src/server/prompts/ (e.g., "generate-sitemap/prompt.md")
 * @returns The prompt content as a string
 *
 * @example
 * ```ts
 * const systemPrompt = loadPrompt("generate-sitemap/prompt.md");
 * ```
 */
export function loadPrompt(promptPath: string): string {
  const fullPath = path.join(
    process.cwd(),
    "src/server/prompts",
    promptPath
  );
  return readFileSync(fullPath, "utf-8");
}

/**
 * Load a markdown prompt and replace template variables.
 *
 * Variables in the prompt should use {{variableName}} syntax.
 *
 * @param promptPath - Path relative to src/server/prompts/
 * @param variables - Object with variable names and values
 * @returns The prompt with variables replaced
 *
 * @example
 * ```ts
 * // In prompt.md: "Generate {{count}} pages for a {{businessType}}"
 * const prompt = loadPromptWithVariables("feature/prompt.md", {
 *   count: "5",
 *   businessType: "restaurant"
 * });
 * ```
 */
export function loadPromptWithVariables(
  promptPath: string,
  variables: Record<string, string>
): string {
  let prompt = loadPrompt(promptPath);

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }

  return prompt;
}

/**
 * Format a user prompt with labeled sections.
 *
 * Creates consistent, well-structured user prompts that are easy for the AI to parse.
 *
 * @param sections - Object with section labels and content
 * @returns Formatted prompt string
 *
 * @example
 * ```ts
 * const userPrompt = formatUserPrompt({
 *   "Business": "Coffee shop in Melbourne",
 *   "Style": "Modern and minimal",
 *   "Pages": "5-7"
 * });
 * // Returns:
 * // Business: Coffee shop in Melbourne
 * // Style: Modern and minimal
 * // Pages: 5-7
 * ```
 */
export function formatUserPrompt(
  sections: Record<string, string | number | boolean>
): string {
  return Object.entries(sections)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

/**
 * Compose multiple prompt sections into a single system prompt.
 *
 * Useful for building prompts from reusable components.
 *
 * @param sections - Array of prompt sections to join
 * @returns Combined prompt with sections separated by blank lines
 *
 * @example
 * ```ts
 * const systemPrompt = composePrompt([
 *   loadPrompt("shared/role.md"),
 *   loadPrompt("shared/business-types.md"),
 *   loadPrompt("generate-sitemap/rules.md"),
 * ]);
 * ```
 */
export function composePrompt(sections: string[]): string {
  return sections.filter(Boolean).join("\n\n");
}
