# Open Layer Observability Platform — Comprehensive Project Audit

**Date:** October 25, 2026  
**Auditor:** Senior Full-Stack, QA, DevOps & Database Engineer  
**Workspace Root:** `c:\Users\prapu\OneDrive\Desktop\Open layer\open_layer_observability`

---

## 1. Executive Summary & Current Architecture

Open Layer is designed as an Enterprise Application Observability and Intelligent Monitoring Platform, targeted particularly at Banking, Financial Services, and Insurance (BFSI) enterprises. The platform aims to provide full-stack visibility across Application, Infrastructure, Database, API, and Business Workflow layers.

### Current High-Level Architecture
- **Frontend:** Single-Page Application (SPA) built with React 18, Vite 8, Recharts 2.15, and Lucide React icons. Styling is authored in custom CSS (`styles.css`).
- **Backend:** FastAPI application running on Python 3.11/3.12/3.15, using SQLAlchemy 2.0 ORM with PyMySQL and Pydantic Settings.
- **Authentication & Security:** JWT (JSON Web Tokens) encoded via `python-jose` with symmetric HMAC-SHA256, passwords hashed via `passlib[bcrypt]`.
- **Database & Persistence:** SQLAlchemy models declared in `app/models/entities.py`. The starter defaults to MySQL (`DATABASE_URL=mysql+pymysql://...`), but uses generic SQLAlchemy types (`String`, `Integer`, `Float`, `Boolean`, `DateTime`, `Text`, `JSON`) that are fully cross-compatible with SQLite and PostgreSQL.
- **Data Ingestion & APIs:** Endpoints organized under `/api` for applications, metrics, logs, alerts, incidents, traces, workflows, integrations, reports, and auth.

---

## 2. Existing Working Features

1. **Authentication & Session State:**
   - `POST /api/auth/login` verifies credentials and issues signed JWT bearer tokens.
   - `GET /api/auth/me` validates bearer tokens and returns the active user profile and role.
   - Frontend includes a complete login view, token storage in `localStorage`, and logout workflow.
2. **Application Registration Baseline:**
   - `POST /api/applications` validates input fields (name, owner, business function, environment, stack, hosting, criticality, SLA target) and records audit events (`application.create`).
   - `GET /api/applications` retrieves applications with optional substring search (`q`).
   - `PUT /api/applications/{id}` allows administrative updates and logs audit events.
3. **Telemetry Ingestion Endpoints:**
   - `POST /api/metrics` ingests metrics linked to existing applications.
   - `GET /api/metrics/{application_id}` queries metrics with limit and metric name filters.
   - `POST /api/logs` ingests log records with level, category, trace ID, and source.
   - `GET /api/logs/search` provides multi-field filtering (`q`, `level`, `category`, `application_id`).
   - `POST /api/traces` and `GET /api/traces` ingest and list distributed traces with multi-hop dependency chains.
4. **Alerts & Incidents:**
   - `POST /api/alerts` creates alerts and automatically promotes `Critical` alerts into new `Incident` records.
   - `GET /api/alerts/history` retrieves alerts by status.
   - `GET /api/incidents` lists operational incidents.
   - `PATCH /api/incidents/{id}` transitions incident status (e.g. `Acknowledged`, `Resolved`) and sets `resolved_at`.
5. **Business Workflows & Integrations (Metadata):**
   - `GET /api/workflows` and `POST /api/workflows` manage workflow stages, turnaround times (TAT), and process SLAs.
   - `GET /api/integrations` and `POST /api/integrations` manage catalog definitions for Cloud, DevOps, Monitoring, and Banking tools.
6. **Frontend Dashboard & Navigation:**
   - Multi-section navigation: Overview, Applications, Metrics, Logs, Distributed traces, Application map, Alerts & incidents, Business workflows, User experience, Security, AI insights, Integrations, Reports, Settings.
   - Production Vite build succeeds cleanly without compilation errors (`vite build` -> `dist/`).

---

## 3. Incomplete, Broken, or Misleading Features

1. **Hardcoded Fallback/Demo Data in Frontend:**
   - Several views (e.g. `trend` AreaChart in Overview, User Experience cards, Application Map) rely on static client-side constants rather than querying backend telemetry endpoints.
   - Clicking an application card in the Applications view merely triggers a toast message rather than navigating to a detailed application health view.
2. **Missing Real Report Generation & Export:**
   - Requirement Section 15 mandates PDF and Excel export for 6 report types: Application Health, SLA Compliance, Incident, Root Cause Analysis, Performance Trends, and Audit.
   - Currently, backend `/api/reports/{type}` only returns stub JSON for 4 of the 6 reports.
   - Frontend "Print / Save PDF" simply calls `window.print()`, and "Export" buttons call `window.print()` or alert dialogs. Excel export is completely missing.
3. **Analytics & AI Engine Depth:**
   - `app/services/analytics.py` is only 9 lines long and performs rudimentary static threshold checks.
   - Missing: Explainable root cause analysis (tracing dependency failure chains from transaction errors to database latency), anomaly detection on request rates and error spikes, and downtime/SLA risk forecasting.
4. **Database Engine Resilience & Development Portability:**
   - `app/config.py` hardcodes a local MySQL connection string. In environments without a running local MySQL daemon (such as local dev without Docker, or serverless test environments), the backend crashes on startup.
   - SQLAlchemy engine configuration lacks SQLite compatibility flags (`connect_args={"check_same_thread": False}`) when SQLite is used.
   - The standalone `database/schema.sql` file only contains 2 SQL statements (`CREATE DATABASE`) and no table definitions; all schema creation is done by SQLAlchemy.
5. **Integration Catalog Actions:**
   - Clicking "Configure integration" in the UI executes a JavaScript `alert()` instead of an interactive modal to configure endpoints, check connectivity, and safely test connection health.
6. **Log Management & Advanced Search:**
   - Requirement Section 5 specifies support for queries like *"Show all failed UPI transactions between 10 AM - 12 PM"*.
   - Current backend `/api/logs/search` lacks timestamp range filters (`start_time`, `end_time`).
7. **Automated Testing Suite:**
   - The workspace currently contains **zero automated tests**. Neither `pytest` nor frontend tests are configured, violating verification requirements.
8. **Deployment Configuration & Serverless Support:**
   - No `vercel.json` exists for Vercel deployment of the frontend (SPA client rewrites) or backend.
   - No Python serverless entry point (`index.py` or `api/index.py`) exists for hosting the API on Vercel Python runtime.
9. **Git Repository Status:**
   - Neither the parent directory `Open layer` nor `open_layer_observability` is currently a Git repository. No Git history or configured remotes exist in the local workspace.

---

## 4. Existing Dependencies and Their Purpose

### Backend (`backend/requirements.txt`)
- `fastapi` (0.115+): High-performance ASGI web framework for REST APIs.
- `uvicorn[standard]` (0.30+): Production ASGI web server.
- `sqlalchemy` (2.0+): Modern Python SQL toolkit and Object-Relational Mapper.
- `pymysql` (1.1+): Pure-Python MySQL database client driver.
- `pydantic-settings` (2.4+): Environment variable parsing and typed application settings.
- `python-jose[cryptography]` (3.3+): Cryptographic signing and decoding of JWTs.
- `passlib[bcrypt]` (1.7+): Secure password hashing using Bcrypt.
- `python-multipart` (0.0.9+): Parsing form data in HTTP requests.
- `email-validator` (2.2+): Robust email address format validation.
- *(Required Additions)*:
  - `pytest`, `httpx`: For executing automated backend test suites.
  - `openpyxl` or lightweight CSV/Excel generator: For native Excel report generation.

### Frontend (`frontend/package.json`)
- `react` / `react-dom`: Declarative UI component library.
- `vite` / `@vitejs/plugin-react`: Next-generation frontend build tooling and dev server.
- `lucide-react`: Modern vector icon set.
- `recharts`: Composable SVG-based charting library for React.

---

## 5. Database and Hosting Assumptions

1. **Database:**
   - Multi-database engine compatibility is essential. The SQLAlchemy models use ANSI standard types and JSON fields.
   - For local development and zero-cost CI/test runs, SQLite (`sqlite:///./open_layer.db`) provides instant zero-configuration persistence.
   - For staging/production, MySQL 8+ or PostgreSQL (e.g. Neon, Supabase, AWS RDS, Aiven) can be supplied via `DATABASE_URL`.
   - The redundant root `database/` directory can be consolidated: the SQL reference schema will be moved into `backend/database/` or `backend/migrations/`, eliminating root clutter.
2. **Hosting:**
   - **Frontend:** Vercel static site / SPA hosting with Vite build output `dist` and single-page routing rewrite rules in `vercel.json`.
   - **Backend:** Deployable as a standalone FastAPI service (Docker, Render, Railway, Fly.io, or AWS ECS/EC2) or as a serverless ASGI function on Vercel (`api/index.py`).

---

## 6. Deployment Blockers

1. **Missing `vercel.json`:** Without SPA rewrites, refreshing any route or accessing direct URLs on Vercel returns 404.
2. **Database Connectivity on Serverless:** On Vercel serverless functions, the filesystem is ephemeral and read-only (except `/tmp`). A durable remote database (`DATABASE_URL`) or in-memory/temp database for preview is required.
3. **CORS Origins Configuration:** Production deployment requires dynamically allowing the deployed Vercel frontend origin in `CORS_ORIGINS`.
4. **Missing GitHub Remote:** A local Git repository must be initialized, staged, committed, and linked to the user's remote repository.

---

## 7. Prioritized Implementation Plan

- **Phase 2 — Repository Structure & Database Cleanup:**
  - Standardize repo structure (`frontend/`, `backend/`, `docs/`, `.gitignore`, `README.md`).
  - Move/consolidate schema reference into `backend/` and remove redundant root `database/` directory.
- **Phase 3 — Backend Functionality & Requirements Completion:**
  - Multi-database support (MySQL, PostgreSQL, and SQLite with `check_same_thread: False`).
  - Add start/end time filtering to `/api/logs/search` and natural query parsing for failed transactions.
  - Complete all 6 reports in `/api/reports/{type}` with structured data and real Excel (`.xlsx` or `.csv`) export endpoints.
  - Enhance explainable AI analytics service: anomaly detection, causal chain correlation, SLA risk forecasting.
  - Add single application details (`GET /api/applications/{id}`) and workflow stage transition endpoints (`PATCH /api/workflows/{id}`).
  - Add integration testing endpoint (`POST /api/integrations/{id}/test`) with honest connectivity status reporting.
- **Phase 4 — Frontend Completion:**
  - Connect all dashboard charts, logs, traces, and metrics to live API endpoints with loading/empty states.
  - Add Application Details modal/drawer with live metrics and logs.
  - Add genuine PDF generation / CSV/Excel download handlers for reports.
  - Implement interactive integration configuration modal with real status indicators.
- **Phase 5 — Automated Testing:**
  - Implement comprehensive backend tests covering Auth, Applications, Metrics, Logs, Traces, Alerts, Incidents, Workflows, Integrations, and Reports.
  - Verify frontend production build and linting.
- **Phase 6 — Deployment & Git Configuration:**
  - Create `vercel.json` for frontend SPA.
  - Create serverless entry point for backend if deploying to Vercel Python runtime.
  - Initialize Git repository, configure `.gitignore` (ignoring `.env`, `venv`, `node_modules`, `dist`), create clear commits, and push to user's remote.
- **Phase 7 — Documentation & Traceability:**
  - Produce comprehensive `REQUIREMENTS_TRACEABILITY.md`, `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, and `DEPLOYMENT.md`.
