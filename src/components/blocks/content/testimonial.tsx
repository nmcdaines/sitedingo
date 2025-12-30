"use client";

import { z } from "zod";
import { defineBlock } from "../registry";
import { BlockCategory, imagePropsSchema } from "../types";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

const testimonialItemSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string(),
  company: z.string().optional(),
  avatar: imagePropsSchema.optional(),
});

type TestimonialItem = z.infer<typeof testimonialItemSchema>;

const testimonialPropsSchema = z.object({
  sectionTitle: z.string().optional(),
  sectionSubtitle: z.string().optional(),
  testimonials: z.array(testimonialItemSchema),
  layout: z.enum(["single", "grid"]).optional(),
  verticalPadding: z.enum(["sm", "md", "lg", "xl"]).optional(),
  backgroundColor: z.string().optional(),
});

export type TestimonialProps = z.infer<typeof testimonialPropsSchema>;

// Extracted component outside of render
function TestimonialCard({ testimonial }: { testimonial: TestimonialItem }) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <Quote className="w-8 h-8 text-primary/20 mb-4" />
      <blockquote className="text-foreground mb-6">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-4">
        {testimonial.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.avatar.src}
            alt={testimonial.avatar.alt}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {testimonial.author.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{testimonial.author}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.role}
            {testimonial.company && ` at ${testimonial.company}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Testimonial({
  sectionTitle,
  sectionSubtitle,
  testimonials,
  layout = "grid",
  verticalPadding = "lg",
  backgroundColor = "bg-muted/30",
}: TestimonialProps) {
  const paddingClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-24",
  };

  return (
    <section className={cn("w-full", paddingClasses[verticalPadding], backgroundColor)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12">
            {sectionTitle && (
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Testimonials */}
        {layout === "single" && testimonials.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <TestimonialCard testimonial={testimonials[0]} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export const testimonialBlock = defineBlock({
  meta: {
    id: "testimonial",
    name: "Testimonials",
    description: "Social proof section with customer testimonials",
    category: BlockCategory.CONTENT,
    icon: "message-square-quote",
    tags: ["testimonials", "reviews", "social-proof", "quotes"],
  },
  component: Testimonial,
  defaultProps: {
    sectionTitle: "What our customers say",
    sectionSubtitle: "Don't just take our word for it. Here's what real users have to say.",
    testimonials: [
      {
        quote: "This platform has completely transformed how we work. The intuitive interface and powerful features have saved us countless hours.",
        author: "Sarah Johnson",
        role: "CEO",
        company: "TechStart Inc",
        avatar: {
          src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
          alt: "Sarah Johnson",
        },
      },
      {
        quote: "The best investment we've made for our team. Customer support is exceptional and the product keeps getting better.",
        author: "Michael Chen",
        role: "Product Manager",
        company: "InnovateCo",
        avatar: {
          src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          alt: "Michael Chen",
        },
      },
      {
        quote: "Easy to use, powerful features, and excellent documentation. Everything a developer could ask for.",
        author: "Emily Davis",
        role: "Lead Developer",
        company: "CodeCraft",
        avatar: {
          src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
          alt: "Emily Davis",
        },
      },
    ],
    layout: "grid",
    verticalPadding: "lg",
    backgroundColor: "bg-muted/30",
  },
  propsSchema: testimonialPropsSchema,
});
