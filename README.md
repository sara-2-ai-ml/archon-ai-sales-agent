# ARCHON. — AI Sales Outreach Agent

**ARCHON.** is an autonomous, multi-agent AI platform that finds leads, researches companies, writes hyper-personalized cold emails, and sends them — all with a Human-in-the-Loop approval step before any email leaves your inbox.

---

## What it does

ARCHON. runs a sequential pipeline of 5 specialized AI agents every time you start a campaign:

| Agent | Role | What it does |
|---|---|---|
| **Agent 01** · Lead Finder | Discovery | Uses Tavily web search + Claude to find real B2B companies matching your query |
| **Agent 02** · Researcher | Intel | Scrapes each company's website via Firecrawl and maps pain points, tech stack, and opportunities |
| **Agent 03** · Email Writer | Personalization | Writes a hyper-personalized cold email for each lead using Claude — no templates |
| **Agent 04** · Outreach | Sending | Sends approved emails via Resend API with follow-up scheduling |
| **Agent 05** · Reporter | Analytics | Generates a performance report with AI insights on open/reply rates |

### Key Features
- 🎯 **Advanced Campaign Filters** — filter by Company Size, Target Role, and Tech Stack
- ✅ **Human-in-the-Loop** — review, edit, or skip any email before it sends
- 📊 **Campaign History & Analytics** — BarChart + LineChart via Recharts
- 📤 **CSV Export** — export full campaign data with all lead details
- 🗑️ **Campaign Management** — delete campaigns with cascading DB cleanup
- 🤖 **AI Insights** — automated performance rating after each campaign

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **AI Models** | Claude (Anthropic) via Vercel AI SDK |
| **Web Search** | Tavily API |
| **Web Scraping** | Firecrawl |
| **Email Sending** | Resend |
| **Database** | SQLite via Prisma ORM + libsql adapter |
| **Animations** | Framer Motion |
| **3D Graphics** | Three.js |
| **Charts** | Recharts |
| **Styling** | Vanilla CSS |

---

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/archon.git
cd archon

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your API keys in .env.local

# 4. Push the database schema
npx prisma db push

# 5. Generate Prisma client
npx prisma generate

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Where to get it | Required |
|---|---|---|
| **Database** | Turso (libsql) via Prisma ORM |
| `TURSO_DATABASE_URL` | [turso.tech](https://turso.tech) | ✅ Yes |
| `TURSO_AUTH_TOKEN`   | [turso.tech](https://turso.tech) | ✅ Yes |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ✅ Yes |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) — free tier available | ✅ Yes |
| `RESEND_API_KEY` | [resend.com](https://resend.com) — free tier available | ✅ Yes |
| `RESEND_FROM_EMAIL` | Your verified sender email in Resend | ✅ Yes |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) — free tier available | ⚠️ Optional |
| `APOLLO_API_KEY` | [apollo.io](https://apollo.io) — free tier available | ⚠️ Optional |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | ⚠️ Optional |


> **Note:** If `TAVILY_API_KEY` or `RESEND_API_KEY` are missing, ARCHON. will fall back to **demo mode** — AI-generated leads and simulated email sends. No real emails will be sent.

---

## How to Run

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Database Management
```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

---

## Project Structure

```
archon/
├── app/
│   ├── api/
│   │   ├── campaign/route.js   # Main campaign API (POST, GET, PATCH, DELETE)
│   │   └── export/route.js     # CSV export endpoint
│   ├── components/             # UI components (AnimatedTerminal, BlobScene, etc.)
│   ├── dashboard/page.jsx      # Main dashboard UI
│   └── page.jsx                # Landing page
├── lib/
│   ├── agents/
│   │   ├── agent1_lead_finder.js
│   │   ├── agent2_researcher.js
│   │   ├── agent3_email_writer.js
│   │   ├── agent4_outreach.js
│   │   └── agent5_reporter.js
│   └── prisma.js               # Prisma client singleton
├── prisma/
│   └── schema.prisma           # Database schema
├── .env.example                # Environment variable template
└── package.json
```

---

## License

Sara Resulaj  © 2026 ARCHON. All rights reserved.
