# ContextForge

<div align="center">

> **AI-Powered Personal Context & Knowledge Management Platform**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B%20%7C%20pgvector-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2D8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-UNLICENSED-grey.svg)](#license)

</div>

ContextForge is a fullstack application that combines an agentic AI core with a knowledge management system, enabling users to have context-aware conversations, manage personal knowledge bases, automate workflows, and integrate with external services like Notion — all powered by the Google Gemini API.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Database Setup (Docker or Native)](#3-database-setup-docker-or-native)
  - [4. Run the Application](#4-run-the-application)
- [Available Scripts](#available-scripts)
- [Architecture Overview](#architecture-overview)
- [API Modules](#api-modules)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 🤖 **Agentic AI Core** — Multi-step reasoning with tool execution powered by Gemini (`gemini-3.5-flash-lite`)
- 💬 **Contextual Chat** — Persistent chat sessions with artifact generation and side-agent execution
- 📚 **Knowledge Base** — Semantic search using vector embeddings (`pgvector`) for RAG pipelines
- 🔗 **Ecosystem Integrations** — OAuth 2.0 connections (e.g., Notion) and workspace agent management
- ⚡ **Workflow Automation** — Trigger-based automations powered by workspace integrations
- 🧠 **Personal Hub** — User memories, calendar events, and activity logs
- 🗂️ **Artifacts** — Persistent generated outputs (code, documents, diffs) linked to chat sessions

---

## Tech Stack

### Backend

| Technology                                                        | Purpose                               |
| ----------------------------------------------------------------- | ------------------------------------- |
| [NestJS 11](https://nestjs.com/)                                  | Node.js server framework              |
| [TypeScript](https://www.typescriptlang.org/)                     | Language                              |
| [PostgreSQL 16+](https://www.postgresql.org/)                     | Primary database                      |
| [`pg`](https://node-postgres.com/)                                | Native SQL client (zero ORM)          |
| [`pgvector`](https://github.com/pgvector/pgvector)                | Vector embeddings for semantic search |
| [Google Gemini API (`@google/genai`)](https://ai.google.dev/)     | AI model & embeddings                 |
| [NestJS Event Emitter](https://docs.nestjs.com/techniques/events) | Async event-driven communication      |

### Frontend

| Technology                                                   | Purpose                 |
| ------------------------------------------------------------ | ----------------------- |
| [React 19](https://react.dev/)                               | UI framework            |
| [TypeScript](https://www.typescriptlang.org/)                | Language                |
| [Vite 8](https://vitejs.dev/)                                | Build tool & dev server |
| [Tailwind CSS 4](https://tailwindcss.com/)                   | Styling                 |
| [React Router v7](https://reactrouter.com/)                  | Client-side routing     |
| [Motion](https://motion.dev/)                                | Animations              |
| [Lucide React](https://lucide.dev/)                          | Icons                   |
| [React Markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering      |

---

## Project Structure

```
contextforge/
├── backend/                # NestJS API server (port 3001)
│   ├── src/
│   │   ├── agentic-core/   # Gemini client, orchestrator, tools, embeddings
│   │   ├── modules/
│   │   │   ├── activity/   # Activity log tracking
│   │   │   ├── artifacts/  # Generated artifact management
│   │   │   ├── automation/ # Workflow automation & runs
│   │   │   ├── chat/       # Chat sessions & messages
│   │   │   ├── ecosystem/  # Workspace agents, integrations, OAuth (Notion)
│   │   │   ├── knowledge/  # Knowledge sources & vector chunks
│   │   │   └── personal-hub/ # Users, memories, calendar events
│   │   ├── common/         # Database module, security, utilities
│   │   ├── config/         # App, database, and Gemini configuration
│   │   └── mcp/            # MCP (Model Context Protocol) integration
│   ├── database/           # SQL migration scripts
│   └── test/               # e2e test suites
│
├── frontend/               # React + Vite client (port 5173)
│   └── src/
│       ├── features/
│       │   ├── agents/     # Agent management UI
│       │   ├── automation/ # Automation workflow UI
│       │   ├── dashboard/  # Main dashboard
│       │   ├── home/       # Home / landing page
│       │   ├── integrations/ # Ecosystem integrations UI
│       │   ├── knowledge/  # Knowledge base UI
│       │   └── settings/   # User settings UI
│       └── shared/         # Shared components, hooks, utilities
│
├── docs/
│   ├── ERD.md              # Full Entity Relationship Diagram & DB specification
│   └── TDD.md              # Technical Design Document
│
└── docker-compose.yml      # Local database service (Postgres + pgvector)
```

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** `>= 20.x`
- **npm** `>= 10.x`
- **Docker & Docker Compose** _(Recommended for DB setup)_ OR native **PostgreSQL 16+** with `pgvector`
- A **Google Gemini API** key ([Get one here](https://ai.google.dev/))
- _(Optional)_ A **Notion OAuth App** for ecosystem integration

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hasibashari/contextforge.git
cd contextforge
```

### 2. Configure Environment Variables

Create the backend environment file from the template:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual credentials:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://dev_user:password123@localhost:5432/context_db?schema=public"

# Google Gemini API
GEMINI_API="your-gemini-api-key"
GEMINI_DEFAULT_MODEL="gemini-3.5-flash-lite"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSION="1536"

# Notion OAuth 2.0 (optional)
NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"
NOTION_REDIRECT_URI="http://localhost:3001/api/ecosystem/oauth/notion/callback"
```

---

### 3. Database Setup (Docker or Native)

#### Option A: Using Docker Compose (Recommended)

Start the PostgreSQL instance with `pgvector` pre-configured and migrations auto-mounted:

```bash
docker compose up -d
```

#### Option B: Using Native PostgreSQL

If running PostgreSQL locally without Docker, ensure required extensions are enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Run database migrations:

```bash
createdb -U dev_user context_db
cd backend
psql -U dev_user -d context_db -f database/migrations/*.sql
```

#### Optional: Seed Initial Data

```bash
cd backend
npm run seed
```

---

### 4. Run the Application

#### Start the Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```
> 🚀 **Backend runs at:** `http://localhost:3001`

#### Start the Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```
> ➜ **Frontend runs at:** `http://localhost:5173`

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

> *Note:* The Vite dev server proxies all `/api` requests to `http://localhost:3001`, so no manual CORS configuration is needed during development.

---

## Available Scripts

### Backend (`/backend`)

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Start in watch mode on port `3001`                 |
| `npm run start:prod` | Start production server (`node dist/main`)         |
| `npm run build`      | Compile TypeScript to `dist/`                      |
| `npm run seed`       | Run database seeders via `ts-node`                 |
| `npm run test`       | Run unit tests (Jest)                              |
| `npm run test:e2e`   | Run end-to-end tests                               |
| `npm run test:cov`   | Run tests with coverage report                     |
| `npm run lint`       | Lint and auto-fix source files (ESLint + Prettier) |
| `npm run format`     | Format all `.ts` files with Prettier               |

### Frontend (`/frontend`)

| Script            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR on port `5173`  |
| `npm run build`   | Type-check and build for production to `dist/` |
| `npm run preview` | Preview production build locally               |
| `npm run lint`    | Run ESLint                                     |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│               React Frontend  :5173                        │
│         (Vite + React 19 + Tailwind CSS + React Router)    │
└───────────────────────┬────────────────────────────────────┘
                        │  REST API / SSE  →  proxy /api → :3001
┌───────────────────────▼────────────────────────────────────┐
│               NestJS Backend  :3001                        │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Agentic Core                       │   │
│  │  Gemini Client (gemini-3.5-flash-lite)              │   │
│  │  → Orchestrator → Tools / Handlers                 │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Domain Modules                         │   │
│  │  Chat · Artifacts · Knowledge · Ecosystem ·         │   │
│  │  Automation · Personal Hub · Activity               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │  Native SQL via pg pool          │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│               PostgreSQL 16+  :5432                        │
│   DB: context_db                                           │
│   Extensions: pgvector · uuid-ossp · pgcrypto              │
│   Embeddings: gemini-embedding-2 (dim: 1536)               │
└────────────────────────────────────────────────────────────┘
```

---

## API Modules

The backend exposes a RESTful API under `/api`. Key module prefixes:

| Prefix                                 | Module       | Description                                     |
| -------------------------------------- | ------------ | ----------------------------------------------- |
| `/api/chat`                            | Chat         | Manage sessions and messages                    |
| `/api/artifacts`                       | Artifacts    | Create and retrieve AI-generated artifacts      |
| `/api/knowledge`                       | Knowledge    | Manage knowledge sources and semantic search    |
| `/api/ecosystem`                       | Ecosystem    | Workspace agents, integrations, and OAuth flows |
| `/api/ecosystem/oauth/notion/callback` | Notion OAuth | Notion OAuth 2.0 callback endpoint              |
| `/api/automation`                      | Automation   | Define and trigger automated workflows          |
| `/api/personal-hub`                    | Personal Hub | Users, memories, and calendar events            |
| `/api/activity`                        | Activity     | Activity log retrieval                          |

Full API documentation and database schema are available in [`docs/ERD.md`](./docs/ERD.md) and [`docs/TDD.md`](./docs/TDD.md).

---

## Troubleshooting

<details>
<summary><b>1. Error: extension "vector" is not available</b></summary>

If you encounter `ERROR: extension "vector" is not available` when running migrations on a native PostgreSQL installation:
- Use Docker with `docker compose up -d` which uses the official `pgvector/pgvector:pg16` image.
- Or install `pgvector` on your host machine following the [pgvector installation guide](https://github.com/pgvector/pgvector#installation).
</details>

<details>
<summary><b>2. Gemini API 403 / Quota Exceeded</b></summary>

- Ensure your `GEMINI_API` key in `backend/.env` is active and has billing/quota enabled at [Google AI Studio](https://aistudio.google.com/).
- Verify that `GEMINI_DEFAULT_MODEL` is set to a supported model (e.g. `gemini-3.5-flash-lite` or `gemini-2.5-flash`).
</details>

<details>
<summary><b>3. Port Conflict (3001 or 5173 already in use)</b></summary>

- Check running processes:
  ```bash
  lsof -i :3001
  lsof -i :5173
  ```
- Terminate any stale processes with `kill -9 <PID>`.
</details>

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add knowledge source pagination
   fix: resolve chat session memory leak
   docs: update API module table
   ```
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request at [github.com/hasibashari/contextforge](https://github.com/hasibashari/contextforge)

---

## License

This project is **UNLICENSED** and is intended for private use only.
