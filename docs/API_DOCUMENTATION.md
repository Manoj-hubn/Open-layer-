# Open Layer Observability Platform — API Documentation

## 1. API Overview

The Open Layer REST API is designed to provide comprehensive endpoints for telemetry ingestion, querying, alerting, incident management, workflow tracking, integration validation, and reporting.

- **Base URL**: `http://localhost:8000/api` (or `/` via dual-mount routing)
- **Content-Type**: `application/json`
- **Authentication**: HTTP Bearer Token (`Authorization: Bearer <JWT_ACCESS_TOKEN>`)
- **Error Codes**:
  - `400 Bad Request`: Validation failure, duplicate application name, or malformed payload.
  - `401 Unauthorized`: Missing or expired JWT token.
  - `403 Forbidden`: Insufficient role permissions for the attempted operation.
  - `404 Not Found`: Requested resource (application, incident, workflow, integration) does not exist.
  - `422 Unprocessable Entity`: Schema constraint failure.

---

## 2. Authentication Endpoints

### 2.1 User Login
`POST /api/auth/login`

Authenticates credentials and returns a signed JWT access token and user profile.

- **Request Body**:
```json
{
  "email": "admin@openlayer.local",
  "password": "Password123!"
}
```

- **Success Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@openlayer.local",
    "full_name": "Open Layer Administrator",
    "role": "admin",
    "is_active": true
  }
}
```

### 2.2 User Registration
`POST /api/auth/register`

Creates a new user profile with a designated role.

- **Request Body**:
```json
{
  "email": "devops@openlayer.local",
  "password": "Password123!",
  "full_name": "DevOps Engineer",
  "role": "devops"
}
```

### 2.3 Current User Profile
`GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Returns**: Current authenticated user object.

---

## 3. Application Inventory & Management

### 3.1 List Applications
`GET /api/applications`

Retrieves all registered applications with optional filtering.

- **Query Parameters**:
  - `search` (string, optional): Search by name, owner, or business function.
  - `environment` (string, optional): Filter by `Production`, `Staging`, or `Development`.

- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Core Banking Switch",
    "owner": "Banking Platform Team",
    "business_function": "Payment Processing",
    "environment": "Production",
    "tech_stack": "Java / Spring Boot / Oracle",
    "hosting_env": "AWS EKS (ap-south-1)",
    "criticality": "Critical",
    "sla_requirement": 99.99,
    "uptime_pct": 99.98,
    "latency_ms": 128.5,
    "status": "healthy",
    "dependencies": ["Account Service", "Oracle RAC", "Kafka"]
  }
]
```

### 3.2 Register Application
`POST /api/applications`

Registers a new application into the observability catalog.

- **Request Body**:
```json
{
  "name": "Card Settlement Engine",
  "owner": "Cards Engineering",
  "business_function": "Settlements",
  "environment": "Production",
  "tech_stack": "Python / FastAPI / PostgreSQL",
  "hosting_env": "AWS ECS",
  "criticality": "High",
  "sla_requirement": 99.95,
  "dependencies": ["Core Banking Switch", "Redis"]
}
```

### 3.3 Get Application Details & RCA
`GET /api/applications/{id}`
Returns application profile, calculated health score, and dependency tree.

`GET /api/applications/{id}/rca`
Executes heuristic Root Cause Analysis for the application.

- **Response (200 OK)**:
```json
{
  "application_id": 1,
  "application_name": "Core Banking Switch",
  "health_score": 78.4,
  "status": "degraded",
  "anomalies": [
    {
      "metric": "db_connection_wait_ms",
      "layer": "database",
      "baseline": 15.0,
      "observed": 145.2,
      "deviation_pct": 868.0,
      "severity": "critical"
    }
  ],
  "root_cause_chain": [
    "Database connection pool saturated (98% active connections)",
    "Query wait times spiked from 15ms to 145ms",
    "Upstream API Gateway timed out after 3000ms",
    "HTTP 504 errors returned to mobile client"
  ],
  "confidence_pct": 92.5,
  "remediation": "Increase database connection pool size from 40 to 80 and check for long-running uncommitted transactions."
}
```

---

## 4. Observability & Telemetry Ingestion

### 4.1 Ingest Telemetry Metric
`POST /api/metrics`

Ingests a multi-layer telemetry metric sample.

- **Request Body**:
```json
{
  "application_id": 1,
  "layer": "database",
  "metric_name": "db_active_connections",
  "metric_value": 78.0,
  "unit": "count"
}
```
*Valid `layer` values*: `app`, `infrastructure`, `database`, `api`.

### 4.2 Ingest Log Entry
`POST /api/logs`

Ingests structured log records.

- **Request Body**:
```json
{
  "application_id": 1,
  "level": "error",
  "service": "UPI Switch",
  "message": "Payment failed: NPCI response timeout after 5000ms",
  "context_data": {
    "transaction_id": "tr-upi-99823",
    "payer_vpa": "user@okaxis",
    "error_code": "U30"
  }
}
```

### 4.3 Centralized Log Search & Natural Language Filter
`GET /api/logs`

- **Query Parameters**:
  - `search` (string, optional): Full-text search or natural phrase like `"failed UPI transactions"`.
  - `level` (string, optional): `info`, `warn`, `error`, `critical`.
  - `service` (string, optional): Filter by emitting service name.
  - `limit` (integer, optional, default: 200): Limit number of logs returned.

### 4.4 Distributed Tracing
`POST /api/traces`
Ingests a transaction trace with child execution spans.

- **Request Body**:
```json
{
  "trace_id": "tr-loan-10294-883",
  "name": "Instant Personal Loan Approval",
  "duration_ms": 842.0,
  "status": "success",
  "spans": [
    {
      "id": "sp-1",
      "service": "Mobile Gateway",
      "endpoint": "POST /api/v1/loan/apply",
      "duration_ms": 842.0,
      "status": "success"
    },
    {
      "id": "sp-2",
      "service": "Credit Bureau Service",
      "endpoint": "GET /v2/score",
      "duration_ms": 420.0,
      "status": "success"
    },
    {
      "id": "sp-3",
      "service": "Disbursement Service",
      "endpoint": "POST /v1/disburse",
      "duration_ms": 310.0,
      "status": "success"
    }
  ]
}
```

`GET /api/traces`
Lists recent traces.

`GET /api/traces/{trace_id}`
Fetches full span hierarchy and execution waterfall for a given trace.

---

## 5. Alerts & Incident Management

### 5.1 Create Alert Rule
`POST /api/alerts/rules`

- **Request Body**:
```json
{
  "application_id": 1,
  "name": "High Database Latency",
  "metric_name": "db_latency_ms",
  "operator": ">",
  "threshold": 100.0,
  "severity": "critical",
  "enabled": true
}
```

### 5.2 Evaluate Alert Rules
`POST /api/alerts/evaluate-rules`

Triggers evaluation of active alert rules against stored telemetry. Automatically creates incidents for critical breaches.

- **Response (200 OK)**:
```json
{
  "evaluated_rules_count": 8,
  "alerts_triggered_count": 2,
  "incidents_created_count": 1,
  "timestamp": "2026-10-25T16:20:00Z"
}
```

### 5.3 Update Incident Lifecycle
`PATCH /api/incidents/{id}`

- **Request Body**:
```json
{
  "status": "resolved",
  "resolution_notes": "Increased connection pool limit to 80; cleared stalled worker threads."
}
```

---

## 6. Business Workflows & Integrations

### 6.1 List Workflows
`GET /api/workflows`

Returns end-to-end business journeys (`Loan Origination`, `UPI Instant Payments`, `KYC Verification`).

### 6.2 Advance Workflow Stage
`PATCH /api/workflows/{id}/advance`

Advances a workflow to the next execution stage, persisting progress.

- **Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Retail Loan Origination",
  "completion_pct": 75.0,
  "current_stage": "Underwriting Assessment",
  "status": "in_progress"
}
```

### 6.3 Test Integration
`POST /api/integrations/{id}/test`

Executes a live health probe for an external service integration (AWS, Datadog, NPCI, Core Banking).

- **Response (200 OK)**:
```json
{
  "integration_id": 1,
  "name": "Amazon Web Services (AWS)",
  "status": "connected",
  "latency_ms": 34.2,
  "tested_at": "2026-10-25T16:22:15Z",
  "message": "Connection to AWS CloudWatch & CloudTrail APIs verified successfully."
}
```

---

## 7. Reporting & Data Exports

### 7.1 Generate Report
`GET /api/reports/{report_type}`

Supported `report_type` values:
1. `system-health`: Overall availability, uptime %, latency, active incident counts.
2. `incidents`: Incident MTTR, severity distribution, root cause summaries.
3. `sla-compliance`: SLA compliance percentages vs commitments by application.
4. `application-performance`: Throughput, p95 latencies, error percentages.
5. `root-cause-analysis`: Comprehensive log of detected anomalies and RCA causal chains.
6. `audit-trail`: SOC/SIEM compliant record of user administrative events.

### 7.2 Export Report as CSV / Excel
`GET /api/reports/{report_type}/export?format=csv`

Returns an RFC 4180 formatted CSV document with `Content-Disposition: attachment; filename="open_layer_{report_type}_report.csv"`.

Example curl command:
```bash
curl -X GET "http://localhost:8000/api/reports/system-health/export?format=csv" \
  -H "Authorization: Bearer <TOKEN>" \
  -o system_health_report.csv
```
