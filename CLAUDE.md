# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Research Dashboard is a Next.js 14 web application for tracking arXiv papers, managing reading lists, and visualizing citation networks. It integrates with arXiv API and Semantic Scholar API to provide paper search, citation analysis, and interactive D3.js network visualizations.

## Development Commands

```bash
# Development
npm run dev                    # Start dev server at http://localhost:3000
npm run build                  # Build for production
npm start                      # Start production server
npm run lint                   # Run ESLint

# Database (Prisma)
npx prisma migrate dev         # Create and apply migrations
npx prisma generate            # Generate Prisma Client (required after schema changes)
npx prisma studio              # Open Prisma Studio GUI
npx prisma db push             # Push schema changes without migrations (dev only)
npx prisma migrate reset       # Reset database (WARNING: deletes all data)

# Database setup from scratch
createdb ai_research_dashboard
npx prisma migrate dev --name init
npx prisma generate
```

## Authentication Architecture

**Important**: The app uses NextAuth.js v4 with **JWT-only sessions** (no database adapter).

- Configuration: [src/lib/auth.ts](src/lib/auth.ts)
- Session strategy: `"jwt"` (not database sessions)
- Provider: GitHub OAuth only
- Session user ID is stored in JWT token via callbacks
- Auth utilities: [src/lib/auth-utils.ts](src/lib/auth-utils.ts) provides `requireAuth()` helper for API routes

**Why JWT-only**: The Prisma adapter was removed to fix Vercel deployment issues. User records are still created in the database via the API routes when users first add papers.

## API Architecture

All API routes follow this pattern:
1. Use `requireAuth()` from [src/lib/auth-utils.ts](src/lib/auth-utils.ts) to verify session
2. Access Prisma via the singleton client in [src/lib/prisma.ts](src/lib/prisma.ts)
3. Return JSON responses with proper error codes

### Key API Endpoints

- `GET /api/papers` - List user's papers (supports filters: status, tag, search)
- `POST /api/papers` - Add paper (requires: arxivId, title, authors, abstract, url)
- `PATCH /api/papers/[id]` - Update paper (status, notes, rating, tags)
- `GET /api/arxiv` - Fetch papers from arXiv API (proxy to avoid CORS)
- `GET /api/search` - Search both arXiv and Semantic Scholar in parallel
- `GET /api/citations` - Build citation network via Semantic Scholar API
- `GET /api/export` - Export papers to BibTeX format

## External API Integrations

### arXiv API ([src/lib/services/arxiv.ts](src/lib/services/arxiv.ts))
- XML-based API using `xml2js` for parsing
- Default categories: `cs.AI`, `cs.LG`, `cs.CL`, `cs.CV`, `cs.NE`, `stat.ML`
- Functions: `fetchArxivPapers()`, `fetchTodaysPapers()`, `searchArxivPapers()`, `fetchPaperByArxivId()`
- No API key required

### Semantic Scholar API ([src/lib/services/semantic-scholar.ts](src/lib/services/semantic-scholar.ts))
- REST API with optional API key (set `SEMANTIC_SCHOLAR_API_KEY` for higher rate limits)
- Used for: paper search, citation data, building citation networks
- Functions: `searchPapers()`, `getPaperByArxivId()`, `getCitations()`, `getReferences()`, `buildCitationNetwork()`
- Rate limiting: 429 errors are caught and reported to user

## Database Schema (Prisma)

Key models in [prisma/schema.prisma](prisma/schema.prisma):

- **User**: NextAuth user accounts (id, email, name, image)
- **Paper**: arXiv papers with metadata
  - `arxivId`: arXiv identifier (e.g., "2301.12345")
  - `status`: `TO_READ | READING | DONE` (ReadingStatus enum)
  - `authors`: PostgreSQL array (string[])
  - `categories`: PostgreSQL array (string[])
  - Unique constraint: `[arxivId, userId]` (same paper can be saved by multiple users)
- **Tag**: Custom colored tags (unique per user: `[name, userId]`)
- **PaperTag**: Many-to-many join table for Paper ↔ Tag
- **Citation**: Citation relationships between papers (stores both directions)
- **Account/Session/VerificationToken**: NextAuth tables (currently unused due to JWT strategy)

## Frontend Architecture

### Route Structure (Next.js App Router)

```
src/app/
├── (dashboard)/          # Protected routes with shared layout
│   ├── dashboard/        # Main dashboard - today's papers
│   ├── papers/           # Paper list with filters
│   ├── reading-list/     # Kanban board (drag-and-drop)
│   ├── graph/            # Citation network visualization
│   ├── search/           # Search interface
│   └── settings/         # User settings
├── api/                  # API routes (see above)
└── auth/                 # Auth pages (signin)
```

### Component Organization

- `src/components/ui/`: shadcn/ui components (Button, Dialog, etc.)
- `src/components/layout/`: Layout components (Navbar, Sidebar)
- `src/components/graph/`: [citation-network.tsx](src/components/graph/citation-network.tsx) - D3.js force-directed graph
- `src/components/reading-list/`: Kanban board using `@dnd-kit`

### D3.js Citation Network

[src/components/graph/citation-network.tsx](src/components/graph/citation-network.tsx) renders an interactive force-directed graph:
- Nodes sized by citation count (log scale)
- Drag-and-drop to reposition nodes
- Zoom/pan controls via `d3.zoom()`
- Force simulation: link, charge, center, collision forces
- Arrow markers for citation direction
- Click handler for node selection

### Drag-and-Drop Kanban

Reading list uses `@dnd-kit` library:
- [kanban-column.tsx](src/components/reading-list/kanban-column.tsx): Droppable columns (TO_READ, READING, DONE)
- [kanban-card.tsx](src/components/reading-list/kanban-card.tsx): Draggable paper cards
- Updates paper `status` via `PATCH /api/papers/[id]` on drop

## Environment Variables

Required variables (see [.env.example](.env.example)):

```env
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_URL              # App URL (http://localhost:3000 for dev)
NEXTAUTH_SECRET           # Generate: openssl rand -base64 32
GITHUB_ID                 # GitHub OAuth app client ID
GITHUB_SECRET             # GitHub OAuth app client secret
SEMANTIC_SCHOLAR_API_KEY  # Optional, for higher rate limits
```

## Important Technical Details

### Path Aliases
- `@/*` maps to `./src/*` (configured in [tsconfig.json](tsconfig.json))
- Example: `import prisma from "@/lib/prisma"`

### PostgreSQL Arrays
The Prisma schema uses PostgreSQL array types (`String[]`) for:
- `Paper.authors`
- `Paper.categories`

These must be properly handled in migrations and queries.

### Strict TypeScript
- TypeScript strict mode is enabled
- All `@/*` imports are type-checked
- Prisma Client generates full TypeScript types

### Tailwind + shadcn/ui
- Tailwind configured with custom design system
- shadcn/ui components in `src/components/ui/`
- Uses `class-variance-authority` for component variants
- `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) for className merging

## Deployment Considerations

### Vercel Deployment
1. **Database**: Use Vercel Postgres or external PostgreSQL (Neon, Supabase, etc.)
2. **Environment Variables**: Set all env vars in Vercel dashboard
3. **Build Command**: `npm run build` (Prisma generate runs automatically)
4. **Auth Callback URL**: Update GitHub OAuth app with production URL

### Database Migrations
- Run `npx prisma migrate deploy` in production
- Or use `npx prisma db push` for prototyping (skips migrations)

### Known Issues
- **PrismaAdapter removed**: Due to Vercel deployment errors with database sessions
- User accounts are now managed via JWT tokens only
- Database User records are still created when users add their first paper

## Testing

No test framework is currently configured. When adding tests:
- Use Vitest or Jest for unit tests
- Use Playwright (already installed as dependency) for E2E tests
- Test API routes by mocking `getServerSession`
- Mock external APIs (arXiv, Semantic Scholar) in tests
