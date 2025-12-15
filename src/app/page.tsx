import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Layout, Palette, FileCode } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">
      <main className="flex min-h-screen w-full max-w-5xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">sitedingo</span>
        </div>

        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left w-full">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
              AI-Powered Sitemap & Page Structure Builder
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              Describe your business and get a complete website structure with
              pages, sections, and content — all powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <Link
              href="/visualize"
              className="group flex flex-col gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <Layout className="w-6 h-6 text-gray-900" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Sitemap Visualization
                </h3>
                <p className="text-sm text-gray-600">
                  View and manage your project structure with an interactive
                  sitemap builder
                </p>
              </div>
            </Link>

            <Link
              href="/design"
              className="group flex flex-col gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <Sparkles className="w-6 h-6 text-gray-900" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  AI Design Studio
                </h3>
                <p className="text-sm text-gray-600">
                  Generate sitemaps and page structures using AI prompts
                </p>
              </div>
            </Link>

            <div className="group flex flex-col gap-3 p-6 bg-gray-50 border border-gray-200 rounded-xl opacity-60">
              <div className="flex items-center justify-between">
                <Palette className="w-6 h-6 text-gray-600" />
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  Style Guide Generator
                </h3>
                <p className="text-sm text-gray-600">
                  Create comprehensive style guides for your projects
                </p>
              </div>
            </div>

            <div className="group flex flex-col gap-3 p-6 bg-gray-50 border border-gray-200 rounded-xl opacity-60">
              <div className="flex items-center justify-between">
                <FileCode className="w-6 h-6 text-gray-600" />
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  Code Export
                </h3>
                <p className="text-sm text-gray-600">
                  Export your designs as production-ready code
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Built with Next.js, React, Tailwind CSS, and Vercel AI SDK
        </div>
      </main>
    </div>
  );
}
