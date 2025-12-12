# Digital Medical Twin

A personal health data tracking application with AI-powered insights. Track lab results, doctor visits, medications, interventions, and health metrics in a unified timeline, then ask questions about your health history using AI.

## Features

- **Health Event Tracking** - Log 5 event types: Lab Results, Doctor Visits, Medications, Interventions, and Metrics
- **Master Timeline** - Chronological view with filtering, search, and date grouping
- **AI Historian** - Ask questions about your health history using GPT-4o or Gemini
- **RAG-Powered Chat** - Context-aware responses using your actual health data
- **Inline Citations** - Wikipedia-style source attribution for AI responses
- **Data Import/Export** - JSON and CSV formats for data portability
- **Biomarker Presets** - 10 common lab panels for quick data entry

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4o, Google Gemini (2.5 Flash, 2.5 Pro, 3 Pro Preview)
- **Testing**: Vitest (225 unit tests), Playwright (18 E2E tests)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- OpenAI or Google AI API key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mrdemonbkgit/digital-medical-twin.git
   cd digital-medical-twin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run database migrations:
   ```bash
   npx supabase login
   node scripts/run-migrations.cjs
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Run TypeScript type check |

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── ai/chat.ts         # AI chat endpoint
│   └── settings/ai.ts     # AI settings endpoint
├── docs/                   # Project documentation
├── e2e/                    # Playwright E2E tests
├── src/
│   ├── api/               # Client-side API layer
│   ├── components/        # React components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and AI logic
│   ├── pages/             # Page components
│   └── types/             # TypeScript types
└── supabase/migrations/   # Database migrations
```

## Documentation

- [Onboarding Guide](docs/ONBOARDING.md) - Project setup and architecture
- [Security](docs/SECURITY.md) - Security architecture and best practices
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md) - Data models
- [AI Integration](docs/architecture/AI_INTEGRATION.md) - AI feature architecture
- [Roadmap](docs/ROADMAP.md) - Development phases and progress

## Environment Variables

### Client-Side (Public)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Server-Side (Vercel)

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key for GPT-5.2 |
| `GOOGLE_API_KEY` | Google API key for Gemini |
| `ALLOWED_ORIGIN` | CORS origin (defaults to production URL) |

## License

Private - All rights reserved.
