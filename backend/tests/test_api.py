import os
import sys
import pytest
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models.entities import User, Application, Metric, LogEntry, Alert, Incident, Workflow, Integration, AlertRule
from app.schemas import (
    LoginIn, ApplicationIn, ApplicationUpdateIn, MetricIn, LogIn, AlertIn,
    TraceIn, WorkflowIn, IntegrationIn, AlertRuleIn
)
from app.routers import auth, applications, observability, business
from app.services.analytics import analyze_application_anomalies, perform_root_cause_analysis, estimate_downtime_and_capacity_risk
from app.seed import seed
from fastapi import HTTPException

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def admin_user(db):
    user = db.query(User).filter(User.email == "admin@openlayer.local").first()
    assert user is not None
    return user

@pytest.fixture
def ops_user(db):
    user = db.query(User).filter(User.email == "ops@openlayer.local").first()
    assert user is not None
    return user

@pytest.fixture
def business_user(db):
    user = db.query(User).filter(User.email == "business@openlayer.local").first()
    assert user is not None
    return user

# ==========================================
# 1. AUTHENTICATION & SECURITY TESTS
# ==========================================

def test_auth_login_success(db):
    req = LoginIn(email="admin@openlayer.local", password="ChangeMe123!")
    res = auth.login(req, db)
    assert "access_token" in res
    assert res["user"]["role"] == "Admin"
    assert res["user"]["email"] == "admin@openlayer.local"

def test_auth_login_invalid_credentials(db):
    req = LoginIn(email="admin@openlayer.local", password="IncorrectPassword!")
    with pytest.raises(HTTPException) as exc:
        auth.login(req, db)
    assert exc.value.status_code == 401
    assert "Incorrect email or password" in exc.value.detail

def test_auth_current_user_profile(admin_user):
    profile = auth.me(admin_user)
    assert profile.email == "admin@openlayer.local"
    assert profile.role == "Admin"

# ==========================================
# 2. APPLICATION ONBOARDING & REGISTRATION
# ==========================================

def test_create_and_list_application(db, admin_user):
    unique_name = f"Treasury Engine {datetime.utcnow().timestamp()}"
    app_data = ApplicationIn(
        name=unique_name,
        owner="Treasury Operations",
        business_function="Treasury",
        environment="Prod",
        technology_stack="FastAPI · Redis",
        hosting_environment="AWS",
        criticality="High",
        sla_target=99.95
    )
    created = applications.create_application(app_data, db, admin_user)
    assert created.id is not None
    assert created.name == unique_name
    assert created.status == "Healthy"

    # Verify search
    all_apps = applications.list_applications(q="Treasury", db=db, user=admin_user)
    assert any(a.name == unique_name for a in all_apps)

def test_duplicate_application_rejection(db, admin_user):
    app_data = ApplicationIn(
        name="Digital Banking API",
        owner="Duplicate Owner",
        business_function="Banking"
    )
    with pytest.raises(HTTPException) as exc:
        applications.create_application(app_data, db, admin_user)
    assert exc.value.status_code == 400
    assert "already registered" in exc.value.detail

def test_application_details_and_health(db, admin_user):
    app = db.query(Application).filter(Application.name == "UPI Payments").first()
    details = applications.get_application_details(app.id, db, admin_user)
    assert details["application"].name == "UPI Payments"
    assert "anomalies" in details
    assert "recent_metrics" in details

def test_update_application(db, admin_user):
    app = db.query(Application).first()
    update_data = ApplicationUpdateIn(response_ms=290.0, status="Degraded")
    updated = applications.update_application(app.id, update_data, db, admin_user)
    assert updated.response_ms == 290.0
    assert updated.status == "Degraded"

# ==========================================
# 3. OBSERVABILITY METRICS & TELEMETRY
# ==========================================

def test_metric_ingestion_and_retrieval(db, admin_user):
    app = db.query(Application).first()
    metric_data = MetricIn(
        application_id=app.id,
        layer="Infrastructure",
        name="memory_utilization",
        value=72.5,
        unit="%",
        labels={"node": "worker-01"}
    )
    ingest_res = observability.ingest_metric(metric_data, db, admin_user)
    assert ingest_res["status"] == "accepted"

    # Query metrics by app ID
    metrics = observability.get_metrics_for_application(str(app.id), metric="memory", db=db, user=admin_user)
    assert len(metrics) > 0
    assert metrics[0]["name"] == "memory_utilization"

    # Query metrics by app Name
    metrics_by_name = observability.get_metrics_for_application(app.name, db=db, user=admin_user)
    assert len(metrics_by_name) > 0

# ==========================================
# 4. CENTRALIZED LOG MANAGEMENT
# ==========================================

def test_log_ingestion_and_search(db, admin_user):
    app = db.query(Application).filter(Application.name == "UPI Payments").first()
    log_data = LogIn(
        application_id=app.id,
        level="ERROR",
        category="Integration",
        message="Failed UPI transaction: settlement switch timed out after 5000ms",
        trace_id="tr-UPI-TEST-1001",
        source="upi-gateway"
    )
    res = observability.ingest_log(log_data, db, admin_user)
    assert res["status"] == "accepted"

    # Search with natural-language query equivalent
    results = observability.search_logs(natural_query="failed UPI transactions", db=db, user=admin_user)
    assert len(results) >= 1
    assert any("UPI" in l["message"] for l in results)

def test_log_filtering_by_category_and_level(db, admin_user):
    results = observability.search_logs(level="ERROR", category="Integration", db=db, user=admin_user)
    assert all(l["level"] == "ERROR" for l in results)
    assert all(l["category"] == "Integration" for l in results)

# ==========================================
# 5. DISTRIBUTED TRACING
# ==========================================

def test_trace_ingestion_and_detail(db, admin_user):
    app = db.query(Application).first()
    tx_id = f"tr-TEST-{datetime.utcnow().timestamp()}"
    trace_data = TraceIn(
        transaction_id=tx_id,
        application_id=app.id,
        request_path="/v1/payments/verify",
        response_ms=310.0,
        dependency_chain=["Customer Channel", "API Gateway", "Auth Service", "Core DB"],
        spans=[
            {"span_id": "s1", "service": "API Gateway", "duration_ms": 30.0},
            {"span_id": "s2", "service": "Auth Service", "duration_ms": 220.0},
            {"span_id": "s3", "service": "Core DB", "duration_ms": 60.0}
        ],
        status="Success"
    )
    res = observability.ingest_trace(trace_data, db, admin_user)
    assert res["status"] == "accepted"

    trace_detail = observability.get_trace_details(tx_id, db, admin_user)
    assert trace_detail["trace"]["transaction_id"] == tx_id
    assert len(trace_detail["trace"]["spans"]) == 3

# ==========================================
# 6. ALERT RULES & INCIDENTS
# ==========================================

def test_create_alert_and_auto_incident(db, ops_user):
    app = db.query(Application).first()
    alert_data = AlertIn(
        title="High Database Latency Incident Trigger",
        severity="Critical",
        application_id=app.id,
        description="Database connection pool exhausted; latency exceeds 5 seconds."
    )
    created = observability.create_alert(alert_data, db, ops_user)
    assert created["severity"] == "Critical"
    assert created["incident_id"] is not None

    # Verify incident was created
    inc = db.get(Incident, created["incident_id"])
    assert inc is not None
    assert inc.severity == "Critical"
    assert inc.status == "Open"

def test_incident_lifecycle_resolution(db, ops_user):
    inc = db.query(Incident).filter(Incident.status == "Open").first()
    assert inc is not None
    res = observability.update_incident(inc.id, status="Resolved", root_cause="Connection pool scaled up", db=db, user=ops_user)
    assert res["status"] == "Resolved"
    assert res["resolved_at"] is not None

def test_alert_rule_evaluation(db, ops_user):
    eval_res = observability.evaluate_alert_rules(db, ops_user)
    assert "evaluated_rules" in eval_res
    assert eval_res["evaluated_rules"] >= 1

# ==========================================
# 7. BUSINESS WORKFLOW MONITORING
# ==========================================

def test_workflow_monitoring_and_advancement(db, business_user):
    wf = db.query(Workflow).filter(Workflow.name == "Retail loan journey").first()
    assert wf is not None
    
    details = business.get_workflow_details(wf.id, db, business_user)
    assert details["workflow"].name == "Retail loan journey"
    assert "primary_bottleneck" in details

    # Advance stage
    adv = business.advance_workflow_stage(
        workflow_id=wf.id,
        stage_name="Approval",
        status="complete",
        duration_minutes=15.0,
        db=db,
        user=business_user
    )
    assert adv["id"] == wf.id
    assert any(s["name"] == "Approval" and s["status"] == "complete" for s in adv["stages"])

# ==========================================
# 8. INTEGRATION FRAMEWORK
# ==========================================

def test_integration_connectivity_test(db, admin_user):
    integ = db.query(Integration).first()
    assert integ is not None
    res = business.test_integration_connectivity(integ.id, db, admin_user)
    assert "test_message" in res
    assert res["status"] in ("Connected", "Configured", "Not configured", "Disconnected")

# ==========================================
# 9. REPORTS GENERATION & EXPORT
# ==========================================

@pytest.mark.parametrize("report_type", [
    "application-health",
    "sla-compliance",
    "incident",
    "root-cause",
    "performance-trend",
    "audit"
])
def test_all_six_reports_generated(db, admin_user, report_type):
    rep = business.get_report(report_type, db, admin_user)
    assert rep["report_type"] == report_type
    assert "data" in rep
    assert "summary" in rep

def test_report_export_csv(db, admin_user):
    rep_csv = business.export_report("application-health", format="csv", db=db, user=admin_user)
    assert rep_csv.media_type == "text/csv"
    assert "attachment; filename=" in rep_csv.headers["Content-Disposition"]
    content_str = rep_csv.body.decode("utf-8-sig")
    assert "Digital Banking API" in content_str or "name" in content_str

# ==========================================
# 10. AI-BASED ROOT CAUSE & PREDICTIVE ANALYTICS
# ==========================================

def test_root_cause_analysis_service(db, admin_user):
    app = db.query(Application).filter(Application.name == "KYC Verification").first()
    rca = perform_root_cause_analysis(app, db)
    assert "causal_chain" in rca
    assert "confidence_score" in rca
    assert "summary" in rca
    assert rca["confidence_score"] > 0

def test_downtime_and_capacity_estimation(db, admin_user):
    apps = db.query(Application).all()
    risk_summary = estimate_downtime_and_capacity_risk(apps)
    assert "estate_health_index" in risk_summary
    assert "high_risk_applications" in risk_summary
    assert "capacity_warnings" in risk_summary

def test_dashboard_360_overview(db, admin_user):
    d = observability.dashboard(db, admin_user)
    assert d["application_count"] >= 5
    assert d["performance_score"] > 0
    assert "resource_utilization" in d
    assert "sla_status" in d
    assert "trend_data" in d
