import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

import { generateAiSitemap } from '../prompts/generate-sitemap';
import { generateAiPage } from '../prompts/generate-page';

let prompt =''

// prompt = `Finn and Co is a cozy cafe in the heart of the blue mountains. They produce their own bread and source ingredients locally. Please generate a sitemap.`
// prompt = `I'd like you to generate a sitemap for a personal resume site.`
// prompt = `A small book store in the Blue Mountains. Has a relatively relaxed and chill vibe. We sell both books and board games.`
// prompt = `A small book store in the Blue Mountains. Has a relatively relaxed and chill vibe.`
// prompt = `We are a small and modern marketing agency with a big heart. We do a lot of social media advertising as-well website design and development. We've worked on world class websites for the likes of the Olympics, Microsoft, etc`
prompt = `We are a manufacturer of womans clothing. We have world class designers on our team. Goals: The site must include a store.`
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
    .get("", () => "SiteDingo API")
    .get("/sitemap", async () => {
        const result = await generateAiSitemap(prompt);
        return JSON.stringify(result.object || '', null, 2)
    })
    .get("/page", async () => {
        const result = await generateAiPage('Out Story', prompt)
        return JSON.stringify(result.object || '', null, 2)
    })

export default app;
