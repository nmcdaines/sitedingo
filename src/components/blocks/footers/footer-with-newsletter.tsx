"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerWithNewsletterPropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  newsletter: z.object({
    title: z.string(),
    description: z.string(),
    placeholder: z.string(),
    buttonText: z.string(),
  }),
  links: z.array(linkPropsSchema),
  copyright: z.string(),
  backgroundColor: z.string().optional(),
});

export type FooterWithNewsletterProps = z.infer<typeof footerWithNewsletterPropsSchema>;

export function FooterWithNewsletter({
  logo,
  newsletter,
  links,
  copyright,
  backgroundColor = "bg-muted/50",
}: FooterWithNewsletterProps) {
  return (
    <footer className={cn("w-full pt-16 pb-8 border-t border-border", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 pb-12 border-b border-border">
          <div>
            <a href={logo.href} className="font-bold text-xl text-foreground">
              {logo.text}
            </a>
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              {newsletter.title}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {newsletter.description}
            </p>
          </div>
          <div className="flex items-end">
            <form className="flex w-full max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={newsletter.placeholder}
                className="flex-1"
              />
              <Button type="submit">
                {newsletter.buttonText}
              </Button>
            </form>
          </div>
        </div>

        {/* Links & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

export const footerWithNewsletterBlock = defineBlock({
  meta: {
    id: "footer-with-newsletter",
    name: "Footer with Newsletter",
    description: "A footer with newsletter signup form and links",
    category: BlockCategory.FOOTER,
    icon: "mail",
    tags: ["footer", "newsletter", "email", "signup"],
  },
  component: FooterWithNewsletter,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    newsletter: {
      title: "Stay up to date",
      description: "Subscribe to our newsletter for the latest updates and insights.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
    },
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact Us", href: "/contact" },
    ],
    copyright: "© 2024 Brand. All rights reserved.",
    backgroundColor: "bg-muted/50",
  },
  propsSchema: footerWithNewsletterPropsSchema,
});
