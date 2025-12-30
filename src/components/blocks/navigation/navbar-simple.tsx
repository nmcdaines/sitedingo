"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navbarSimplePropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  links: z.array(linkPropsSchema),
  backgroundColor: z.string().optional(),
});

export type NavbarSimpleProps = z.infer<typeof navbarSimplePropsSchema>;

export function NavbarSimple({
  logo,
  links,
  backgroundColor = "bg-white",
}: NavbarSimpleProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={cn("w-full border-b border-border", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href={logo.href} className="font-bold text-xl text-foreground">
            {logo.text}
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 py-2 space-y-1">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export const navbarSimpleBlock = defineBlock({
  meta: {
    id: "navbar-simple",
    name: "Simple Navbar",
    description: "A clean, minimal navigation bar with logo and links",
    category: BlockCategory.NAVIGATION,
    icon: "navigation",
    tags: ["navbar", "header", "navigation", "simple"],
  },
  component: NavbarSimple,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Contact", href: "/contact" },
    ],
    backgroundColor: "bg-white",
  },
  propsSchema: navbarSimplePropsSchema,
});
