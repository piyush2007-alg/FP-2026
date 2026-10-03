# Poultry Farm Management System (AeroFarm)

A comprehensive control panel and analytics dashboard for managing poultry farms. This project is structured with separate `frontend` and `backend` services.

## Tech Stack

- **Frontend**: React, Vite, Vanilla CSS (Premium Dark Theme)
- **Backend**: Node.js, Express, CORS, dotenv
- **Orchestration**: Concurrent local dev execution via root-level NPM script

## Directory Structure

```text
Poultry_Farm_Management_System/
├── frontend/             # React application (Vite-powered SPA)
│   ├── src/
│   │   ├── App.jsx       # Dashboard UI & React State
│   │   ├── index.css     # Premium UI styling and design tokens
│   │   └── main.jsx
│   └── vite.config.js    # Proxy configuration to API
├── backend/              # Node.js API server
│   ├── src/
│   │   └── server.js     # Express server & API routes
│   └── .env              # Environment config
├── package.json          # Root scripts to run both servers concurrently
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Quick Start

To install all dependencies for both frontend and backend and start the application in development mode, run the following commands in the project root:

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Run frontend and backend simultaneously:**
   ```bash
   npm run dev
   ```

The application will be accessible at:
- **Frontend Panel**: `http://localhost:5173/`
- **Backend API**: `http://localhost:5000/`

## Key Features

1. **Live Analytics**: Overview of total birds, daily egg production, and feed inventories.
2. **Flock Registry**: View and register new flocks (breed, bird count, age, purpose).
3. **Egg Production Logging**: Daily egg collection logs showing premium Grade A percentages.
4. **Feed Inventory Management**: Tracking daily usage and remaining supply alert logs.
