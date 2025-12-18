import { treaty } from "@elysiajs/eden"
import type { App } from "@/server/api"

function getBaseURL() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export const client = treaty<App>(getBaseURL(), {
  fetch: {
    cache: 'no-cache',
  }
})

