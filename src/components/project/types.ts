// Types for the project visualization UI

export type ViewMode = "sitemap" | "wireframe" | "style-guide" | "design";

export type PageIcon = "home" | "file" | "users" | "briefcase" | "mail" | "settings";

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
  position?: { x: number; y: number };
}

export interface ProjectData {
  id: string;
  name: string;
  pages: ProjectPage[];
  collaborators?: { id: string; name: string; avatar?: string }[];
}

// Mock data for demonstration
export const mockProjectData: ProjectData = {
  id: "proj_1",
  name: "Gretta Architectural Firm",
  collaborators: [
    { id: "1", name: "ND", avatar: undefined },
    { id: "2", name: "ND", avatar: undefined },
    { id: "3", name: "ND", avatar: undefined },
  ],
  pages: [
    {
      id: "page_home",
      name: "Home",
      icon: "home",
      position: { x: 400, y: 100 },
      sections: [
        { id: "s1", name: "Navbar", componentType: "navigation" },
        {
          id: "s2",
          name: "Hero Header Section",
          description:
            "Striking introduction to Gretta, a boutique architectural firm in Los Angeles, emphasizing their focus on homes, small commercial, and community projects.",
          componentType: "hero",
        },
        {
          id: "s3",
          name: "Features List Section",
          description:
            "Three key aspects of Gretta's design philosophy or service approach.",
          componentType: "features",
        },
        {
          id: "s4",
          name: "Portfolio List Section",
          description:
            "Curated selection of featured residential, commercial, and community projects with images and brief descriptions.",
          componentType: "gallery",
        },
        {
          id: "s5",
          name: "About Section",
          description:
            "Brief background about the firm, its founders, and its mission.",
          componentType: "cta",
        },
        {
          id: "s6",
          name: "Testimonial Section",
          description:
            "Quotes from satisfied clients or partners highlighting Gretta's expertise and collaborative approach.",
          componentType: "testimonials",
        },
        {
          id: "s7",
          name: "Team Section",
          description:
            "Introduction to key team members with names, roles, and photos.",
          componentType: "team",
        },
        {
          id: "s8",
          name: "CTA Section",
          description:
            "Encouragement to view the full portfolio or get in touch for a consultation.",
          componentType: "cta",
        },
        { id: "s9", name: "Footer", componentType: "footer" },
      ],
      children: [
        {
          id: "page_about",
          name: "About",
          icon: "users",
          position: { x: 100, y: 500 },
          sections: [
            { id: "s10", name: "Navbar", componentType: "navigation" },
            {
              id: "s11",
              name: "Header Section",
              description:
                "Page title and a concise introduction to Gretta, highlighting their architectural expertise and unique approach.",
              componentType: "hero",
            },
            {
              id: "s12",
              name: "Story Section",
              description:
                "The origin story of the firm and what drives their design philosophy.",
              componentType: "features",
            },
            {
              id: "s13",
              name: "Values Section",
              description:
                "Core values that guide Gretta's work: sustainability, community, craftsmanship.",
              componentType: "features",
            },
            { id: "s14", name: "Footer", componentType: "footer" },
          ],
        },
        {
          id: "page_portfolio",
          name: "Portfolio",
          icon: "briefcase",
          position: { x: 400, y: 500 },
          sections: [
            { id: "s15", name: "Navbar", componentType: "navigation" },
            {
              id: "s16",
              name: "Header Section",
              description:
                "Introduction to the Portfolio page, highlighting Gretta's diverse work in residential, small commercial, and community architecture.",
              componentType: "hero",
            },
            {
              id: "s17",
              name: "Filter Section",
              description:
                "Filter options to browse projects by type: Residential, Commercial, Community.",
              componentType: "features",
            },
            {
              id: "s18",
              name: "Projects Grid",
              description:
                "Grid display of all portfolio projects with images, titles, and brief descriptions.",
              componentType: "gallery",
            },
            { id: "s19", name: "Footer", componentType: "footer" },
          ],
        },
        {
          id: "page_contact",
          name: "Contact",
          icon: "mail",
          position: { x: 700, y: 500 },
          sections: [
            { id: "s20", name: "Navbar", componentType: "navigation" },
            {
              id: "s21",
              name: "Header Section",
              description:
                "Warm invitation to connect with Gretta for new projects, inquiries, or collaborations.",
              componentType: "hero",
            },
            {
              id: "s22",
              name: "Contact Section",
              description:
                "Contact form with fields for name, email, phone, and project details.",
              componentType: "contact",
            },
            {
              id: "s23",
              name: "Location Section",
              description:
                "Office address, map embed, and business hours.",
              componentType: "features",
            },
            { id: "s24", name: "Footer", componentType: "footer" },
          ],
        },
      ],
    },
  ],
};
