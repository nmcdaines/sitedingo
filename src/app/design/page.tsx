import { generateText, Output } from 'ai'
import { z } from 'zod'


// You are a website designer and in the process of refreshing a website.
// Please generate a simple sitemap based on the users requirements.
// 
// Some suggested pages for different categories of websites (if appropriate) are:
// 
// Restaurant/Cafe: Home, About, What's on, Gallery, Gift Vouchers, Catering, Book
// Book store: Home, Our Story, Events (Upcoming, Past), Bestsellers, Books, Games, Gift Cards, Find Us, Contact Us, Staff Picks
// 
// Don't feel you have to add all the relevant pages; each site should be unique.

const system = `
You are an experienced UX architect and information architect.
Generate a clear, scalable sitemap for a **{BUSINESS_TYPE}** website.

### Context
-   **Business type:** {e.g. cafe / restaurant / retail shop /
    manufacturer / service business / SaaS}
-   **Target audience:** {e.g. consumers, B2B buyers, wholesalers,
    local customers}
-   **Primary goals:** {e.g. bookings, online orders, lead generation,
    brand awareness}
-   **Business size:** {small/local, multi-location, enterprise}
-   **Sales model:** {in-store, online, B2B, subscription, custom
    quotes}

### Requirements
1. Home will always exist at the top level.
2.  Produce a hierarchical sitemap (top-level → subpages).
3.  Group pages logically by user intent (discover, evaluate,
    purchase, support).
4.  Include:
-   Core marketing pages
-   Product or service structures appropriate to the business type
-   Conversion-focused pages (CTAs, forms, bookings, ordering, quotes)
-   Trust and credibility pages (about, reviews, certifications, case
    studies)
-   Legal and utility pages
5.  Prefer clarity and scalability over complexity.
`

const prompt = `
Finn and Co is a cozy cafe in the heart of the blue mountains.
They produce their own bread and source ingredients locally.
`

export default async function DesignPage() {

  const result = await generateText({
    model: 'openai/gpt-5',
    system,
    prompt,
    output: Output.object({
      schema: z.object({
        pages: z.array(z.object({
          name: z.string(),
          // children: z.array(z.object({
          //   name: z.string(),
          // }))
        }))
      })
    }),
  })


  return (
    <div className="">
      <pre><code>
      {JSON.stringify(result.output, null, 2)}
      </code></pre>
    </div>
  )
}