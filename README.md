# Unfuck My Past

A Next.js 15 app for personal growth and reflection, built with TypeScript, Tailwind CSS, Drizzle ORM, and PostgreSQL. It includes AI-assisted content (OpenAI), payments (Stripe), and a modern component library.

## Features
- Next.js App Router with TypeScript
- Tailwind CSS with shadcn/ui components
- Drizzle ORM + PostgreSQL
- OpenAI integration (no keys committed)
- Stripe payments
- Playwright E2E tests & Jest unit tests

## Quickstart
```bash
# 1) Install deps
npm install

# 2) Set required environment variables
# Create a .env.local and configure database and any provider keys
# (do not commit secrets)

# 3) Setup the database schema (Drizzle)
npm run db:push

# 4) Start dev server
npm run dev
```

## Useful Scripts
- dev: Start the Next.js dev server
- build: Build the app
- start: Run the production server
- db:gen / db:push / db:studio: Drizzle migrations and studio
- test / test:e2e: Run unit and E2E tests

## Tech Stack
- Next.js, React, TypeScript
- Tailwind CSS, shadcn/ui
- Drizzle ORM, PostgreSQL
- OpenAI API, Stripe
- Playwright, Jest

## License
ISC — see LICENSE for details.

