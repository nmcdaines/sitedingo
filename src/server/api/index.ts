import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

import { ProjectController } from './projects';
import { PagesController } from './pages';
import { SectionsController } from './sections';
import { SharesController, PublicSharesController } from './shares';

import { generateAiSitemap } from '../prompts/generate-sitemap';
import { generateAiPage } from '../prompts/generate-page';

let prompt = ''

prompt = `Finn and Co is a cozy cafe in the heart of the blue mountains. They produce their own bread and source ingredients locally. Please generate a sitemap.`
// prompt = `I'd like you to generate a sitemap for a personal resume site.`
// prompt = `A small book store in the Blue Mountains. Has a relatively relaxed and chill vibe. We sell both books and board games.`
// prompt = `A small book store in the Blue Mountains. Has a relatively relaxed and chill vibe.`
// prompt = `We are a small and modern marketing agency with a big heart. We do a lot of social media advertising as-well website design and development. We've worked on world class websites for the likes of the Olympics, Microsoft, etc`
// prompt = `We are a manufacturer of womans clothing. We have world class designers on our team. Goals: The site must include a store.`
// prompt = 'Gretta is a boutique Architectural firm based in Los Angeles that focuses on homes as well as smaller commercial and community projects.'


const app = new Elysia({ prefix: "/api" })
  .use(openapi({
    path: '/docs',
    documentation: {
      info: {
        title: "SiteDingo API",
        version: "1.0.0",
      }
    }
  }))
  .use(ProjectController)
  .use(PagesController)
  .use(SectionsController)
  .use(PublicSharesController) // Register public routes first to avoid conflicts
  .use(SharesController)
  .get("", () => "SiteDingo API")
  .get("/sitemap", async () => {
    const result = await generateAiSitemap(prompt);
    return JSON.stringify(result.object || '', null, 2)
  })
  .get("/page", async () => {
    try {
      const result = await generateAiPage('Our Story', prompt)
      return JSON.stringify(result.object || '', null, 2)
    } catch (error) {
      console.error('API Error generating page:', error)
      return JSON.stringify({
        error: 'Failed to generate page',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, null, 2)
    }
  })

export default app;

export type App = typeof app;
