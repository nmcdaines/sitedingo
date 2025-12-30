"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema } from "../types";
import { cn } from "@/lib/utils";

const footerColumnSchema = z.object({
  title: z.string(),
  links: z.array(linkPropsSchema),
});

const footerColumnsPropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  description: z.string().optional(),
  columns: z.array(footerColumnSchema),
  copyright: z.string(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    href: z.string(),
  })).optional(),
  backgroundColor: z.string().optional(),
});

export type FooterColumnsProps = z.infer<typeof footerColumnsPropsSchema>;

export function FooterColumns({
  logo,
  description,
  columns,
  copyright,
  socialLinks,
  backgroundColor = "bg-muted/50",
}: FooterColumnsProps) {
  return (
    <footer className={cn("w-full pt-16 pb-8 border-t border-border", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href={logo.href} className="font-bold text-xl text-foreground">
              {logo.text}
            </a>
            {description && (
              <p className="mt-4 text-muted-foreground max-w-sm">
                {description}
              </p>
            )}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-4 mt-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

export const footerColumnsBlock = defineBlock({
  meta: {
    id: "footer-columns",
    name: "Multi-Column Footer",
    description: "A comprehensive footer with multiple link columns",
    category: BlockCategory.FOOTER,
    icon: "grid",
    tags: ["footer", "columns", "links", "comprehensive"],
  },
  component: FooterColumns,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    description: "Building the future of web design, one block at a time.",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Changelog", href: "/changelog" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Blog", href: "/blog" },
          { label: "Careers", href: "/careers" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Help Center", href: "/help" },
          { label: "Contact", href: "/contact" },
          { label: "Status", href: "/status" },
        ],
      },
    ],
    copyright: "© 2024 Brand. All rights reserved.",
    socialLinks: [
      { platform: "Twitter", href: "https://twitter.com" },
      { platform: "GitHub", href: "https://github.com" },
      { platform: "LinkedIn", href: "https://linkedin.com" },
    ],
    backgroundColor: "bg-muted/50",
  },
  propsSchema: footerColumnsPropsSchema,
});
