"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, linkPropsSchema, buttonPropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navbarCenteredPropsSchema = z.object({
  logo: z.object({
    text: z.string(),
    href: z.string(),
  }),
  leftLinks: z.array(linkPropsSchema),
  rightLinks: z.array(linkPropsSchema),
  cta: buttonPropsSchema.optional(),
  backgroundColor: z.string().optional(),
});

export type NavbarCenteredProps = z.infer<typeof navbarCenteredPropsSchema>;

export function NavbarCentered({
  logo,
  leftLinks,
  rightLinks,
  cta,
  backgroundColor = "bg-white",
}: NavbarCenteredProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const buttonVariant = cta?.variant === "primary" ? "default" : cta?.variant ?? "default";
  const allLinks = [...leftLinks, ...rightLinks];

  return (
    <nav className={cn("w-full border-b border-border", backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {leftLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Logo (Center) */}
          <a href={logo.href} className="font-bold text-xl text-foreground">
            {logo.text}
          </a>

          {/* Right Links & CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
            {rightLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            {cta && (
              <Button variant={buttonVariant} asChild>
                <a href={cta.href}>{cta.label}</a>
              </Button>
            )}
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
            {allLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            {cta && (
              <div className="pt-2">
                <Button variant={buttonVariant} className="w-full" asChild>
                  <a href={cta.href}>{cta.label}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export const navbarCenteredBlock = defineBlock({
  meta: {
    id: "navbar-centered",
    name: "Centered Navbar",
    description: "Navigation bar with centered logo and balanced links on both sides",
    category: BlockCategory.NAVIGATION,
    icon: "layout",
    tags: ["navbar", "header", "navigation", "centered", "balanced"],
  },
  component: NavbarCentered,
  defaultProps: {
    logo: {
      text: "Brand",
      href: "/",
    },
    leftLinks: [
      { label: "Products", href: "/products" },
      { label: "Solutions", href: "/solutions" },
    ],
    rightLinks: [
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
    cta: {
      label: "Sign Up",
      href: "/signup",
      variant: "primary",
    },
    backgroundColor: "bg-white",
  },
  propsSchema: navbarCenteredPropsSchema,
});
