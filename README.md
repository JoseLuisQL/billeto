<p align="center">
  <img src="./public/logo.svg" alt="Billeto Logo" width="64" />
</p>

<h1 align="center">Billeto</h1>

<p align="center">
  <strong>AI-powered personal finance SaaS — manage your money with natural language.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss" alt="Tailwind v4" />
</p>

---

## What is Billeto?

Billeto is a **multi-tenant personal finance platform** where users record transactions, track budgets, manage savings goals, and analyze spending — all through a **conversational AI assistant** or a traditional dashboard UI. It is designed for the Latin American market (Spanish, PEN currency by default) and supports **multi-currency operations** with live FX rates.

> **Think of it as:** A financial copilot that understands "Gasté 50 soles en almuerzo" and instantly creates a categorized, currency-converted transaction — no forms, no clicks.

---

## Key Features

### 🤖 AI Financial Assistant

- **Natural language transaction recording** — say "Gasté 30 en taxi" and the AI creates the transaction with the correct category, account, and currency automatically.
- **6 callable tools** the LLM invokes at runtime: `transactions_create`, `transactions_list`, `accounts_list`, `categories_list`, `analytics_summary`, `analytics_by_category`.
- **4-step category resolution cascade**: exact name match → user-defined rules engine → keyword heuristics (140+ keywords across 20 groups) → "Otros" fallback.
- **Document ingestion** — upload receipts (PDF, JPEG, PNG, WebP up to 8 MB) and the AI extracts merchant, amount, date, and suggested category with confidence scoring and duplicate detection.
- **Prompt injection defense** — 3-layer security: regex pattern blocklist (70+ patterns, EN/ES), input sanitization (strip fake system delimiters), and risk classification (`safe` / `suspicious` / `blocked`).
- **Idempotent transactions** via `requestId` to prevent duplicates from retries.
- **Tool loop guard** — detects and breaks infinite tool-calling loops.

### 📊 Dashboard & Analytics

- **Real-time balance tracking** across multiple accounts (bank, cash, digital wallets).
- **Visual analytics**: category pie charts, balance trend charts, flow-by-category breakdowns, activity heatmaps, and streak tracking — powered by Recharts.
- **Date range picker** with preset ranges for quick filtering.

### 💰 Transaction Management

- Full CRUD with **atomic balance updates** using Prisma `$transaction()`.
- **Multi-currency support** — live FX rates from Frankfurter API (ECB data), 1-hour in-memory cache, persisted to DB, graceful fallback to 1.0 if API fails.
- **Soft deletes** with `deletedAt`/`deletedBy` for audit trail compliance.
- **Transfer groups** for inter-account transfers.

### 🔁 Recurring Transactions

- Configurable subscriptions and periodic payments (daily, weekly, monthly, yearly).
- Cron-driven execution with `nextRunAt` scheduling.
- End conditions: never, by date, or by max occurrences.
- **Popular subscriptions catalog** (Netflix, Spotify, etc.) for quick setup.

### 🎯 Savings Goals

- Create custom goals or start from **templates** (emergency fund, travel, education, retirement).
- Progress tracking with visual indicators and monthly contribution estimates.
- **Goal contributions** linked to transactions — including automatic contributions from the rule engine.
- Smart insights: "requires attention" alerts when behind schedule.

### 📋 Budgets

- Per-category budget limits with configurable periods.
- **Alert thresholds** at 80% and 100% spending.
- Fixed and flexible budget types.

### ⚙️ Automation Rules

- User-defined rules with JSON conditions and actions for **automatic categorization** and **goal contributions**.
- Priority-based execution order.
- Rules integrate seamlessly with the AI assistant's transaction creation flow.

### 🔌 MCP Server

- Full **Model Context Protocol** server via [xmcp](https://github.com/nicepkg/xmcp), exposing Billeto's financial tools to external AI clients (Claude, Cursor, etc.).
- Tools mirror the chat API capabilities: create transactions, list accounts, query analytics.
- Includes **master agent prompt** with Chain-of-Thought + Few-Shot examples for optimal LLM orchestration.
- Resources and prompts served via standard MCP endpoints at `/mcp`.

### 🔐 Security & Multi-Tenancy

- **Workspace isolation** — every query is scoped to the active workspace via `requireWorkspaceAccess(minRole)`.
- **Role-based access control**: `owner`, `admin`, `member`.
- **Rate limiting**: sliding-window in-memory limiter for both server actions and API routes (40 req/min for AI chat).
- **Edge middleware** (`proxy.ts`): route protection via session cookie, IP-based rate limiting for auth and AI endpoints.
- **Audit logging** — all mutations create entries in `AuditLog` with before/after snapshots.
- **Scheduled account deletion** with grace period.

### 🌍 Integrations

- **WhatsApp integration** (planned) — schema-ready with `Integration` and `WhatsAppMessage` models.
- **Email integration** — verification flow, password reset with tokenized links.
- **Webhook support** — configurable per workspace.

### 🎨 Frontend

- **Dark mode by default** — premium, fintech-grade UI with Tailwind v4, shadcn/ui, and Radix UI.
- **Framer Motion** animations for smooth transitions.
- **React Flow** (`@xyflow/react`) for visual data representations.
- **Responsive layouts** — mobile-first sidebar, collapsible navigation.
- **Onboarding flow** — guided workspace setup for new users.

---

## Architecture

```
src/
├── app/
│   ├── (public)/          # Landing, pricing, product, FAQ, blog, manifesto
│   ├── (auth)/            # Login, register, password reset
│   ├── (onboarding)/      # Guided workspace setup
│   ├── (dashboard)/       # Authenticated app (transactions, accounts, goals, budgets, categories, assistant, profile)
│   ├── (admin)/           # System admin panel (config, users)
│   ├── api/
│   │   ├── ai/chat/       # AI assistant endpoint (streaming, tool-calling)
│   │   ├── auth/          # NextAuth route handlers
│   │   ├── cron/          # Recurring transactions, scheduled deletions
│   │   ├── geo/           # Geolocation services
│   │   └── user/          # User API
│   └── mcp/               # MCP server handler
├── components/
│   ├── ui/                # shadcn/ui primitives + custom logo
│   ├── dashboard/         # Charts, sidebar, date pickers
│   ├── landing/           # Public page components
│   ├── layout/            # Header, Footer
│   └── admin/             # Admin panel components
├── lib/
│   ├── actions/           # Server Actions (transactions, accounts, budgets, goals, rules, charts, auth, etc.)
│   ├── security/          # Prompt guard, rate limiting, workspace access, admin access
│   ├── fx-service.ts      # Multi-currency conversion (Frankfurter API)
│   ├── assistant-documents.ts  # Receipt/document AI ingestion (~43KB of logic)
│   ├── categories-defaults.ts  # Default category seeding + normalization
│   └── auth.ts            # NextAuth configuration
├── tools/                 # MCP tools (6 tools mirroring chat capabilities)
├── prompts/               # MCP agent prompts (master-agent, transaction-categorizer)
└── resources/             # MCP resources (config, users)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui + Radix UI |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| **Auth** | NextAuth v5 (JWT strategy) — Credentials + Google OAuth |
| **AI** | Vercel AI SDK + Google Gemini 2.5 Flash |
| **MCP** | xmcp framework |
| **Animations** | Framer Motion 12 |
| **Charts** | Recharts |
| **Validation** | Zod v4 |
| **Icons** | Lucide React |
| **Email** | Nodemailer |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Google AI API key (for Gemini)
- Google OAuth credentials (optional, for social login)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/billeto.git
cd billeto

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, GOOGLE_GENERATIVE_AI_API_KEY, etc.

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Available Scripts

```bash
npm run dev        # Development server (xmcp + Next.js in parallel)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint (flat config, Next.js core-web-vitals + TypeScript)
```

---

## Database Schema

The schema (`prisma/schema.prisma`) includes **22 models** covering the full domain:

| Model | Purpose |
|-------|---------|
| `User`, `AuthAccount`, `Session` | Authentication & identity |
| `Workspace`, `Membership` | Multi-tenant isolation |
| `Account` | Financial accounts (bank, cash, wallet) |
| `Transaction`, `Attachment` | Income/expense records with file uploads |
| `Category` | Transaction categorization (system + user-defined) |
| `Rule` | Automation rules (JSON conditions/actions) |
| `RecurringTransaction`, `PopularSubscription` | Subscriptions & periodic payments |
| `Budget` | Per-category spending limits |
| `Goal`, `GoalTemplate`, `GoalContribution` | Savings goals with contribution tracking |
| `FXRate` | Persisted exchange rates |
| `DocumentIngestion` | AI receipt/document processing records |
| `Integration`, `WhatsAppMessage` | External channel integrations |
| `AuditLog` | Full mutation audit trail |
| `Subscription` | Workspace plan management (Free/Pro/Premium) |
| `SystemConfig`, `AdminInvitation`, `Incident` | System administration |
| `AIProviderConfig`, `AIToolConfig` | AI provider and tool configuration |

---

## AI Agent Architecture

```
User Input
    │
    ▼
┌──────────────────────────┐
│  Prompt Injection Guard  │  ← 3-layer: pattern blocklist → sanitization → risk classification
│  (70+ regex patterns)    │
└──────────┬───────────────┘
           │
    ▼ safe/suspicious
┌──────────────────────────┐
│   Intent Classification  │  ← Greeting? Support? Capability query? Financial action?
└──────────┬───────────────┘
           │
    ▼ financial action
┌──────────────────────────┐
│   Document Flow Check    │  ← Receipt upload? Pending review? → AI extraction pipeline
└──────────┬───────────────┘
           │
    ▼ text query
┌──────────────────────────┐
│   Gemini 2.5 Flash       │  ← System prompt with workspace context, categories, preferences
│   + 6 Callable Tools     │
└──────────┬───────────────┘
           │
    ▼ tool call: transactions_create
┌──────────────────────────┐
│  Category Resolution     │
│  1. Exact name match     │
│  2. Rules engine         │  ← User-defined automation rules
│  3. Keyword heuristics   │  ← 140+ keywords, 20 groups
│  4. "Otros" fallback     │
└──────────┬───────────────┘
           │
    ▼
┌──────────────────────────┐
│  Multi-Currency FX       │  ← Frankfurter API → cache → DB persist
│  Atomic DB Transaction   │  ← Balance update + record creation
│  Goal Contributions      │  ← Auto-contribute from rule matches
└──────────────────────────┘
```

---

## License

Private. All rights reserved.
