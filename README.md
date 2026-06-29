# Veil Atlas

> **The invisible map of how a place truly feels.**  
> A real-time, anonymous, geospatial sensing platform that reveals the emotional, social, and temporal pulse of any location on Earth — without surveillance, ads, or identity.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://veil-atlas-app.vercel.app)
[![Database: AWS Aurora PostgreSQL](https://img.shields.io/badge/Database-AWS%20Aurora%20PostgreSQL-orange?style=flat&logo=amazon-aws)](https://aws.amazon.com/rds/aurora/)
[![Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌐 Live Demo

**[https://veil-atlas-app.vercel.app](https://veil-atlas-app.vercel.app)**

---

## 📖 What is Veil Atlas?

Veil Atlas is a civic mapping tool built on the idea that **places have feelings** — fear, joy, rhythm, memory, truth — that never appear on any existing map. Through five distinct anonymous sensing layers, users contribute to a shared, living portrait of the world as it is actually experienced.

No accounts. No tracking. No feeds. Just the signal of a place.

---

## ✨ Five Sensing Layers

### ⚡ NOW — Live Proximity Signals
Real-time ephemeral signals broadcast to people within **500 metres**. Messages expire in **30 minutes**, creating a hyper-local, vanishing moment of connection. Like a whisper network on the map.

- Broadcasts to a geo-radius, not to "followers"
- Posts auto-expire — no permanent trace
- Clustered into holographic 3D towers on the map when zoomed out

### 🌡 FEEL — Emotional Weather & Confessions
An anonymous emotional barometer for any location. Users log their **mood** (peaceful / joyful / anxious / melancholy / alive) and pin anonymous **confessions** — secrets, thoughts, observations tied to a place forever.

- Dominant mood aggregation over the past 7 days
- Anonymous confessions linked to GPS coordinates
- Mood pins shown with emotion-colour-coded markers

### 👁 TRUTH — Safety & Exclusion Incidents
A community-sourced safety map. Document incidents with type (harassment, surveillance, exclusion, unsafe area) and time-of-day metadata, creating a hyperlocal truth record.

- Incident types: Harassment, Surveillance, Exclusion, Unsafe
- Time-of-day categorisation for pattern detection
- My reports list with deletion capability

### 🕰 MEMORY — Place Memories & Echoes
Log a personal memory to any location. Memories are geo-pinned forever, building a collective archive of a place's lived history. Time-locked **Echoes** (require physical presence to unlock) are also supported.

- Year-labelled memories anchored to coordinates
- Echo messages that require proximity to read
- Full-text memory cards with contributor timestamps

### 〜 RHYTHM — Neighbourhood Breathing Patterns
Reveals **when** a place is most alive using anonymised check-in data. Aggregates check-ins by hour-of-day and day-of-week. Uses **longitude-aware local time** — each location's rhythms are calculated in its own timezone.

- "Most Alive" hour and day computed per location
- Timezone offset derived from longitude (±UTC heuristic)
- Weekly grid visualising relative density by hour × day

---

## 🗺️ Map Features

| Feature | Detail |
|---|---|
| **Zoom-aware clustering** | Pins group into holographic 3D tower buildings as you zoom out; expand into individual dots zoomed in |
| **Jitter spreading** | Multiple pins at identical GPS coords spread radially (deterministic, seed-based) so each is individually clickable |
| **Layer isolation** | Each layer renders only its own pins — no visual cross-contamination |
| **Dark / Light mode** | Full theme support with CartoDB dark/light tile layers |
| **Search** | Nominatim geocoder with debounced input — fly to any location on Earth |
| **FlyTo animation** | Smooth 1.2s Leaflet camera pan on location select |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                Vercel Edge Network               │
│  ┌──────────────────────────────────────────┐   │
│  │         Next.js 16 App Router            │   │
│  │                                          │   │
│  │  /app/page.tsx         (React client)    │   │
│  │  /components/MapContent.tsx  (Leaflet)   │   │
│  │  /components/layers/         (panels)    │   │
│  │                                          │   │
│  │  /app/api/now/         POST/GET signals  │   │
│  │  /app/api/feel/        GET moods         │   │
│  │  /app/api/feel/pins/   POST/GET/DELETE   │   │
│  │  /app/api/truth/       POST/GET/DELETE   │   │
│  │  /app/api/memory/      POST/GET/DELETE   │   │
│  │  /app/api/rhythm/      POST/GET          │   │
│  └──────────────────────────────────────────┘   │
│                     │                           │
│         OIDC Token Exchange (Vercel→AWS)         │
│                     │                           │
│  ┌──────────────────▼─────────────────────┐     │
│  │    AWS RDS Aurora PostgreSQL            │     │
│  │    IAM Authentication (no passwords)   │     │
│  │                                         │     │
│  │  tables: static_pins, emotional_records │     │
│  │          incidents, memories, checkins  │     │
│  │          echoes                         │     │
│  │  functions: haversine(lat,lng,lat,lng)  │     │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 🔒 Privacy & Security

- **Zero accounts** — users are identified by an anonymous UUID stored in `localStorage` only
- **Hashed ownership** — contributors are stored as a SHA-256-like hash, never the raw UUID
- **No PII stored** — no names, emails, or device IDs enter the database
- **IAM-only DB access** — the database has no password; Vercel uses AWS OIDC tokens to obtain short-lived RDS IAM tokens
- **Ephemeral signals** — NOW layer posts expire in 30 minutes automatically
- **Anonymous confessions** — FEEL layer pins have no linkable identity

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Deployment** | Vercel (Edge Network) |
| **Database** | AWS Aurora PostgreSQL (Serverless v2) |
| **Auth** | AWS IAM + Vercel OIDC token exchange |
| **Maps** | Leaflet + React-Leaflet, CartoDB tiles |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Styling** | Tailwind CSS v4 |
| **Language** | TypeScript |

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- An AWS RDS Aurora PostgreSQL cluster with IAM authentication enabled
- A Vercel project connected to this repo (for OIDC credentials)

### Environment Variables

Create `.env.local`:

```env
# AWS RDS Aurora
STORAGE_PGHOST=your-aurora-cluster.cluster-xxxxxx.region.rds.amazonaws.com
STORAGE_PGPORT=5432
STORAGE_PGUSER=your_iam_db_user
STORAGE_PGDATABASE=your_database_name
STORAGE_AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/YourVercelRole
STORAGE_AWS_REGION=us-east-1

# Optional: protects /api/setup in production
SETUP_SECRET=your_secret_here
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Initialisation

After setting environment variables, run the schema setup:

```bash
# In development (no secret required):
curl http://localhost:3000/api/setup

# In production:
curl -H "x-setup-secret: your_secret" https://your-domain.vercel.app/api/setup
```

This creates all tables, indexes, and the `haversine()` PostgreSQL function.

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                 # Root client page, all state management
│   ├── api/
│   │   ├── now/route.ts         # Live signals (POST/GET, 30m expiry)
│   │   ├── feel/route.ts        # Emotional mood records (GET)
│   │   ├── feel/pins/route.ts   # Anonymous confessions (POST/GET/DELETE)
│   │   ├── truth/route.ts       # Safety incidents (POST/GET/DELETE)
│   │   ├── memory/route.ts      # Geo-pinned memories (POST/GET/DELETE)
│   │   ├── rhythm/route.ts      # Check-ins + rhythm analysis (POST/GET)
│   │   ├── now/replies/route.ts # Echo replies
│   │   └── setup/route.ts       # DB schema initialisation
│   └── globals.css
├── components/
│   ├── Map.tsx                  # Lazy-loaded map wrapper
│   ├── MapContent.tsx           # Leaflet markers, clustering, layers
│   ├── LeftNavigation.tsx       # Layer selector sidebar
│   ├── SearchBar.tsx            # Geocoder search bar
│   ├── BottomSheet.tsx          # Mobile-friendly panel drawer
│   ├── LayerSelector.tsx        # Mobile layer picker
│   └── layers/
│       ├── NowPanel.tsx         # NOW layer panel
│       ├── FeelPanel.tsx        # FEEL layer panel
│       ├── TruthPanel.tsx       # TRUTH layer panel
│       ├── MemoryPanel.tsx      # MEMORY layer panel
│       └── RhythmPanel.tsx      # RHYTHM layer panel
├── lib/
│   ├── db.ts                    # AWS RDS IAM auth PostgreSQL client
│   └── theme-context.tsx        # Dark/light theme context
└── types/
    └── index.ts                 # Shared TypeScript types
```

---

## 🏆 Hackathon

Built for **[Hack the Zero](https://hackathezero.com)** — a hackathon focused on meaningful technology with Vercel and AWS.

**Stack constraints used:**
- ✅ Vercel deployment + OIDC token bridge
- ✅ AWS RDS Aurora PostgreSQL (no DynamoDB — relational geo-queries require SQL)
- ✅ Next.js App Router for full-stack edge functions

---

## 📜 License

MIT © 2026 Veil Atlas
