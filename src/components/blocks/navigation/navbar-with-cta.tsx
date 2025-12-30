"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema, buttonPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navbarWithCtaPropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  links: z.array(linkPropsSchema),
  cta: buttonPropsSchema,
  backgroundColor: z.string().optional(),
});

export type NavbarWithCtaProps = z.infer<typeof navbarWithCtaPropsSchema>;

export function NavbarWithCta({
  logo,
  links,
  cta,
  backgroundColor = "bg-white",
}: NavbarWithCtaProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const buttonVariant = cta.variant === "primary" ? "default" : cta.variant ?? "default";

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

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button variant={buttonVariant} asChild>
              <a href={cta.href}>{cta.label}</a>
            </Button>
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
            <div className="pt-2">
              <Button variant={buttonVariant} className="w-full" asChild>
                <a href={cta.href}>{cta.label}</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export const navbarWithCtaBlock = defineBlock({
  meta: {
    id: "navbar-with-cta",
    name: "Navbar with CTA",
    description: "Navigation bar with a prominent call-to-action button",
    category: BlockCategory.NAVIGATION,
    icon: "navigation-2",
    tags: ["navbar", "header", "navigation", "cta", "button"],
  },
  component: NavbarWithCta,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
    ],
    cta: {
      label: "Get Started",
      href: "/signup",
      variant: "primary",
    },
    backgroundColor: "bg-white",
  },
  propsSchema: navbarWithCtaPropsSchema,
});
