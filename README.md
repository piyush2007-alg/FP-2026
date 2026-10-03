# 🐔 Kukoo — Poultry Farm Management System (FP-2026)

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/piyush2007-alg/FP-2026/pulls)

> **Enterprise-grade, real-time poultry farm operations & intelligence platform tailored for modern commercial and regional poultry farming operations.**

> **🚀 Live Deployment:** [https://kukoo-piyushnagose-4585s-projects.vercel.app/](https://kukoo-piyushnagose-4585s-projects.vercel.app/)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
- [Field Visit & Research Grounding](#-field-visit--research-grounding)
- [Deployment](#-deployment)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**Kukoo** (FP-2026) is a frontend-centric, real-time poultry farm governance and analytics platform powered by Supabase. It eliminates fragmented manual registers and spreadsheets by consolidating flock telemetry, feed silo inventory, daily egg yield calculations, disease/biosecurity tracking, and automated vaccination scheduling into an intuitive, responsive dashboard.

Built with support for **9 Indian regional languages** (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Punjabi) and real-time database subscriptions, Kukoo bridges the gap between field farm workers, veterinarians, and farm administrators.

---

## 🚀 Key Features

### 1. 📊 Real-Time Operations Hub & Live Telemetry
- **Live KPI Dashboard**: Instant bird census, active shed counts, daily egg collection rates, Feed Conversion Ratio (FCR), and silo levels.
- **Supabase Realtime**: Synchronized data streaming across all connected staff and admin screens without manual refreshes.
- **Visual Analytics**: Interactive Chart.js graphs for egg production trends, grade quality distribution, and feed consumption metrics.

### 2. 🐥 Flock & Shed Lifecycle Registry
- Track batches by breed (*Hy-Line Brown, BV-300, Kadaknath, Desi, Sonalika, Cobb 500, Ross 308*).
- Monitor flock age, bird count, mortality rates, and active/culled statuses across multiple sheds.

### 3. 🌾 Feed Inventory & Silo Management
- Track inbound bulk feed receipts (Starter, Grower, Layer Mash, Finisher).
- Record daily consumption per shed/batch to calculate remaining silo capacity.
- **Automated Low-Stock Triggers**: Proactive alerts when feed inventories drop below safety thresholds.

### 4. 🥚 Egg Production & Yield Analytics
- Daily egg collection logging with automatic separation of Grade A and damaged eggs.
- Laying percentage and yield rate calculations per hen.
- Production trend comparison across sheds and historical periods.

### 5. 💉 Automated Vaccination & Health Governance
- Preventive vaccination schedule tracking (*LaSota, Gumboro / IBD, Marek's, Newcastle Disease / NDV, Fowl Pox*).
- Color-coded alerts for **Upcoming**, **Due Today**, and **Overdue** vaccination schedules.
- Complete biosecurity and veterinary health logs (disease symptoms, diagnosis, bitwin eye infections, medication, and treatment outcomes).

### 6. 🌐 Multilingual Accessibility & Smart Search
- Full localized UI supporting **9 languages** with instantaneous language switching.
- Global search across flocks, stock entries, health logs, and vaccination batches.
- Daily task assignment checklist with audit trails for staff operations.

---

## 🏗 System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Client Tier (React 19 + Vite)            │
│  - Responsive Dark-Theme Glassmorphism UI              │
│  - Multilingual Engine (9 Languages i18n)              │
│  - Chart.js Telemetry & Real-Time Supabase Sync        │
└───────────────────────────┬────────────────────────────┘
                            │
              Supabase JS Client (REST + Realtime)
                            │
┌───────────────────────────▼────────────────────────────┐
│                 Supabase Backend (BaaS)                │
│  - Supabase Auth (Email & Password)                    │
│  - PostgreSQL Database with Row Level Security (RLS)   │
│  - Realtime Subscriptions                              │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Chart.js, React-Chartjs-2, Vanilla CSS (Custom Design System & Tokens) |
| **Backend & DB** | Supabase (PostgreSQL, Realtime, Row Level Security, Supabase Auth) |
| **Security & Auth** | Supabase Authentication (Email/Password) |
| **Tooling** | Oxlint, Vite build pipeline |

---

## 📁 Directory Structure

```text
Poultry_Farm_Management_System/
├── frontend/                   # React 19 Frontend Application (Vite)
│   ├── src/
│   │   ├── App.jsx             # Main Application Component & Sub-views
│   │   ├── index.css           # Design Tokens, Glassmorphism & Themes
│   │   ├── i18n.js             # Multilingual Translations (9 Languages)
│   │   ├── supabaseClient.js   # Supabase Client Initialization
│   │   └── main.jsx            # Application Entry Point
│   ├── vite.config.js          # Vite configuration
│   ├── package.json            # Frontend dependencies
│   ├── vercel.json             # Vercel deployment configuration
│   └── .env.example            # Frontend environment template
│
├── supabase/                   # Supabase schema & initial migrations
│   └── schema.sql              # PostgreSQL schema, RLS policies, and seed data
│
├── ProjectInfo.txt             # Field visit findings & domain research
├── prd.md                      # Product Requirements Document
├── design-doc.md               # System Architecture & Design Spec
├── package.json                # Root orchestration scripts
└── README.md                   # Project Documentation
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: v22.x or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: A free Supabase project to host the database.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piyush2007-alg/FP-2026.git
   cd FP-2026
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` in the `frontend` directory:
     ```bash
     cp .env.example .env
     ```
   - Add your Supabase URL and Anon Key to `.env`.

4. **Initialize Supabase Database:**
   - Go to your Supabase project's SQL Editor.
   - Copy and paste the contents of `supabase/schema.sql` and run it. This creates all necessary tables, Row Level Security (RLS) policies, and default roles.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Access the Application:**
   - 🖥️ **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🌾 Field Visit & Research Grounding

The features and workflows in **Kukoo** are grounded in practical field research conducted at local poultry facilities (Bodhala farm):
- **Breed-Specific Production Dynamics**: Modeled yield variations across *Kadaknath*, *Desi*, and *Sonalika* breeds.
- **Disease Prevention Schedules**: Standardized vaccination protocols including **LaSota** and **Gumboro** regimens.
- **Dietary Calibration**: Ingestion monitoring tailored for grain rations (Wheat, Maize/Corn, Bajra/Pearl Millet) and commercial mash.
- **Common Infection Tracking**: Dedicated symptom tracking for prevalent conditions such as eye infections (*bitwin*) and respiratory distress.

---

## ☁️ Deployment

### Frontend (Vercel)
The project includes a `vercel.json` for easy deployment on Vercel:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Make sure to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel project settings.
- The `vercel.json` automatically rewrites all requests to `/index.html` for client-side routing.

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/piyush2007-alg/FP-2026/issues).

Distributed under the **MIT License**. See `LICENSE` for more information.
