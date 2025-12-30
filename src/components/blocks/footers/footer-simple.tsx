"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema } from "../types";
import { cn } from "@/lib/utils";

const footerSimplePropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  links: z.array(linkPropsSchema),
  copyright: z.string(),
  backgroundColor: z.string().optional(),
});

export type FooterSimpleProps = z.infer<typeof footerSimplePropsSchema>;

export function FooterSimple({
  logo,
  links,
  copyright,
  backgroundColor = "bg-muted/50",
}: FooterSimpleProps) {
  return (
    <footer className={cn("w-full py-8 border-t border-border", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <a href={logo.href} className="font-bold text-lg text-foreground">
            {logo.text}
          </a>

          {/* Links */}
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

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

export const footerSimpleBlock = defineBlock({
  meta: {
    id: "footer-simple",
    name: "Simple Footer",
    description: "A minimal footer with logo, links, and copyright",
    category: BlockCategory.FOOTER,
    icon: "footer",
    tags: ["footer", "simple", "minimal"],
  },
  component: FooterSimple,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
    copyright: "© 2024 Brand. All rights reserved.",
    backgroundColor: "bg-muted/50",
  },
  propsSchema: footerSimplePropsSchema,
});
