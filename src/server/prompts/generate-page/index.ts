import { generateObject } from "ai";
import z from 'zod'
import { loadPrompt } from '../prompt-loader';

const pageSchema = z.object({
  title: z.string().describe('The title of the page (should match the input page title)'),
  description: z.string().describe('A brief 1-2 sentence description summarizing what this page is about'),
  sections: z.array(z.object({
    type: z.enum(['hero', 'text', 'testimonials', 'contact-form', 'features', 'pricing', 'faq', 'gallery', 'cta', 'about']).describe('The type of section component (hero, text, testimonials, contact-form, features, pricing, faq, gallery, cta, about)'),
    title: z.string().describe('A clear, descriptive heading for this content section'),
    content: z.string().describe('The actual content text for this section (2-4 paragraphs of relevant, detailed information)'),
  })).describe('Array of 3-6 content sections for the page')
})

export async function generateAiPage(pageTitle: string, businessDescription: string, pageSlug?: string) {
  const systemPrompt = await loadPrompt('generate-page/prompt.md');

  const userPrompt = `
Page Title: ${pageTitle}
Page Slug: ${pageSlug || '/'}
Business Description: ${businessDescription}

Please generate complete, detailed content for this page.
  `.trim();

  try {
    const result = await generateObject({
      model: 'google/gemini-2.5-flash-lite', // systemPrompt.metadata.model || 'google/gemini-2.5-pro',
      system: systemPrompt.content,
      prompt: userPrompt,
      schema: pageSchema,
      schemaName: 'PageContent',
      schemaDescription: 'Generated page content with title, description, and content sections',
      maxOutputTokens: systemPrompt.metadata.maxTokens || 4000,
    });

    // Validate that we got sections with content
    if (!result.object.sections || result.object.sections.length === 0) {
      throw new Error('Generated page has no sections');
    }

    return result;
  } catch (error) {
    console.error('Error generating page:', error);
    console.error('Page Title:', pageTitle);
    console.error('Business Description:', businessDescription);
    throw new Error(`Failed to generate page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
