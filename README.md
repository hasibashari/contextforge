# ContextForge

<div align="center">

> **AI-Powered Personal Context, Knowledge Graph & Autonomous Agentic Workspace**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B%20%7C%20pgvector-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2D8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-Ready-00A67E)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-UNLICENSED-grey.svg)](#license)

</div>

**ContextForge** is a fullstack, agentic AI-first workspace and developer control plane. It integrates multi-source knowledge ingestion, autonomous multi-step reasoning, isolated side-agent execution, dynamic artifact generation, and Model Context Protocol (MCP) connectors (including Obsidian, Google Calendar, Notion, and Android Bridge) — all orchestrated with zero ORM overhead on PostgreSQL (`pgvector`) and Google Gemini.

---

## 📑 Table of Contents

- [Overview & 5 Core Pillars](#overview--5-core-pillars)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup (Docker or Native)](#3-database-setup-docker-or-native)
  - [4. Install & Run Application](#4-install--run-application)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API & MCP Reference](#api--mcp-reference)
- [Model Context Protocol (MCP) Connectors](#model-context-protocol-mcp-connectors)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🏛️ Overview & 5 Core Pillars

ContextForge bridges raw language model intelligence with your actual working context. It is strictly built upon **5 Core Abstraction Pillars**:

| Pillar | Question Answered | Description |
| :--- | :--- | :--- |
| **1. Knowledge** | *"What does the AI know?"* | Document chunks, semantic vector embeddings (`pgvector`), and grounded RAG retrieval. |
| **2. MCP (Tools)** | *"What can the AI do?"* | Functional tool bridges adhering to the Model Context Protocol (Obsidian, Git, Google Calendar, Android Bridge). |
| **3. Skill (SOP)** | *"How does the AI execute?"* | Standard Operating Procedures and reasoning frameworks (TDD flow, note synthesis, calendar balance). |
| **4. Connection** | *"Where does the AI connect?"* | Provider credentials (Google Gemini, Claude), OAuth 2.0 tokens, and database authentication. |
| **5. Agent** | *"Who executes the task?"* | Read-only Core Orchestrator and isolated ephemeral Side Workers (Obsidian Worker, Code Sandbox, Calendar Worker). |

---

## ✨ Key Features

- 🤖 **Agentic Reasoning & Side-Agent Workers**  
  Multi-step planning and tool execution powered by Google Gemini (`gemini-3.5-flash-lite` / `gemini-2.5-flash`) with isolated side-workers for filesystem, code, or calendar mutations.

- 🧠 **Hybrid Semantic RAG & Knowledge Graph**  
  Document ingestion pipeline with vector embeddings (`gemini-embedding-2`, 1536 dim) stored in PostgreSQL using `pgvector` with zero ORM overhead via native `pg.Pool`.

- 🔌 **Model Context Protocol (MCP) Gateway**  
  Native support for local and remote MCP servers:
  - **Obsidian Vault Bridge**: Read, search, and mutate Markdown notes with `[[wiki-links]]` and YAML frontmatter.
  - **Google Calendar**: Dynamic task scheduling, conflict detection, and event rebalancing.
  - **Notion Integration**: Two-way database syncing via OAuth 2.0.
  - **Android Bridge**: Real-time ambient telemetry and focus mode enforcer.

- 🎯 **Epistemic Goals & Living Wiki**  
  Structured long-term goal tracking and self-evolving knowledge synthesis modules.

- 🗂️ **Dynamic Artifact Canvas**  
  Interactive workspace for generated code, documentation, architectural diagrams, and versioned diffs.

- ⚡ **Autonomous Workflow Automation**  
  Scheduled (CRON) and event-driven automations with built-in Human-In-The-Loop (HITL) safety gates.

- 💬 **Contextual Chat & Personal Hub**  
  Real-time streaming chat with persistent sessions, adaptive user preferences, and long-term memory recollection.

---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph Client_Layer ["🖥️ Frontend Client (React 19 + Vite + Tailwind CSS)"]
        UI_Chat["💬 Conversational Canvas\nStreaming Timeline & Multi-Modal"]
        UI_Artifacts["🗂️ Artifact Inspector\nCode / Markdown / Diffs"]
        UI_Control["⚙️ Control Plane\nAgents / Knowledge / Goals / Automations"]
    end

    subgraph Transport_Layer ["🛡️ Transport & Security Layer (NestJS 11)"]
        Guard["Auth & Workspace Guard"]
        Pipes["Validation Pipes (Zod & Class-Validator)"]
        SSE["SSE / WebSocket Real-time Stream"]
        REST["REST API Controllers (/api)"]
        EventBus["NestJS EventEmitter2 Engine"]
    end

    subgraph Agentic_Core ["🤖 Agentic Core (Gemini 3.5 Reasoning Engine)"]
        Orchestrator["Core Orchestrator\n(Planning & Read-Only Safe Reasoning)"]
        SkillEngine["Skill SOP Selector"]
        
        subgraph Side_Workers ["Ephemeral Execution Workers"]
            ObsidianWorker["Obsidian Vault Worker"]
            CodeWorker["CLI & Code Runner"]
            CalendarWorker["Calendar Rebalancing Worker"]
            AndroidWorker["Android Bridge Worker"]
        end
    end

    subgraph MCP_Gateway ["🔌 Model Context Protocol (MCP) Gateway"]
        MCP_Obsidian["Obsidian Vault Tool"]
        MCP_GCal["Google Calendar Tool"]
        MCP_Notion["Notion OAuth Tool"]
        MCP_Android["Android Bridge Telemetry & Focus"]
        MCP_Remote["Remote MCP (STDIO / SSE / HTTP)"]
    end

    subgraph Storage_Layer ["🗄️ Storage & Vector Engine (PostgreSQL 16+)"]
        DB_Relational[("Relational Tables\nSessions, Artifacts, Goals, Activity")]
        DB_Vectors[("pgvector Embeddings\ngemini-embedding-2 (1536 dim)")]
    end

    Client_Layer -->|REST / SSE / WS| Transport_Layer
    Transport_Layer --> Agentic_Core
    Agentic_Core --> SkillEngine
    Agentic_Core --> Side_Workers
    Side_Workers --> MCP_Gateway
    Transport_Layer --> Storage_Layer
    Agentic_Core --> Storage_Layer
    MCP_Gateway --> Storage_Layer
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version / Spec | Purpose |
| :--- | :--- | :--- |
| **[NestJS](https://nestjs.com/)** | `11.x` | Enterprise modular Node.js backend framework |
| **[TypeScript](https://www.typescriptlang.org/)** | `5.7+` | Type-safe application development |
| **[Google GenAI SDK](https://ai.google.dev/)** | `@google/genai 2.17+` | Gemini 3.5 Flash reasoning & embedding generation |
| **[PostgreSQL](https://www.postgresql.org/)** | `16+` | Primary relational & vector database |
| **[`pg`](https://node-postgres.com/)** | `8.23+` | High-performance native SQL connection pooling (zero ORM) |
| **[`pgvector`](https://github.com/pgvector/pgvector)** | `0.7+` | Vector similarity indexing and cosine distance search |
| **[NestJS EventEmitter](https://docs.nestjs.com/techniques/events)** | `3.1+` | Asynchronous decoupled domain event dispatching |
| **[WebSocket (`ws`)](https://github.com/websockets/ws)** | `8.18+` | Real-time bidirectional telemetry streaming |

### Frontend
| Technology | Version / Spec | Purpose |
| :--- | :--- | :--- |
| **[React](https://react.dev/)** | `19.x` | Modern reactive UI library |
| **[Vite](https://vitejs.dev/)** | `8.x` | Next-generation frontend bundler & dev server |
| **[Tailwind CSS](https://tailwindcss.com/)** | `4.x` | Utility-first high-performance styling engine |
| **[React Router](https://reactrouter.com/)** | `v7` | Client-side routing and nested layouts |
| **[Motion](https://motion.dev/)** | `13.x` | Fluid micro-interactions and transitions |
| **[Lucide React](https://lucide.dev/)** | `1.31+` | Modern, consistent icon library |
| **[React Markdown](https://github.com/remarkjs/react-markdown)** | `10.x` | Markdown and GFM renderer for chats and artifacts |

---

## 📂 Project Structure

```text
contextforge/
├── backend/                        # NestJS API Server (Port 3001)
│   ├── database/                   # SQL migration scripts & seeds
│   │   └── migrations/             # Schema definitions (.sql)
│   ├── src/
│   │   ├── agentic-core/           # Gemini client, Orchestrator, tool calling & embeddings
│   │   ├── common/                 # Database pool, security guards, filters & utilities
│   │   ├── config/                 # App, database, and model configurations
│   │   ├── mcp/                    # Model Context Protocol engine & connectors
│   │   │   ├── connectors/         # Android Bridge, Obsidian, GCal, Notion, Generic
│   │   │   ├── controllers/        # MCP OAuth & discovery controllers
│   │   │   └── core/               # MCP Protocol clients & registry
│   │   ├── modules/                # Domain-driven feature modules
│   │   │   ├── activity/           # Audit & telemetry logging
│   │   │   ├── artifacts/          # Generated artifact storage & versioning
│   │   │   ├── automation/         # Workflow automation & run scheduler
│   │   │   ├── chat/               # Chat sessions, SSE streams & messages
│   │   │   ├── ecosystem/          # Integrations & workspace agent management
│   │   │   ├── goals/              # Epistemic goals & mastery tracking
│   │   │   ├── knowledge/          # Ingestion pipelines & semantic vector search
│   │   │   ├── personal-hub/       # User memories & adaptive preferences
│   │   │   └── wiki/               # Self-evolving knowledge wiki
│   │   └── main.ts                 # Application entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React 19 + Vite Client (Port 5173)
│   ├── src/
│   │   ├── features/               # Feature-based presentation modules
│   │   │   ├── agents/             # Agent management & delegation UI
│   │   │   ├── automation/         # Automation builder & run triggers
│   │   │   ├── chat/               # Conversational UI & live streaming
│   │   │   ├── goals/              # Epistemic goal roadmap UI
│   │   │   ├── home/               # Dashboard & landing view
│   │   │   ├── integrations/       # MCP tool & OAuth connection manager
│   │   │   ├── knowledge/          # Knowledge base ingestion & vector search
│   │   │   └── settings/           # User configuration & preferences
│   │   ├── shared/                 # Shared UI components, hooks & state
│   │   ├── App.tsx                 # Main layout & router outlet
│   │   └── main.tsx                # Frontend entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                           # Architectural Specifications
│   ├── ERD.md                      # Complete Entity Relationship Diagram & DB schema
│   ├── TDD.md                      # Technical Design Document
│   └── llm-wiki.md                 # Knowledge & agentic reasoning architecture
│
├── docker-compose.yml              # PostgreSQL 16 + pgvector container definition
└── README.md                       # Project documentation
```

---

## 📋 Prerequisites

Ensure the following dependencies are installed on your host machine:

- **Node.js**: `>= 20.x` ([Download Node.js](https://nodejs.org/))
- **npm**: `>= 10.x`
- **Docker & Docker Compose**: Recommended for zero-friction database setup
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Notion & Google OAuth App Credentials**: For external service synchronization

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/hasibashari/contextforge.git
cd contextforge
```

### 2. Environment Configuration

Copy the sample environment file to create your backend configuration:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in your editor and configure your credentials:

```env
# Server
PORT=3001

# PostgreSQL Connection (matches docker-compose.yml defaults)
DATABASE_URL="postgresql://dev_user:password123@localhost:5432/context_db?schema=public"

# Google Gemini AI
GEMINI_API="your-google-gemini-api-key"
GEMINI_DEFAULT_MODEL="gemini-3.5-flash-lite"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSION="1536"

# Timezone
DEFAULT_TIMEZONE="Asia/Jakarta"
```

### 3. Database Setup (Docker or Native)

#### Option A: Docker Compose (Recommended)

Start the pre-configured PostgreSQL 16 container with `pgvector` enabled and SQL migrations automatically mounted:

```bash
docker compose up -d
```

Verify that the database container is healthy:

```bash
docker compose ps
```

#### Option B: Native PostgreSQL Setup

If using a local PostgreSQL 16+ instance without Docker:

```bash
# 1. Create database
createdb -U dev_user context_db

# 2. Enable required extensions
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 3. Run migrations
cd backend
psql -U dev_user -d context_db -f database/migrations/*.sql
cd ..
```

#### Optional: Seed Demo & Test Data

```bash
cd backend
npm run seed
cd ..
```

### 4. Install & Run Application

#### Terminal 1 — Start Backend Server

```bash
cd backend
npm install
npm run dev
```
> 🚀 **Backend API running at:** `http://localhost:3001`

#### Terminal 2 — Start Frontend Client

```bash
cd frontend
npm install
npm run dev
```
> ➜ **Frontend running at:** `http://localhost:5173`

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

> **Note on Network & CORS:** The Vite dev server automatically proxies all `/api` requests to `http://localhost:3001`, providing seamless communication during local development.

---

## ⚙️ Environment Variables

The backend requires the following environment variables configured in `backend/.env`:

| Variable | Type | Required | Default / Example | Description |
| :--- | :--- | :---: | :--- | :--- |
| `PORT` | `number` | No | `3001` | HTTP port for the NestJS server. |
| `DATABASE_URL` | `string` | **Yes** | `postgresql://dev_user:password123@localhost:5432/context_db` | Connection string for PostgreSQL with `pgvector`. |
| `GEMINI_API` | `string` | **Yes** | `AIzaSy...` | API key from Google AI Studio. |
| `GEMINI_DEFAULT_MODEL` | `string` | No | `gemini-3.5-flash-lite` | Primary LLM model for conversational reasoning. |
| `GEMINI_EMBEDDING_MODEL`| `string` | No | `gemini-embedding-2` | Embedding model for semantic vector indexing. |
| `GEMINI_EMBEDDING_DIMENSION`| `number` | No | `1536` | Embedding vector dimensions. |
| `DEFAULT_TIMEZONE` | `string` | No | `Asia/Jakarta` | Timezone context used for calendar & scheduling. |
| `NOTION_CLIENT_ID` | `string` | No | `your-notion-client-id` | Notion OAuth 2.0 client ID. |
| `NOTION_CLIENT_SECRET`| `string` | No | `your-notion-client-secret` | Notion OAuth 2.0 client secret. |
| `NOTION_REDIRECT_URI` | `string` | No | `http://localhost:3001/api/ecosystem/oauth/notion/callback` | Notion OAuth callback URL. |
| `GOOGLE_CLIENT_ID` | `string` | No | `your-google-client-id` | Google Calendar OAuth client ID. |
| `GOOGLE_CLIENT_SECRET`| `string` | No | `your-google-client-secret` | Google Calendar OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | `string` | No | `http://localhost:3001/api/ecosystem/oauth/google-calendar/callback` | Google Calendar OAuth callback URL. |

---

## 📜 Available Scripts

### Backend (`/backend`)

```bash
npm run dev          # Start NestJS in watch mode (hot-reload) on port 3001
npm run build        # Compile TypeScript to production bundle (dist/)
npm run start:prod   # Run production server bundle
npm run seed         # Execute database seed runners via ts-node
npm run test         # Execute test suites
npm run lint         # Run ESLint with auto-fix
npm run format       # Format all source files with Prettier
```

### Frontend (`/frontend`)

```bash
npm run dev          # Start Vite dev server with Hot Module Replacement on port 5173
npm run build        # Type-check and compile optimized production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint validation
```

---

## 🔌 API & MCP Reference

The backend exposes a modular REST and streaming API prefixed by `/api`:

| Route Prefix | Module | Method | Description |
| :--- | :--- | :---: | :--- |
| `/api/chat` | Chat | `GET`, `POST`, `SSE` | Manage conversation sessions, message history, and token streaming. |
| `/api/artifacts` | Artifacts | `GET`, `POST`, `PUT` | Versioned AI-generated outputs (code, markdown, schemas). |
| `/api/knowledge` | Knowledge | `GET`, `POST`, `DELETE` | Ingest sources, trigger vector chunking, and run similarity search. |
| `/api/goals` | Goals | `GET`, `POST`, `PATCH` | Manage epistemic goals, milestones, and mastery roadmaps. |
| `/api/wiki` | Living Wiki | `GET`, `POST` | Self-synthesizing knowledge wiki entries. |
| `/api/ecosystem` | Ecosystem | `GET`, `POST` | Workspace agents, custom tool registrations, and connection status. |
| `/api/automation` | Automation | `GET`, `POST`, `PATCH` | Configure CRON schedules, webhooks, and execution triggers. |
| `/api/personal-hub` | Personal Hub | `GET`, `POST`, `DELETE` | Long-term memory facts, persona customization, and adaptive context. |
| `/api/activity` | Activity | `GET` | Audit trail and system execution telemetry. |
| `/api/mcp/oauth/*` | MCP OAuth | `GET` | OAuth callback endpoints for Notion and Google Calendar integrations. |

Detailed database tables, triggers, and architectural contracts are documented in [`docs/ERD.md`](./docs/ERD.md) and [`docs/TDD.md`](./docs/TDD.md).

---

## 🌐 Model Context Protocol (MCP) Connectors

ContextForge implements native connectors adhering to the open **Model Context Protocol (MCP)** specification:

```mermaid
graph LR
    subgraph ContextForge ["ContextForge Nexus"]
        Gateway["MCP Gateway Service"]
        Agent["Gemini 3.5 Orchestrator"]
    end

    subgraph Connectors ["Active Connectors"]
        Obsidian["📝 Obsidian Vault Connector<br/>(Markdown, [[wiki-links]], Frontmatter)"]
        GCal["📅 Google Calendar Connector<br/>(Event Sync, Adaptive Reschedule)"]
        Notion["📓 Notion Connector<br/>(Pages & Database Ingestion)"]
        Android["📱 Android Bridge Connector<br/>(Ambient Telemetry & ZenMode)"]
        Generic["🔌 Remote MCP Client<br/>(STDIO / SSE / HTTP Streams)"]
    end

    Agent <--> Gateway
    Gateway <--> Obsidian
    Gateway <--> GCal
    Gateway <--> Notion
    Gateway <--> Android
    Gateway <--> Generic
```

### Connector Highlights:
1. **Obsidian Vault Bridge**: Direct filesystem access to Obsidian vaults with backlink extraction (`[[wiki-link]]`) and YAML metadata synthesis.
2. **Android Bridge**: Zero-file-scraping ambient telemetry (`UsageStatsManager`, `ZenMode / Bedtime Mode`, and `NotificationManager`) for focus session enforcement.
3. **Google Calendar**: Real-time event mutation, conflict analysis, and automated task re-balancing.
4. **Notion**: Database sync and two-way document synchronization via OAuth 2.0.

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests

```bash
cd backend
npm run test
```

### Code Formatting & Linting

```bash
# Format backend codebase
cd backend
npm run format
npm run lint

# Lint frontend codebase
cd ../frontend
npm run lint
```

---

## ❓ Troubleshooting & FAQ

<details>
<summary><b>1. Error: extension "vector" is not available</b></summary>

**Cause:** The PostgreSQL instance does not have the `pgvector` extension installed.  
**Resolution:**
- **Recommended:** Run PostgreSQL via Docker using `docker compose up -d` (uses the official `pgvector/pgvector:pg16` image).
- If running native PostgreSQL, follow the official [pgvector installation guide](https://github.com/pgvector/pgvector#installation) to compile and install the extension for your OS.
</details>

<details>
<summary><b>2. Google Gemini API 403 / Quota Exceeded</b></summary>

**Cause:** Invalid API key or quota limits reached.  
**Resolution:**
- Verify that your `GEMINI_API` key in `backend/.env` is valid and active on [Google AI Studio](https://aistudio.google.com/).
- Check that `GEMINI_DEFAULT_MODEL` is set to a supported model (e.g., `gemini-3.5-flash-lite` or `gemini-2.5-flash`).
</details>

<details>
<summary><b>3. Port Conflicts (Port 3001 or 5173 in use)</b></summary>

**Cause:** Another process is occupying the backend or frontend port.  
**Resolution:**
```bash
# Find process running on port 3001 or 5173
lsof -i :3001
lsof -i :5173

# Terminate process
kill -9 <PID>
```
</details>

<details>
<summary><b>4. Database Connection Refused (`ECONNREFUSED 127.0.0.1:5432`)</b></summary>

**Cause:** PostgreSQL container is stopped or still initializing.  
**Resolution:**
```bash
docker compose up -d
docker compose logs -f postgres
```
</details>

---

## 🗺️ Roadmap

- [x] Agentic Core with Google Gemini 3.5 Flash & Function Calling
- [x] High-performance `pgvector` hybrid semantic search RAG
- [x] Zero-ORM PostgreSQL Native SQL pool architecture
- [x] Model Context Protocol (MCP) Gateway (Obsidian, Calendar, Notion, Android Bridge)
- [x] Dynamic Artifacts Canvas with Markdown and Diff rendering
- [x] Living Wiki & Epistemic Goals tracking
- [ ] Multi-Modal voice interactions via Gemini Live API
- [ ] Cloud-native deployment blueprints (Google Cloud Run + Cloud SQL)
- [ ] Collaborative multi-user team workspaces

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(knowledge): add batch ingestion support"
   ```
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is currently **UNLICENSED** and reserved for private and educational use.

<div align="center">

Made with ❤️ for AI-Powered Context & Knowledge Management.

</div>
