// Types for the project visualization UI

export type ViewMode = "sitemap" | "wireframe" | "style-guide" | "design";

export type PageIcon = "home" | "file" | "users" | "briefcase" | "mail" | "settings" | "image" | "star";

export interface ProjectSection {
  id: string;
  name: string;
  description?: string;
  componentType: string;
}

export interface ProjectPage {
  id: string;
  name: string;
  icon?: PageIcon;
  sections: ProjectSection[];
  children?: ProjectPage[];
}

export interface Sitemap {
  id: string;
  name: string;
  pages: ProjectPage[];
}

export interface ProjectData {
  id: string;
  name: string;
  sitemap: Sitemap;
  collaborators?: { id: string; name: string; avatar?: string }[];
}

// Mock data for demonstration - 1 Project, 1 Sitemap, Home page with child pages
export const mockProjectData: ProjectData = {
  id: "proj_1",
  name: "Gretta Architectural Firm",
  collaborators: [
    { id: "1", name: "ND", avatar: undefined },
    { id: "2", name: "JK", avatar: undefined },
    { id: "3", name: "AM", avatar: undefined },
  ],
  sitemap: {
    id: "sitemap_1",
    name: "Main Sitemap",
    pages: [
      {
        id: "page_home",
        name: "Home",
        icon: "home",
        sections: [
          { id: "s1", name: "Navbar", componentType: "navigation" },
          {
            id: "s2",
            name: "Hero Header Section",
            description:
              "Striking introduction to Gretta, a boutique architectural firm in Los Angeles.",
            componentType: "hero",
          },
          {
            id: "s3",
            name: "Features List Section",
            description: "Three key aspects of Gretta's design philosophy.",
            componentType: "features",
          },
          {
            id: "s4",
            name: "Portfolio Preview",
            description: "Curated selection of featured projects.",
            componentType: "gallery",
          },
          {
            id: "s5",
            name: "Testimonial Section",
            description: "Quotes from satisfied clients.",
            componentType: "testimonials",
          },
          {
            id: "s6",
            name: "CTA Section",
            description: "Encouragement to get in touch.",
            componentType: "cta",
          },
          { id: "s7", name: "Footer", componentType: "footer" },
        ],
        children: [
          {
            id: "page_about",
            name: "About",
            icon: "users",
            sections: [
              { id: "s10", name: "Navbar", componentType: "navigation" },
              {
                id: "s11",
                name: "Header Section",
                description: "Introduction to the firm and its history.",
                componentType: "hero",
              },
              {
                id: "s12",
                name: "Story Section",
                description: "The origin story of Gretta.",
                componentType: "features",
              },
              {
                id: "s13",
                name: "Team Section",
                description: "Meet our architects and designers.",
                componentType: "team",
              },
              { id: "s14", name: "Footer", componentType: "footer" },
            ],
          },
          {
            id: "page_services",
            name: "Services",
            icon: "star",
            sections: [
              { id: "s20", name: "Navbar", componentType: "navigation" },
              {
                id: "s21",
                name: "Header Section",
                description: "Overview of architectural services.",
                componentType: "hero",
              },
              {
                id: "s22",
                name: "Services Grid",
                description: "Residential, Commercial, Community projects.",
                componentType: "features",
              },
              {
                id: "s23",
                name: "Process Section",
                description: "Our design and build process.",
                componentType: "features",
              },
              { id: "s24", name: "Footer", componentType: "footer" },
            ],
          },
          {
            id: "page_portfolio",
            name: "Portfolio",
            icon: "briefcase",
            sections: [
              { id: "s30", name: "Navbar", componentType: "navigation" },
              {
                id: "s31",
                name: "Header Section",
                description: "Explore our diverse portfolio.",
                componentType: "hero",
              },
              {
                id: "s32",
                name: "Filter Section",
                description: "Browse by project type.",
                componentType: "features",
              },
              {
                id: "s33",
                name: "Projects Grid",
                description: "All portfolio projects.",
                componentType: "gallery",
              },
              { id: "s34", name: "Footer", componentType: "footer" },
            ],
          },
          {
            id: "page_gallery",
            name: "Gallery",
            icon: "image",
            sections: [
              { id: "s40", name: "Navbar", componentType: "navigation" },
              {
                id: "s41",
                name: "Header Section",
                description: "Visual showcase of our work.",
                componentType: "hero",
              },
              {
                id: "s42",
                name: "Image Gallery",
                description: "Full-width image gallery.",
                componentType: "gallery",
              },
              { id: "s43", name: "Footer", componentType: "footer" },
            ],
          },
          {
            id: "page_blog",
            name: "Blog",
            icon: "file",
            sections: [
              { id: "s50", name: "Navbar", componentType: "navigation" },
              {
                id: "s51",
                name: "Header Section",
                description: "Insights and updates.",
                componentType: "hero",
              },
              {
                id: "s52",
                name: "Blog Posts Grid",
                description: "Latest articles and news.",
                componentType: "gallery",
              },
              { id: "s53", name: "Footer", componentType: "footer" },
            ],
          },
          {
            id: "page_contact",
            name: "Contact",
            icon: "mail",
            sections: [
              { id: "s60", name: "Navbar", componentType: "navigation" },
              {
                id: "s61",
                name: "Header Section",
                description: "Get in touch with us.",
                componentType: "hero",
              },
              {
                id: "s62",
                name: "Contact Form",
                description: "Name, email, and message fields.",
                componentType: "contact",
              },
              {
                id: "s63",
                name: "Location Section",
                description: "Office address and map.",
                componentType: "features",
              },
              { id: "s64", name: "Footer", componentType: "footer" },
            ],
          },
        ],
      },
    ],
  },
};
