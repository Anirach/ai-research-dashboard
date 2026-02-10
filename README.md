# AI Research Dashboard

A full-featured web application for tracking arXiv papers, managing your reading list, and visualizing citation networks. Built with Next.js 14, TypeScript, PostgreSQL, and D3.js.

## Features

- **arXiv Paper Tracker** - Fetch daily papers from arXiv API (cs.AI, cs.LG, cs.CL, and more)
- **Reading List** - Add papers, track status (To Read/Reading/Done), add notes and ratings
- **Citation Network** - Interactive D3.js visualization of paper relationships
- **Search** - Full-text search with arXiv and Semantic Scholar API integration
- **Tags** - Organize papers with custom colored tags
- **BibTeX Export** - Export your papers to BibTeX format
- **Mobile Responsive** - Works on all device sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js with GitHub OAuth
- **Visualization**: D3.js for citation networks
- **Drag & Drop**: @dnd-kit for Kanban board

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- GitHub OAuth App (for authentication)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-research-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database - PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_research_dashboard?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GitHub OAuth - Create an OAuth App at https://github.com/settings/developers
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Semantic Scholar API Key (optional, for higher rate limits)
SEMANTIC_SCHOLAR_API_KEY=""
```

### 4. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: AI Research Dashboard
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/api/auth/callback/github
4. Copy the Client ID and Client Secret to your `.env` file

### 5. Set up the database

Create the database:

```bash
createdb ai_research_dashboard
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Generate Prisma client:

```bash
npx prisma generate
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── papers/        # Paper list and details
│   │   ├── reading-list/  # Kanban board
│   │   ├── graph/         # Citation network
│   │   ├── search/        # Paper search
│   │   └── settings/      # User settings
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── papers/        # Paper CRUD
│   │   ├── tags/          # Tag management
│   │   ├── arxiv/         # arXiv API proxy
│   │   ├── search/        # Search endpoint
│   │   ├── citations/     # Citation network
│   │   └── export/        # BibTeX export
│   └── auth/              # Auth pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── papers/           # Paper components
│   ├── reading-list/     # Kanban components
│   └── graph/            # Graph components
├── lib/                  # Utilities and services
│   ├── services/         # External API integrations
│   │   ├── arxiv.ts      # arXiv API
│   │   └── semantic-scholar.ts
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript types
```

## API Endpoints

### Papers
- `GET /api/papers` - List papers with filters
- `POST /api/papers` - Add a new paper
- `GET /api/papers/[id]` - Get paper details
- `PATCH /api/papers/[id]` - Update paper
- `DELETE /api/papers/[id]` - Delete paper

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create a tag
- `PATCH /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag

### External APIs
- `GET /api/arxiv` - Fetch papers from arXiv
- `GET /api/search` - Search arXiv and Semantic Scholar
- `GET /api/citations` - Build citation network
- `GET /api/export` - Export to BibTeX

## Database Schema

### Models
- **User** - User accounts (via NextAuth)
- **Paper** - Research papers from arXiv
- **Tag** - Custom paper tags
- **PaperTag** - Paper-tag associations
- **Citation** - Citation relationships

## Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open Prisma Studio

# Linting
npm run lint         # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT
