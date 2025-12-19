import { treaty } from "@elysiajs/eden"
import type { App } from "@/server/api"

function isServerSide() {
  return typeof process !== 'undefined' && !!process.env.NEXT_RUNTIME
}

function getBaseURL() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export const client = treaty<App>(getBaseURL(), {
  fetch: {
    credentials: 'include',
  },
  async fetcher(url, options = {}) {
    if (isServerSide()) {
      // When SSR, forward cookies from incoming request
      const cookies = await import("next/headers").then(mod => mod.cookies)
      return cookies().then((cookieStore) => {
        const cookieHeader = cookieStore.toString()
        options.headers = {
          ...options.headers,
          Cookie: cookieHeader,
        }
        return fetch(url, options)
      })
    }

    return fetch(url, options)
  }
})

