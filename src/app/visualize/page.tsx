import { ProjectHeader } from "@/components/visualization/project-header";
import { VisualizationTabs } from "@/components/visualization/visualization-tabs";
import { SitemapCanvas } from "@/components/visualization/sitemap-canvas";
import { Toolbar } from "@/components/visualization/toolbar";
import { CanvasControls } from "@/components/visualization/canvas-controls";

// Mock data - will be replaced with real database queries
const mockSitemapData = {
  id: "home-page",
  name: "Home",
  slug: "/",
  sections: [
    {
      id: "nav-1",
      name: "Navbar",
      componentType: "navigation",
      description: "",
    },
    {
      id: "hero-1",
      name: "Hero Header Section",
      componentType: "hero",
      description:
        "Striking introduction to Gretta, a leading architectural firm in Los Angeles, emphasizing their focus on homes, small commercial, and community projects.",
    },
    {
      id: "partners-1",
      name: "Partners List Section",
      componentType: "partners",
      description:
        "Three key aspects of Gretta's design philosophy or service approach.",
    },
    {
      id: "portfolio-1",
      name: "Portfolio List Section",
      componentType: "portfolio",
      description:
        "Curated selection of featured residential, commercial, and community projects with images and brief descriptions.",
    },
    {
      id: "about-1",
      name: "About Section",
      componentType: "about",
      description:
        "Brief background about the firm, its founders, and its mission.",
    },
    {
      id: "testimonial-1",
      name: "Testimonial Section",
      componentType: "testimonial",
      description:
        "Quotes from satisfied clients or partners highlighting Gretta's expertise and collaborative approach.",
    },
    {
      id: "team-1",
      name: "Team Section",
      componentType: "team",
      description:
        "Introduction to key team members with names, roles, and photos.",
    },
    {
      id: "cta-1",
      name: "CTA Section",
      componentType: "cta",
      description:
        "Encouragement to view the full portfolio or get in touch for a consultation.",
    },
    {
      id: "footer-1",
      name: "Footer",
      componentType: "footer",
      description: "",
    },
    {
      id: "about-footer-1",
      name: "About Section",
      componentType: "about",
      description: "Provide information about the company",
    },
  ],
  children: [
    {
      id: "about-page",
      name: "About",
      slug: "/about",
      sections: [
        {
          id: "nav-2",
          name: "Navbar",
          componentType: "navigation",
          description: "",
        },
        {
          id: "header-2",
          name: "Header Section",
          componentType: "header",
          description:
            "Page title and a concise introduction to Gretta, highlighting their architecture expertise and unique approach.",
        },
        {
          id: "contact-2",
          name: "Contact Section",
          componentType: "contact",
          description: "",
        },
      ],
      children: [],
    },
    {
      id: "portfolio-page",
      name: "Portfolio",
      slug: "/portfolio",
      sections: [
        {
          id: "nav-3",
          name: "Navbar",
          componentType: "navigation",
          description: "",
        },
        {
          id: "header-3",
          name: "Header Section",
          componentType: "header",
          description:
            "Introduction to the Portfolio page, highlighting Gretta's diverse work in residential, small commercial, and community architecture.",
        },
      ],
      children: [],
    },
    {
      id: "contact-page",
      name: "Contact",
      slug: "/contact",
      sections: [
        {
          id: "nav-4",
          name: "Navbar",
          componentType: "navigation",
          description: "",
        },
        {
          id: "header-4",
          name: "Header Section",
          componentType: "header",
          description:
            "Warm invitation to connect with Gretta for new projects, inquiries, or collaborations.",
        },
        {
          id: "contact-4",
          name: "Contact Section",
          componentType: "contact",
          description: "",
        },
      ],
      children: [],
    },
  ],
};

export default function VisualizePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Project Header */}
      <ProjectHeader projectName="Gretta Architectural Firm" />

      {/* Navigation Tabs */}
      <VisualizationTabs activeTab="sitemap" />

      {/* Toolbar */}
      <Toolbar />

      {/* Sitemap Canvas */}
      <div className="flex-1 relative">
        <SitemapCanvas pages={[mockSitemapData]} />
        <CanvasControls />
      </div>
    </div>
  );
}
