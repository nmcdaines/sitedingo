/**
 * AI Prompt Templating System
 * 
 * This module provides a type-safe, markdown-based prompt templating system
 * with support for frontmatter metadata and variable interpolation.
 * 
 * @example Basic usage
 * ```ts
 * import { loadPrompt } from '@/server/prompts';
 * 
 * const prompt = await loadPrompt('generate-sitemap/prompt.md');
 * console.log(prompt.content);
 * ```
 * 
 * @example With variables
 * ```ts
 * import { loadPromptWithVars } from '@/server/prompts';
 * 
 * const prompt = await loadPromptWithVars('generate-page/prompt.md', {
 *   pageTitle: 'About Us',
 *   businessDescription: 'A local cafe'
 * });
 * ```
 */

export {
  loadPrompt,
  loadPromptWithVars,
  interpolate,
  preloadPrompt,
  getPromptSync,
  clearPromptCache,
  type ParsedPrompt,
  type PromptMetadata,
} from './prompt-loader';


// Re-export AI generation functions for convenience
export { generateAiPage } from './generate-page';
export { generateAiSitemap } from './generate-sitemap';
