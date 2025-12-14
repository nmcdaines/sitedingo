import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

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

export default app;
