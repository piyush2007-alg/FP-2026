# 🐔 Kukoo — Poultry Farm Management System (FP-2026)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg?logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/piyush2007-alg/FP-2026/pulls)

> **Enterprise-grade, real-time poultry farm operations & intelligence platform tailored for modern commercial and regional poultry farming operations.**

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
  - [Default Test Credentials](#default-test-credentials)
- [API Overview](#-api-overview)
- [Field Visit & Research Grounding](#-field-visit--research-grounding)
- [Deployment](#-deployment)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**Kukoo** (FP-2026) is a full-stack, real-time poultry farm governance and analytics platform. It eliminates fragmented manual registers and spreadsheets by consolidating flock telemetry, feed silo inventory, daily egg yield calculations, disease/biosecurity tracking, and automated vaccination scheduling into an intuitive, responsive dashboard.

Built with support for **9 Indian regional languages** (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Punjabi) and real-time **Server-Sent Events (SSE)**, Kukoo bridges the gap between field farm workers, veterinarians, and farm administrators.

---

## 🚀 Key Features

### 1. 📊 Real-Time Operations Hub & Live Telemetry
- **Live KPI Dashboard**: Instant bird census, active shed counts, daily egg collection rates, Feed Conversion Ratio (FCR), and silo levels.
- **Server-Sent Events (SSE)**: Synchronized data streaming across all connected staff and admin screens without manual refreshes.
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
│  - Chart.js Telemetry & Real-Time SSE Listeners        │
└───────────────────────────┬────────────────────────────┘
                            │
                     HTTP / REST & SSE
                            │
┌───────────────────────────▼────────────────────────────┐
│             Application Server (Express.js)            │
│  - JWT & Google OAuth2 Authentication                  │
│  - Role-Based Access Control (Admin / Vet / Staff)     │
│  - Real-Time Event Hub (Server-Sent Events)            │
│  - Business Logic & Health Analytics Engine            │
└───────────────────────────┬────────────────────────────┘
                            │
                   SQL Queries & PRAGMA
                            │
┌───────────────────────────▼────────────────────────────┐
│             Database Layer (SQLite 3)                  │
│  - users           - batches       - feed_stock        │
│  - egg_production  - vaccinations  - health_records    │
│  - alerts          - tasks         - feed_consumption  │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Chart.js, React-Chartjs-2, Vanilla CSS (Custom Design System & Tokens) |
| **Backend** | Node.js, Express.js, Server-Sent Events (SSE), CORS, Dotenv |
| **Database** | SQLite3 (Persistent disk storage, Foreign keys enabled, Auto-migrations) |
| **Security & Auth** | JWT (JSON Web Tokens), bcryptjs password hashing, Google OAuth2 |
| **Tooling** | Concurrently, Nodemon, Oxlint |

---

## 🔐 Role-Based Access Control (RBAC)

| Feature / Module | 👑 Admin | 🩺 Veterinarian | 👷 Staff / Worker |
|---|:---:|:---:|:---:|
| **Dashboard & Analytics** | Full Access | Full Access | Full Access |
| **Batch / Shed Management** | Create / Edit / Delete | Read-Only | Read-Only |
| **Feed Stock Management** | Inbound & Consumption | Read-Only | Log Daily Consumption |
| **Egg Production Logging** | Full Access | Read-Only | Log Daily Yield |
| **Vaccine Scheduling & Admin** | Full Access | Schedule & Administer | View Schedule |
| **Biosecurity & Health Logs** | Full Access | Diagnose & Treat | Read-Only |
| **User & Staff Governance** | Manage Accounts | Restricted | Restricted |
| **Reports & Data Export** | Full Export | Summary View | Restricted |

---

## 📁 Directory Structure

```text
Poultry_Farm_Management_System/
├── frontend/                   # React 19 Frontend Application (Vite)
│   ├── src/
│   │   ├── App.jsx             # Main Application Component & Sub-views
│   │   ├── index.css           # Design Tokens, Glassmorphism & Themes
│   │   ├── i18n.js             # Multilingual Translations (9 Languages)
│   │   └── main.jsx            # Application Entry Point
│   ├── vite.config.js          # Vite configuration & proxy settings
│   ├── package.json            # Frontend dependencies
│   └── .env.example            # Frontend environment template
│
├── backend/                    # Node.js API Server
│   ├── src/
│   │   ├── db.js               # SQLite schema, migrations & seed engine
│   │   └── server.js           # Express API endpoints & SSE broadcast
│   ├── poultry.db              # SQLite database (auto-generated)
│   ├── render.yaml             # Render deployment configuration
│   ├── package.json            # Backend dependencies
│   └── .env.example            # Backend environment template
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

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piyush2007-alg/FP-2026.git
   cd FP-2026
   ```

2. **Install all dependencies (Root, Frontend, & Backend):**
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` in both `backend` and `frontend` directories:
     ```bash
     # In backend directory
     cp backend/.env.example backend/.env

     # In frontend directory
     cp frontend/.env.example frontend/.env
     ```

4. **Start the Development Servers:**
   ```bash
   npm run dev
   ```
   *This command uses `concurrently` to spin up both the backend API and frontend Vite dev server concurrently.*

5. **Access the Application:**
   - 🖥️ **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
   - 🔌 **Backend REST API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=kukoo_enterprise_secret_2026

# Optional: Google OAuth 2.0 Integration
GOOGLE_CLIENT_ID=
```

### Frontend (`frontend/.env`)
```env
# Leave blank for local proxy development or set for production:
VITE_API_BASE_URL=

# Optional: Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=
```

---

## 👥 Default Test Credentials

Upon database initialization, the following pre-configured accounts are seeded:

| Role | Username | Password | Email |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | `admin@kukoo.app` |
| **Staff** | `staff` | `staff123` | `staff@kukoo.app` |
| **Veterinarian** | `vet` | `vet123` | `vet@kukoo.app` |

---

## 🔌 API Overview

### Authentication & Real-Time Streams
- `POST /api/register` — Register a new user account
- `POST /api/login` — Authenticate and receive JWT token
- `POST /api/google-login` — Sign in via Google OAuth
- `GET /api/auth/me` — Retrieve current authenticated session
- `GET /api/events` — Server-Sent Events (SSE) live data stream

### Core Operations
- `GET /api/summary` — Aggregated dashboard metrics (birds, eggs, feed, alerts)
- `GET /api/batches` \| `POST /api/batches` \| `PUT /api/batches/:id` — Batch/flock management
- `GET /api/feed/stock` \| `POST /api/feed/stock` — Inbound feed stock registry
- `GET /api/feed/consumption` \| `POST /api/feed/consumption` — Daily feed logs
- `GET /api/production` \| `POST /api/production` — Daily egg collection records
- `GET /api/vaccinations` \| `POST /api/vaccinations` — Vaccination schedule tracking
- `POST /api/vaccinations/administer` — Mark vaccine as administered
- `GET /api/health` \| `POST /api/health` — Biosecurity and disease tracking
- `GET /api/tasks` \| `POST /api/tasks` — Farm operational task checklist
- `GET /api/reports` — Consolidated exportable audit report

---

## 🌾 Field Visit & Research Grounding

The features and workflows in **Kukoo** are grounded in practical field research conducted at local poultry facilities (Bodhala farm):
- **Breed-Specific Production Dynamics**: Modeled yield variations across *Kadaknath*, *Desi*, and *Sonalika* breeds.
- **Disease Prevention Schedules**: Standardized vaccination protocols including **LaSota** and **Gumboro** regimens.
- **Dietary Calibration**: Ingestion monitoring tailored for grain rations (Wheat, Maize/Corn, Bajra/Pearl Millet) and commercial mash.
- **Common Infection Tracking**: Dedicated symptom tracking for prevalent conditions such as eye infections (*bitwin*) and respiratory distress.

---

## ☁️ Deployment

### Backend (Render / Node.js Host)
The backend includes a pre-configured `backend/render.yaml` blueprint:
- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Auto-generates `JWT_SECRET` and runs SQLite persistent storage.

### Frontend (Vercel / Netlify / Cloudflare Pages)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Set `VITE_API_BASE_URL` to your live backend URL.

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/piyush2007-alg/FP-2026/issues).

Distributed under the **MIT License**. See `LICENSE` for more information.
