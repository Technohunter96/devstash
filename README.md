# DevStash

One fast, searchable, AI-enhanced hub for all developer knowledge — snippets, prompts, commands, notes, links, files and images in a single place.

Developers keep essentials scattered across VS Code, AI chats, bash history and bookmarks. DevStash gives them one organized home.

## Features

- **Item types** — Snippet, Prompt, Command, Note, Link, File and Image, each with its own icon, color and editor
- **Quick-access drawer** — view, edit, favorite, pin and delete items without leaving the page
- **Collections** — group items freely; an item can belong to multiple collections
- **Global search** — `Ctrl+K` / `Cmd+K` command palette across items and collections
- **Editors** — Monaco code editor (configurable theme, font, tabs, minimap) and a Markdown editor with live preview
- **File storage** — drag-and-drop uploads to Cloudflare R2 with progress, image gallery and file list views
- **Favorites and pinning** — favorite items and collections, pin items to the top
- **Authentication** — email/password and GitHub OAuth, email verification, password reset, rate limiting
- **AI features (Pro)** — tag suggestions, description summaries, code explanations and prompt optimization
- **Billing** — Free and Pro plans with Stripe Checkout, customer portal and webhook sync

## Plans

| | Free | Pro |
| --- | --- | --- |
| Items | 50 | Unlimited |
| Collections | 3 | Unlimited |
| File & image uploads | — | ✓ |
| AI features | — | ✓ |
| Price | $0 | $8/month or $69/year |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | Neon (serverless PostgreSQL) with Prisma 7 |
| Auth | NextAuth v5 (Credentials + GitHub) |
| Styling | Tailwind CSS v4, shadcn/ui |
| File storage | Cloudflare R2 |
| Payments | Stripe |
| AI | OpenAI |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20.19 or newer
- A [Neon](https://neon.tech) PostgreSQL database

### Setup

```bash
git clone https://github.com/Technohunter96/devstash.git
cd devstash
npm install
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables)), then apply migrations and seed the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the dev server at [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

The seed creates the system item types and a demo user (`demo@devstash.io`) with sample collections and items.

> After changing `prisma/schema.prisma`, restart the dev server so it picks up the regenerated Prisma client.

## Environment Variables

Only `DATABASE_URL` and `AUTH_SECRET` are needed to run the core app. Everything else enables a specific feature.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon connection string (**required**) |
| `AUTH_SECRET` | NextAuth secret, e.g. `npx auth secret` (**required**) |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth |
| `APP_URL` | Base URL used in emails and Stripe redirects |
| `RESEND_API_KEY`, `EMAIL_VERIFICATION_ENABLED` | Verification and password-reset emails (verification is off by default) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (fails open when unset) |
| `R2_*` | Cloudflare R2 credentials for file and image uploads |
| `STRIPE_*` | Stripe keys, webhook secret and monthly/yearly Price IDs |
| `OPENAI_API_KEY` | AI features |

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`. Price IDs must belong to the same Stripe account as the secret key and be priced in USD.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Lint the codebase |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate a coverage report |

## Project Structure

```
src/
├── app/            # Routes: (app) dashboard shell, (auth) pages, api routes
├── actions/        # Server Actions (items, collections, billing, AI, search, …)
├── components/     # UI grouped by feature (dashboard, marketing, settings, …)
├── lib/            # Utilities, Prisma queries (lib/db), AI helpers, constants
└── types/          # Shared TypeScript types
prisma/             # Schema, migrations, seed
context/            # Project spec and feature history
docs/               # Architecture notes and integration plans
```

Conventions: server components by default, Server Actions for mutations and client-side reads, API routes only for webhooks, uploads and downloads. All inputs are validated with Zod.

## Database

Schema changes always go through migrations — never `db push`.

```bash
npx prisma migrate dev      # create and apply a migration locally
npx prisma migrate status   # verify migrations are in sync
npx prisma migrate deploy   # production: run before the app starts
```

## Deployment

The app is built for [Vercel](https://vercel.com). Set all environment variables in the project settings, run `prisma migrate deploy` before the app starts, and register `https://<your-domain>/api/webhooks/stripe` as a Stripe webhook endpoint (events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`). Enable `EMAIL_VERIFICATION_ENABLED` once a Resend domain is verified.
