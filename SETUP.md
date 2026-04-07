# Channel Companion — Live Environment Setup

## For Josh: Getting the Live Backend Running

### Overview

The live environment lets Owen enter real partner data, call notes, and transcripts through an admin UI at `/live`. The data feeds into live dashboard views at `/live/manager` and `/live/leader` that mirror the demo dashboards but use real data. An AI assistant powered by the Claude API is integrated into both views.

**Current state:** The backend is fully wired to Postgres. You just need to provision a database and set the `DATABASE_URL` environment variable.

---

### Quick Start (Railway)

1. **Add Postgres on Railway**
   - In the Railway dashboard, click **+ New** → **Database** → **Add PostgreSQL**
   - Railway auto-creates a `DATABASE_URL` variable — link it to the app service

2. **Set environment variables**
   In the app service's Variables tab:
   ```
   DATABASE_URL=postgres://...  (auto-linked from Railway Postgres, or paste manually)
   ANTHROPIC_API_KEY=sk-ant-...  (for Claude AI chat)
   ```

3. **Run the schema**
   Connect to the Railway Postgres instance and run `lib/db/schema.sql`:
   ```bash
   # Option A: psql (if you have it locally)
   psql $DATABASE_URL < lib/db/schema.sql

   # Option B: Railway CLI
   railway run psql < lib/db/schema.sql

   # Option C: Paste the contents of lib/db/schema.sql into the Railway DB console (Data tab → Query)
   ```

4. **Deploy**
   Push to GitHub → Railway auto-deploys. That's it.

---

### Architecture

```
lib/db/index.ts      ← Postgres database layer (all queries live here)
lib/db/adapter.ts    ← Converts live DB types → demo component types
lib/db/schema.sql    ← Full Postgres schema (run this against your DB)

app/api/live/
  advisors/route.ts  ← CRUD: GET all, POST upsert, DELETE by id
  deals/route.ts     ← CRUD: GET (filterable by advisorId), POST upsert
  reps/route.ts      ← CRUD: GET all, POST upsert
  notes/route.ts     ← CRUD: GET (filterable), POST create
  transcripts/route.ts ← CRUD: GET (filterable), POST create
  signals/route.ts   ← Engagement signals: GET, POST (single/bulk), DELETE
  intent/route.ts    ← Revenue Intent scores: GET (computed from signals)
  ai/route.ts        ← Claude API integration

app/live/
  page.tsx           ← Admin UI (data entry, 7 tabs)
  manager/page.tsx   ← Live manager dashboard
  leader/page.tsx    ← Live leader dashboard
```

---

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | Postgres connection string (Railway, Neon, Supabase, etc.) |
| `ANTHROPIC_API_KEY` | For AI chat | Claude API key (get from console.anthropic.com) |

Without `ANTHROPIC_API_KEY`, the AI chat shows a friendly fallback message instead of failing.

**SSL:** The app auto-detects Railway, Neon, and Supabase hostnames and enables SSL. For other providers, SSL is off by default — the connection string can include `?sslmode=require` if needed.

---

### Engagement Signals & Revenue Intent

The system tracks buying signals to predict revenue conversion likelihood:

**Signal Types:** `quote_request`, `product_inquiry`, `pricing_request`, `demo_request`, `technical_eval`, `training_completed`, `portal_login`, `spec_download`

**Revenue Intent** is a computed score (0-100) per advisor based on weighted signals with a 1.5x recency boost for the last 30 days. Labels: Hot (70+), Warm (40-69), Interested (15-39), Cold (0-14).

Signals can be entered manually in the admin UI or bulk-imported via the API.

---

### API Reference

All endpoints are at `/api/live/`:

**Advisors** (`/api/live/advisors`)
- `GET` — Returns all advisors
- `POST` — Upsert advisor (include `id` to update, omit to create)
- `DELETE` — Delete advisor (pass `id` in query string)

**Deals** (`/api/live/deals`)
- `GET` — Returns all deals (optional `?advisorId=` filter)
- `POST` — Upsert deal

**Reps** (`/api/live/reps`)
- `GET` — Returns all reps
- `POST` — Upsert rep

**Notes** (`/api/live/notes`)
- `GET` — Returns notes (optional `?advisorId=` and `?dealId=` filters)
- `POST` — Create note

**Transcripts** (`/api/live/transcripts`)
- `GET` — Returns transcripts (optional `?advisorId=` filter)
- `POST` — Create transcript

**Signals** (`/api/live/signals`)
- `GET` — Returns signals (optional `?advisorId=`, `?signalType=`, `?since=` filters)
- `POST` — Create signal (single object or array for bulk)
- `DELETE` — Delete signal (pass `id` in query string)

**Revenue Intent** (`/api/live/intent`)
- `GET` — Returns computed Revenue Intent scores (optional `?advisorId=` filter)

**AI** (`/api/live/ai`)
- `POST` — Send message to Claude with portfolio context
  ```json
  {
    "message": "Prep me for a call with Sarah",
    "advisorId": "optional-id",
    "role": "manager",
    "conversationHistory": []
  }
  ```

---

### Data Model Quick Reference

See `lib/db/schema.sql` for the full Postgres schema. Key relationships:

- **Advisors** are the core entity (partners/channel advisors)
- **Deals** belong to an advisor and optionally a rep
- **Reps** are the sales team members
- **Notes** can be linked to advisors, deals, or reps
- **Transcripts** are call recordings linked to advisors
- **Signals** track engagement/buying signals per advisor
- **Activity** is an auto-generated audit log

All foreign keys use `ON DELETE CASCADE` — deleting an advisor removes their deals, notes, transcripts, signals, and activity automatically.

---

### Notes for Owen

- The demo views (`/manager`, `/leader`) use static data and are unchanged
- The live views (`/live/manager`, `/live/leader`) fetch from Postgres
- Both can coexist — demo for pitch decks, live for actual demos
- The admin UI at `/live` has "Manager View" and "Leader View" buttons in the header
- Data persists across deploys (it's in Postgres, not the filesystem)

---

## New Features (v2)

### PWA (Progressive Web App) Support
- Service Worker for offline caching and background sync
- Installable on mobile as a native-like app
- Cache-first strategy for static assets, network-first for API calls
- Offline support for previously accessed pages
- See `FEATURES.md` for details

### Admin Console (`/admin`)
- Multi-tab dashboard for system administration
- Users, Organization, Integrations, Billing, and Audit Log tabs
- User management with invite system
- Organization settings and usage tracking
- Integration status monitoring and configuration
- Plan management and billing history
- Complete audit trail of system changes
- See `FEATURES.md` for details

### Integration Management System
- Pre-built connectors for Salesforce, HubSpot, Gmail, Google Calendar, Gong, Fireflies, Slack
- OAuth flows for CRM and communication platforms
- Webhook receivers for meeting transcripts
- Meeting intelligence extraction (transcript parsing, sentiment analysis)
- Contact and deal sync helpers from Salesforce/HubSpot
- See `FEATURES.md` for details

### Mobile Responsive Design
- Bottom tab navigation on mobile (<768px)
- Fully responsive admin console and manager views
- Touch-friendly tap targets (min 44px)
- Optimized layouts for small screens
- See `FEATURES.md` for details

### Database Schema Updates
- New tables: `integrations`, `audit_log`, `transcripts`, `users`
- Indices for performance optimization
- Run migration: `migrations/001-integrations-schema.sql`
- See `FEATURES.md` for setup instructions

---

## Configuration for New Features

### Environment Variables (Optional)
```
# OAuth Provider Credentials (for integration OAuth flows)
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret

# Redirect URIs (base them on your domain)
SALESFORCE_REDIRECT_URI=https://yourdomain.com/api/integrations/salesforce/callback
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/integrations/hubspot/callback
SLACK_REDIRECT_URI=https://yourdomain.com/api/integrations/slack/callback
```

Note: These are optional. The system works with placeholder values during development.

### Database Migration
When ready to use integrations, apply the schema:
```bash
psql $DATABASE_PUBLIC_URL < migrations/001-integrations-schema.sql
```

Or run the migration script:
```bash
node scripts/run-migration.mjs
```

See `FEATURES.md` for complete details on all new features.
