# Open Layer — Application Observability & Intelligent Monitoring Platform

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/Tests-26%20Passed%20(100%25)-brightgreen.svg?style=for-the-badge&logo=pytest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Vercel-Ready-000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📌 Executive Summary

**Open Layer** is an enterprise-grade Application Observability & Intelligent Monitoring Platform engineered strictly to satisfy the official specification (**Second AI Full Stack Developer Task - Open Layer – Application Observability Module Task 3**).

The platform delivers full 360° operational visibility across multi-cloud infrastructure, microservices, databases, and critical business workflows. It correlates telemetry across 4 discrete layers, identifies anomalies using statistical $3\sigma$ heuristics, isolates root causes with multi-hop causal graphs, and tracks mission-critical financial journeys (Loan Origination, UPI Instant Payments, KYC Verification).

---

## 🏗️ Architecture & 4-Tier Telemetry

The platform ingests, tags, correlates, and analyzes telemetry across four distinct architectural tiers:

```
+-----------------------------------------------------------------------------------+
|                            React 18 Single Page App (Vite)                        |
|   360° Dashboard  •  Trace Waterfall  •  Natural Query Logs  •  RCA Causal Graph  |
+-----------------------------------------------------------------------------------+
                                         │  HTTPS / REST (JWT Bearer)
                                         ▼
+-----------------------------------------------------------------------------------+
|                            FastAPI Asynchronous Backend Core                      |
|   • Strict 5-Tier RBAC (Admin, SRE, DevOps, Developer, Viewer)                    |
|   • Ingestion Validation Engine (Pydantic v2)                                     |
|   • Explainable AI Analytics (3-Sigma Anomaly Detection & Causal Graph RCA)       |
|   • Alert Rules & Automated Incident Lifecycle Evaluation                         |
+-----------------------------------------------------------------------------------+
       │                   │                      │                     │
       ▼                   ▼                      ▼                     ▼
┌──────────────┐    ┌──────────────┐       ┌──────────────┐      ┌──────────────┐
│  Application │    │Infrastructure│       │   Database   │      │     API      │
│  Telemetry   │    │  Telemetry   │       │  Telemetry   │      │  Telemetry   │
│ (Logs, Errs, │    │ (CPU, RAM,   │       │ (Pool, Wait, │      │ (Latency,    │
│  User Evts)  │    │  Disk, Net)  │       │  Slow Query) │      │  TPS, 5xx)   │
└──────────────┘    └──────────────┘       └──────────────┘      └──────────────┘
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Multi-Engine Persistence Tier                              |
|   • Development: Embedded Zero-Config SQLite (sqlite:///./open_layer.db)          |
|   • Production: Scalable MySQL 8.0 / Managed PostgreSQL (Supabase / Neon / RDS)   |
+-----------------------------------------------------------------------------------+
```

---

## ✨ Implemented Core Capabilities

### 1. 📊 Executive 360° Observability Dashboard
- Live platform health score, aggregate availability, and uptime percentage calculations.
- Response time distributions and error rates computed across stored telemetry.
- 24-hour transaction volume metrics and active incident breakdown.
- Upstream and downstream application dependency mapping.

### 2. 🚀 Application Inventory & Onboarding
- Full CRUD operations with duplicate detection, form validation, and instant search/filtering.
- Tracks: Business Function, Technical Owner, Criticality, Hosting Environment, Tech Stack, and SLA Commitments.
- Application details drawer displaying live telemetry feeds, dependency tree, and AI-driven Root Cause Analysis.

### 3. 🔍 Distributed Tracing & Waterfall Visualizer
- Ingestion of end-to-end transaction flows traversing mobile apps, gateways, microservices, and databases.
- Multi-span waterfall visualizer highlighting execution duration and pinpointing failure points.
- Pre-configured with realistic multi-service banking traces (UPI, Loan Underwriting).

### 4. 📝 Centralized Log Management & Natural Query Search
- Full-text search with filtering across severity level, service name, and time range.
- **Natural Language Query Parser:** Automatically parses phrases like `"failed UPI transactions"` to isolate UPI services and `error`/`critical` events.

### 5. 🧠 Explainable AI Root Cause Analysis (RCA) & Anomaly Detection
- **Anomaly Detection:** Evaluates rolling metrics against a $3\sigma$ standard deviation threshold to detect abnormal spikes.
- **Root Cause Analysis:** Traverses dependency graphs to build multi-hop causal chains (e.g. `DB pool saturation (98%)` $\rightarrow$ `Query timeout (145ms)` $\rightarrow$ `API Gateway 504`), complete with confidence scores (0–100%) and actionable remediations.
- **Downtime Risk & Capacity Estimation:** Projects resource exhaustion velocity to forecast potential downtime.

### 6. 🚨 Alert Rules & Incident Lifecycle Management
- Multi-condition alert rules (`>`, `<`, `>=`, `<=`) evaluating real-time telemetry metrics.
- Automatic incident creation upon critical threshold breaches.
- Complete incident lifecycle tracking (`investigating` $\rightarrow$ `identified` $\rightarrow$ `resolved`) with audit trail and resolution notes.

### 7. 💳 Business Workflow Journey Tracking
- Visual multi-stage tracking for end-to-end banking journeys:
  - **Retail Loan Origination:** Application $\rightarrow$ KYC $\rightarrow$ Underwriting $\rightarrow$ Sanction $\rightarrow$ Disbursement
  - **UPI Instant Payments:** Initiation $\rightarrow$ Device Binding $\rightarrow$ NPCI Switch $\rightarrow$ Debit $\rightarrow$ Credit
  - **Customer KYC Verification:** Document Upload $\rightarrow$ OCR $\rightarrow$ Face Match $\rightarrow$ AML $\rightarrow$ Approval
- Interactive **"Advance Stage"** button persisting stage changes with real-time dirty-tracking in the database.

### 8. 🔌 Enterprise Integrations Catalog
- 15 pre-configured connectors across Cloud (AWS, Azure, GCP), DevOps (Kubernetes, Docker, GitHub, GitLab), Monitoring (Datadog, Dynatrace, Prometheus, Splunk), and Banking (Finacle Core Banking, NPCI UPI, Payment Gateway).
- Live health connectivity probe testing endpoint (`POST /api/integrations/{id}/test`).

### 9. 🛡️ Enterprise Security & 5-Tier RBAC
- Granular permissions enforced across 5 roles: `Admin`, `SRE`, `DevOps`, `Developer`, and `Viewer`.
- Native Bcrypt password hashing (`bcrypt.hashpw` / `bcrypt.checkpw`) and JWT HS256 tokens.
- Immutable SOC/SIEM-ready audit trail recording all administrative mutations.

### 10. 📑 Comprehensive Reports & Real File Exports
- 6 operational reports: System Health, Incidents, SLA Compliance, Application Performance, Root Cause Analysis, and Security Audit Trail.
- **Real File Exports:** One-click downloads streaming RFC 4180-compliant CSV and Excel documents.

---

## 📂 Repository Structure

```
Open-layer/
├── frontend/                     # React 18 SPA (Vite, CSS Modules, Lucide icons)
│   ├── src/
│   │   ├── App.jsx               # 12 integrated observability views & drawers
│   │   ├── api.js                # Axios client with JWT interceptor & download helpers
│   │   ├── styles.css            # Dark-mode dashboard styling & waterfall styles
│   │   └── main.jsx              # React DOM entry point
│   ├── public/
│   ├── package.json
│   ├── vercel.json               # Edge SPA routing & rewrite rules
│   └── .env.example              # Frontend environment template (VITE_API_URL)
├── backend/                      # Asynchronous Python ASGI Core (FastAPI)
│   ├── app/
│   │   ├── models/entities.py    # SQLAlchemy 2.0 ORM domain entities
│   │   ├── routers/
│   │   │   ├── applications.py   # App CRUD, inventory, dependencies & RCA
│   │   │   ├── observability.py  # 4-tier telemetry, logs, traces, alerts, incidents
│   │   │   ├── business.py       # Workflows, integrations, 6 report generators & export
│   │   │   └── auth.py           # JWT token issuance, profiles & user queries
│   │   ├── services/analytics.py # Statistical 3-sigma anomaly detector & causal RCA
│   │   ├── database.py           # Multi-engine session factory (SQLite / MySQL / Postgres)
│   │   ├── security.py           # Native Bcrypt hashing & JWT HS256 token verification
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── seed.py               # Comprehensive demo telemetry & reference seed
│   │   ├── config.py             # Typed settings with automatic fallback
│   │   └── main.py               # FastAPI entry point, dual-mount routes & health checks
│   ├── database/
│   │   └── schema.sql            # Canonical MySQL DDL schema reference
│   ├── tests/
│   │   └── test_api.py           # 26 automated unit & integration tests (100% pass)
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Multi-stage production container definition
│   └── .env.example              # Backend environment template
├── docs/                         # Complete technical documentation suite
│   ├── PROJECT_AUDIT.md          # Pre-refactor audit and gap analysis
│   ├── REQUIREMENTS_TRACEABILITY.md # 34-item specification mapping & test audit
│   ├── ARCHITECTURE.md           # End-to-end system architecture & diagrams
│   ├── API_DOCUMENTATION.md      # REST API reference with schemas & curl commands
│   └── DEPLOYMENT.md             # Production guide (Vercel, Render, Docker, DB)
├── .gitignore                    # Comprehensive ignore rules (secrets, DBs, venvs)
├── docker-compose.yml            # Multi-service local orchestrator
└── README.md                     # Clean project documentation
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (defaults to zero-config SQLite: open_layer.db)
uvicorn app.main:app --reload --port 8000
```

- **API Base URL:** `http://localhost:8000/api`
- **Interactive Swagger UI:** `http://localhost:8000/docs`
- **Health Endpoint:** `http://localhost:8000/health`

#### Pre-Configured Demo Accounts (when `SEED_DEMO_DATA=true`):
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@openlayer.local` | `Password123!` | Full administrative access |
| **SRE** | `sre@openlayer.local` | `Password123!` | Incident management, alerts, traces |
| **DevOps** | `devops@openlayer.local` | `Password123!` | Deployments, infra telemetry, integrations |
| **Developer** | `developer@openlayer.local` | `Password123!` | Logs, traces, metrics, app inspection |
| **Viewer** | `viewer@openlayer.local` | `Password123!` | Read-only executive view |

*(Role can also be switched instantly via the Demo Role Selector in Settings).*

---

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

- **Frontend URL:** `http://localhost:5173`
- **Production Build:** `npm run build`

---

## 🧪 Automated Testing & Verification

The test suite validates end-to-end functionality across all components:

```bash
cd backend
pytest tests/test_api.py -v
```

### Test Results: **26 passed in 4.56s (100% pass rate)**

| Module | Tested Functionality | Status |
|---|---|:---:|
| **Authentication** | Login, invalid credential rejection, profile resolution | `PASSED` |
| **Applications** | CRUD, duplicate rejection, health score, RCA detail | `PASSED` |
| **Telemetry Ingestion** | 4-layer metric ingestion (`app`, `infra`, `db`, `api`) | `PASSED` |
| **Centralized Logging** | Log ingestion, multi-level search, natural query parsing | `PASSED` |
| **Distributed Tracing** | Trace ingestion, parent-child span waterfall hierarchy | `PASSED` |
| **Alerts & Incidents** | Rule evaluation, auto-incident spawning, lifecycle updates | `PASSED` |
| **Workflows** | Stage stepper, dirty-tracking persistence advancement | `PASSED` |
| **Integrations** | 15-connector catalog inspection, live health connectivity test | `PASSED` |
| **Reports & Export** | All 6 report generators, RFC 4180 CSV streamed export | `PASSED` |
| **AI Analytics** | 3-sigma anomaly detector, causal chain graph, downtime risk | `PASSED` |
| **Dashboard** | 360° summary aggregation across stored telemetry | `PASSED` |

---

## 🌐 Production Deployment

- **Frontend on Vercel:** Ready for one-click deployment using [`frontend/vercel.json`](frontend/vercel.json). Set `VITE_API_URL` to your backend URL.
- **Backend on Render / Docker:** Container definition provided in [`backend/Dockerfile`](backend/Dockerfile). Set `DATABASE_URL` (PostgreSQL or MySQL) and `CORS_ORIGINS`.
- Full deployment instructions are documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 📄 License & Attribution

Developed for the Open Layer Application Observability Platform Initiative. All rights reserved.
