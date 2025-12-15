# sitedingo

An AI-powered sitemap and page structure builder that helps you design and visualize complete website architectures.

## Features

### 🎨 Sitemap Visualization
- **Interactive Tree View**: Visualize your website structure in a hierarchical layout similar to Relume
- **Expandable Sections**: View detailed sections within each page
- **Real-time Updates**: Changes sync across your team
- **Export Options**: Download your sitemap in multiple formats

### 🤖 AI-Powered Generation
- **Smart Sitemap Generation**: Describe your business and get a complete sitemap
- **Context-Aware**: AI understands different business types and industries
- **Section Recommendations**: Automatically suggests relevant page sections
- **Iterative Refinement**: Regenerate and refine until it's perfect

### 🛠️ Workspace Management
- **Team Collaboration**: Invite team members and work together
- **Multiple Projects**: Manage multiple websites in one place
- **Version History**: Track changes and revert when needed
- **Templates**: Start from pre-built templates

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Elysia (API), Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **AI**: Vercel AI SDK with OpenAI
- **Auth**: Clerk
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (or use Neon)
- OpenAI API key
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sitedingo.git
cd sitedingo
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your credentials:
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
sitedingo/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Home page
│   │   ├── design/            # AI generation studio
│   │   └── visualize/         # Sitemap visualization
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── visualization/     # Sitemap visualization components
│   ├── db/                    # Database layer
│   │   ├── schema.ts          # Drizzle schema
│   │   └── relations.ts       # Table relations
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   └── queries/           # Database queries
│   └── server/
│       ├── api/               # Elysia API routes
│       └── prompts/           # AI prompt templates
├── docs/                      # Documentation
├── public/                    # Static assets
└── README.md
```

## Key Routes

- `/` - Home page with feature overview
- `/visualize` - Demo visualization with mock data
- `/visualize/[projectId]` - Project-specific sitemap view
- `/design` - AI-powered sitemap generation
- `/api/*` - API endpoints (Elysia)

## Database Schema

```
teams
└── team_members
└── projects
    └── sitemaps
        └── pages (tree structure)
            └── sections
```

## Development

### Adding New Components

Use shadcn/ui CLI:
```bash
npm run add-component button
# or
bun run add-component button
```

### Database Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Push to database
npx drizzle-kit push

# Open studio
npx drizzle-kit studio
```

### Code Style

- Files/folders: `kebab-case`
- Components: `PascalCase`
- Functions: `camelCase`
- Follow ESLint rules
- Use Prettier for formatting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [x] Database schema design
- [x] Sitemap visualization UI
- [x] Database integration
- [ ] AI sitemap generation
- [ ] Drag & drop reordering
- [ ] Real-time collaboration
- [ ] Wireframe view
- [ ] Style guide generator
- [ ] Code export
- [ ] Templates library
- [ ] Version history
- [ ] Comments & feedback

## Documentation

- [Visualization UI](./docs/visualization-ui.md) - Detailed documentation for the sitemap visualization
- [Prompt Experiments](./docs/prompt-experiments.md) - AI prompt engineering notes

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs/](./docs)
- Issues: [GitHub Issues](https://github.com/yourusername/sitedingo/issues)
- Email: support@sitedingo.com

---

Built with ❤️ using Next.js and AI
