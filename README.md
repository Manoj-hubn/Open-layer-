# Open Layer — Application Observability & Intelligent Monitoring Platform

An enterprise-ready Application Observability and Intelligent Monitoring Platform built strictly in alignment with the official specification (**Second AI Full Stack Developer Task - Open Layer – Application Observability Module Task 3**).

The repository provides a modern React 18 Single Page Application (frontend) and an asynchronous FastAPI REST API (backend), backed by SQLAlchemy with zero-configuration SQLite for local development and seamless production support for MySQL 8.0 and PostgreSQL.

---

## Key Highlights & Implemented Capabilities

1. **Executive 360° Observability Dashboard**:
   - Real-time application health score calculation, availability, and uptime percentages.
   - Response time distributions and error rates computed across 4 telemetry layers.
   - Transaction volume tracking and active incident visibility.
   - Upstream & downstream application dependency topology mapping.

2. **Application Discovery & Registration**:
   - Full CRUD operations with duplicate detection and schema validation.
   - Comprehensive metadata: Business function, Owner, Environment (Production, Staging, Dev), Criticality, Tech Stack, Hosting Environment, and Target SLA.
   - Interactive Application Details Drawer displaying live metrics and AI-driven Root Cause Analysis.

3. **Four-Tier Telemetry Ingestion Engine**:
   - **Application Layer (`app`)**: Exceptions, thread status, execution time.
   - **Infrastructure Layer (`infrastructure`)**: CPU %, memory usage, disk utilization, container telemetry.
   - **Database Layer (`database`)**: Connection pool saturation, query latency, slow queries.
   - **API Layer (`api`)**: Endpoint response times, throughput, HTTP status distribution.

4. **Distributed Tracing & Waterfall Visualizer**:
   - Ingestion and visualization of transaction paths traversing client apps, gateways, microservices, and databases.
   - Detailed span waterfall view displaying per-service latencies and pinpointing failure points.

5. **Centralized Log Management**:
   - Multi-attribute log search (severity level, service name, environment, time window).
   - Natural language query parser supporting plain-text operational queries (e.g. *"failed UPI transactions"*).

6. **Explainable AI Analytics & Root Cause Analysis**:
   - 3-sigma statistical anomaly detection across latency and error spikes.
   - Multi-hop causal chain generation (e.g. `DB pool saturation` -> `Query timeout` -> `Gateway 504`) with confidence scoring.
   - Downtime risk estimation and capacity exhaustion warnings.

7. **Alert Rules Engine & Incident Lifecycle**:
   - Configurable multi-condition alert rules (`>`, `<`, `>=`, `<=`).
   - Automated incident creation upon critical alert breaches.
   - Incident resolution workflow (`investigating` -> `identified` -> `resolved`) with audit trail.

8. **Business Workflow Journey Tracking**:
   - End-to-end multi-stage tracking for critical banking journeys: **Retail Loan Origination**, **UPI Instant Payments**, and **Customer KYC Verification**.
   - Interactive stage advancement with real-time dirty-tracking persistence.

9. **Integrations Catalog**:
   - 15 pre-configured enterprise connectors across Cloud (AWS, Azure, GCP), DevOps (Kubernetes, Docker, GitHub, GitLab), Monitoring (Datadog, Dynatrace, Prometheus, Splunk), and Banking (Core Banking Switch, NPCI UPI, Payment Gateway).
   - Live connectivity health test endpoint.

10. **Enterprise Security & 5-Tier RBAC**:
    - Roles: `Admin`, `SRE`, `DevOps`, `Developer`, `Viewer`.
    - Native Bcrypt password hashing and JWT HS256 authentication.
    - Immutable SOC/SIEM-ready audit trail recording all administrative operations.

11. **Comprehensive Reporting & Export Center**:
    - 6 built-in operational reports: System Health, Incidents, SLA Compliance, Application Performance, Root Cause Analysis, and Security Audit Trail.
    - Direct RFC 4180 CSV and Excel tabular file export.

---

## Repository Structure

```
open_layer_observability/
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Unified React SPA with 12 modular views
│   │   ├── api.js              # Axios-based API client with JWT interceptor
│   │   ├── styles.css          # Modern dark-mode styling and layout
│   │   └── main.jsx            # React root mount
│   ├── public/
│   ├── dist/                   # Production build output
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json             # Vercel SPA routing configuration
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── models/entities.py  # SQLAlchemy 2.0 ORM data models
│   │   ├── routers/            # Modular FastAPI endpoints
│   │   │   ├── applications.py # Application inventory & RCA
│   │   │   ├── observability.py# Telemetry, logs, traces, alerts
│   │   │   └── business.py     # Workflows, integrations, reports
│   │   ├── services/           # Analytics, AI heuristics, health calc
│   │   ├── database.py         # Multi-database engine & session factory
│   │   ├── security.py         # Bcrypt hashing & JWT verification
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── seed.py             # Demo data population
│   │   ├── config.py           # Settings & environment variables
│   │   └── main.py             # FastAPI ASGI application & health checks
│   ├── database/
│   │   └── schema.sql          # Canonical MySQL schema reference
│   ├── tests/
│   │   └── test_api.py         # 26 comprehensive pytest unit & integration tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docs/
│   ├── PROJECT_AUDIT.md        # Comprehensive pre-refactor inspection & audit
│   ├── REQUIREMENTS_TRACEABILITY.md # 34-item task specification traceability matrix
│   ├── ARCHITECTURE.md         # Detailed architectural documentation & diagrams
│   ├── API_DOCUMENTATION.md    # Complete REST API reference with payloads & curl
│   └── DEPLOYMENT.md           # Production deployment guide (Vercel, Render, Docker)
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 20+
- (Optional) Docker or MySQL 8.0

---

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

- API Base URL: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

#### Pre-Configured Demo Accounts (when `SEED_DEMO_DATA=true`):
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@openlayer.local` | `Password123!` |
| **SRE** | `sre@openlayer.local` | `Password123!` |
| **DevOps** | `devops@openlayer.local` | `Password123!` |
| **Developer** | `developer@openlayer.local` | `Password123!` |
| **Viewer** | `viewer@openlayer.local` | `Password123!` |

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

- Frontend URL: `http://localhost:5173`
- Production Build: `npm run build`

---

## Running Automated Tests

The backend includes a comprehensive test suite covering all modules:

```bash
cd backend
pytest tests/test_api.py -v
```

**Test Results**: **26 passed in ~6 seconds (100% pass rate)**.
- Covers: App CRUD, Validation, 4-tier Telemetry Ingestion, Distributed Tracing, Natural Language Log Filtering, AI Anomaly Detection, Root Cause Analysis, Alert Evaluation, Incident Resolution, Workflow Stage Advancement, Integration Testing, All 6 Reports, RFC 4180 CSV Export, and RBAC Authentication.

---

## Deployment & Production Hosting

- **Frontend on Vercel**: Ready for one-click deployment using `frontend/vercel.json`. Set `VITE_API_URL` to your backend URL.
- **Backend on Render / Docker**: Dockerfile provided in `backend/Dockerfile`. Set `DATABASE_URL` (PostgreSQL or MySQL) and `CORS_ORIGINS`.
- For complete deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## License & Attribution

Developed for the Open Layer Application Observability Platform Initiative. All rights reserved.
