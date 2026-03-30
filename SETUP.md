# Channel Companion — Live Environment Setup

## For Josh: Getting the Live Backend Running

### Overview

The live environment lets Owen enter real partner data, call notes, and transcripts through an admin UI at `/live`. The data feeds into live dashboard views at `/live/manager` and `/live/leader` that mirror the demo dashboards but use real data. An AI assistant powered by the Claude API is integrated into both views.

**Current state:** Everything works with JSON file storage (files in `data/live/`). To make it production-ready, you'll swap to Postgres. The architecture is designed so only one file changes.

---

### Quick Start (Development)

```bash
git clone <repo-url>
cd channel-companion
npm install
npm run dev
```

Visit `http://localhost:3000/live` to start entering data. The JSON files are created automatically in `data/live/`.

---

### Architecture

```
lib/db/index.ts      ← Database abstraction (swap this for Postgres)
lib/db/adapter.ts    ← Converts live DB types → demo component types
lib/db/schema.sql    ← Full Postgres schema (ready to run)

app/api/live/
  advisors/route.ts  ← CRUD: GET all, POST upsert, DELETE by id
  deals/route.ts     ← CRUD: GET (filterable by advisorId), POST upsert
  reps/route.ts      ← CRUD: GET all, POST upsert
  notes/route.ts     ← CRUD: GET (filterable), POST create
  transcripts/route.ts ← CRUD: GET (filterable), POST create
  ai/route.ts        ← Claude API integration

app/live/
  page.tsx           ← Admin UI (data entry, 6 tabs)
  manager/page.tsx   ← Live manager dashboard
  leader/page.tsx    ← Live leader dashboard

data/live/           ← JSON file storage (dev only, gitignored)
```

---

### Switching to Postgres (Railway)

**Time estimate: 1-2 hours**

1. **Add Postgres on Railway**
   - In the Railway dashboard, add a Postgres plugin to the project
   - Copy the `DATABASE_URL` connection string

2. **Set environment variables on Railway**
   ```
   DATABASE_URL=postgres://...  (from Railway)
   ANTHROPIC_API_KEY=sk-ant-...  (for Claude AI)
   ```

3. **Run the schema migration**
   Connect to the Railway Postgres instance and run `lib/db/schema.sql`:
   ```bash
   psql $DATABASE_URL < lib/db/schema.sql
   ```
   Or paste the contents into the Railway database console.

4. **Update `lib/db/index.ts`**
   Replace the JSON file operations with Postgres queries. The `postgres` npm package is already installed. Here's the pattern:

   ```typescript
   import postgres from 'postgres';

   const sql = postgres(process.env.DATABASE_URL!);

   export const db = {
     async getAdvisors() {
       return sql`SELECT * FROM advisors ORDER BY name`;
     },

     async upsertAdvisor(advisor) {
       return sql`
         INSERT INTO advisors ${sql(advisor)}
         ON CONFLICT (id) DO UPDATE SET ${sql(advisor)}
         RETURNING *
       `.then(rows => rows[0]);
     },

     // ... same pattern for all other methods
   };
   ```

   **Key point:** The API routes don't change at all. Only `lib/db/index.ts` changes.

5. **Deploy**
   Push to GitHub → Railway auto-deploys.

---

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | For Postgres | Railway Postgres connection string |
| `ANTHROPIC_API_KEY` | For AI chat | Claude API key (get from console.anthropic.com) |

Without `ANTHROPIC_API_KEY`, the AI chat shows a friendly fallback message instead of failing.

Without `DATABASE_URL`, the app uses JSON file storage automatically.

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
- **Deals** belong to an advisor and a rep
- **Reps** are the sales team members
- **Notes** can be linked to advisors, deals, or reps
- **Transcripts** are call recordings linked to advisors
- **Activity** is an auto-generated audit log

Signals (pulse, trajectory, friction) are stored directly on advisors for now. The schema includes an `advisor_signals` view for deriving them from activity data when you're ready for that.

---

### Notes for Owen

- The demo views (`/manager`, `/leader`) use static data and are unchanged
- The live views (`/live/manager`, `/live/leader`) fetch from the database
- Both can coexist — demo for pitch decks, live for actual demos
- The admin UI at `/live` has a "Manager View →" and "Leader View →" button in the header
