# Veil Atlas

> **The invisible map of how a place truly feels.**  
> A real-time, anonymous, geospatial sensing platform that reveals the emotional, social, and temporal pulse of any location on Earth — without surveillance, tracking, or identity mapping.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://veil-atlas-app.vercel.app)
[![Database: AWS Aurora PostgreSQL](https://img.shields.io/badge/Database-AWS%20Aurora%20PostgreSQL-orange?style=flat&logo=amazon-aws)](https://aws.amazon.com/rds/aurora/)
[![Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org)

---

## 🌐 Live Demo
**[https://veil-atlas-app.vercel.app](https://veil-atlas-app.vercel.app)**

---

## 📖 Key Features

- **Required Consent Gating:** A modern onboarding card containing full legal agreements (Terms of Service, Privacy Policy) inline via glassmorphic overlays. Exploration is disabled until user consent is validated.
- **Dynamic 3D Clustering:** Markers automatically group into glowing 3D holographic buildings at low zoom levels (up to a 60 Km radius), breaking apart into individual pins as you zoom in.
- **Interactive Building Popups:** Clicking a building cluster displays a scrollable preview of all nested reports, secrets, or memories, with a "Zoom In" shortcut button to fly to coordinates and split them apart.
- **Sleek Glassmorphism UI:** Centered navigation icons with zero-jump hover animations, combined with a sleek, right-anchored 420px geocoding search bar with high backdrop blur.

---

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Hosting & Edge API:** Vercel Edge Network
- **Database:** AWS RDS Aurora PostgreSQL (Serverless v2)
- **Auth:** Passwordless AWS RDS IAM Authentication via OIDC tokens federated from Vercel.
- **Mapping:** React-Leaflet + OpenStreetMap Nominatim Geocoding API.
- **Styling:** CSS-first Tailwind CSS.
