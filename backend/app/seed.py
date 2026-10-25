from datetime import datetime, timedelta
from app.models.entities import User, Application, Metric, LogEntry, AlertRule, Alert, Incident, Trace, Workflow, Integration, AuditEvent
from app.security import hash_password

def seed(db):
    # 1. USERS FOR ALL 5 REQUIRED ROLES
    default_users = [
        ("Open Layer Admin", "admin@openlayer.local", "Admin"),
        ("Sarah Jenkins (App Owner)", "appowner@openlayer.local", "Application Owner"),
        ("DevOps / Ops Lead", "ops@openlayer.local", "Operations Team"),
        ("Compliance Auditor", "auditor@openlayer.local", "Auditor"),
        ("Business Line Manager", "business@openlayer.local", "Business User"),
    ]
    for name, email, role in default_users:
        if not db.query(User).filter(User.email == email).first():
            db.add(User(name=name, email=email, password_hash=hash_password("ChangeMe123!"), role=role))
    db.commit()

    # 2. APPLICATIONS
    if db.query(Application).count() == 0:
        apps = [
            Application(
                name="Digital Banking API",
                owner="Platform Engineering",
                business_function="Digital Banking",
                environment="Prod",
                technology_stack="FastAPI · PostgreSQL · Redis",
                hosting_environment="AWS",
                criticality="Critical",
                sla_target=99.95,
                status="Healthy",
                uptime_pct=99.98,
                response_ms=142.0,
                error_rate=0.24,
                transaction_volume=184250
            ),
            Application(
                name="UPI Payments",
                owner="Payments Team",
                business_function="Payments",
                environment="Prod",
                technology_stack="Java · Kafka · Spring Boot",
                hosting_environment="Azure",
                criticality="Critical",
                sla_target=99.99,
                status="Degraded",
                uptime_pct=99.91,
                response_ms=1240.0,
                error_rate=3.80,
                transaction_volume=326800
            ),
            Application(
                name="Loan Origination",
                owner="Lending Products",
                business_function="Lending",
                environment="Prod",
                technology_stack="Node.js · MySQL · React",
                hosting_environment="Private Cloud",
                criticality="High",
                sla_target=99.90,
                status="Healthy",
                uptime_pct=99.96,
                response_ms=385.0,
                error_rate=0.72,
                transaction_volume=28400
            ),
            Application(
                name="Customer CRM",
                owner="Customer Experience",
                business_function="CRM",
                environment="Test",
                technology_stack="React · Python · FastAPI",
                hosting_environment="GCP",
                criticality="Medium",
                sla_target=99.50,
                status="Healthy",
                uptime_pct=99.87,
                response_ms=210.0,
                error_rate=0.38,
                transaction_volume=12500
            ),
            Application(
                name="KYC Verification",
                owner="Risk & Compliance",
                business_function="Identity",
                environment="Prod",
                technology_stack="Python · PyTorch OCR · FastAPI",
                hosting_environment="AWS",
                criticality="High",
                sla_target=99.90,
                status="Degraded",
                uptime_pct=99.72,
                response_ms=890.0,
                error_rate=6.20,
                transaction_volume=19800
            ),
        ]
        db.add_all(apps)
        db.flush()

        # 3. METRICS ACROSS ALL 4 LAYERS
        now = datetime.utcnow()
        for a in apps:
            is_healthy = (a.status == "Healthy")
            metrics_to_add = [
                # Application Layer
                ("Application", "response_time", a.response_ms, "ms", {"service": a.name}),
                ("Application", "error_rate", a.error_rate, "%", {"service": a.name}),
                ("Application", "request_rate", round(a.transaction_volume / 3600, 1), "req/s", {"service": a.name}),
                # Infrastructure Layer
                ("Infrastructure", "cpu_utilization", 34.5 if is_healthy else 78.2, "%", {"host": f"srv-{a.name.lower().replace(' ', '-')}-01"}),
                ("Infrastructure", "memory_utilization", 52.0 if is_healthy else 84.6, "%", {"host": f"srv-{a.name.lower().replace(' ', '-')}-01"}),
                ("Infrastructure", "storage_utilization", 41.8, "%", {"mount": "/data"}),
                ("Infrastructure", "network_in_mbps", 45.2, "Mbps", {"interface": "eth0"}),
                # Database Layer
                ("Database", "query_latency", 18.2 if is_healthy else 94.5, "ms", {"db": "primary_relational"}),
                ("Database", "connection_failures", 0 if is_healthy else 3, "count", {"db": "primary_relational"}),
                ("Database", "pool_active_connections", 24 if is_healthy else 88, "conns", {"pool": "main"}),
                # API Layer
                ("API", "api_p95_latency", a.response_ms * 1.6, "ms", {"route": "/*"}),
                ("API", "api_failure_percentage", a.error_rate, "%", {"route": "/*"}),
            ]
            for layer, name, val, unit, labels in metrics_to_add:
                db.add(Metric(application_id=a.id, layer=layer, name=name, value=val, unit=unit, recorded_at=now, labels=labels))

        # 4. LOGS INCLUDING SCENARIOS (E.G. UPI FAILURE SCENARIOS)
        db.add_all([
            LogEntry(
                application_id=apps[1].id,
                level="ERROR",
                category="Integration",
                message="Payment gateway timeout after 5s on NPCI switch interface",
                trace_id="tr-UPI-90821",
                source="payment-gateway",
                timestamp=now - timedelta(minutes=15)
            ),
            LogEntry(
                application_id=apps[1].id,
                level="ERROR",
                category="Application",
                message="Failed UPI transaction: bank core host timeout during debit reservation",
                trace_id="tr-UPI-90822",
                source="upi-switch",
                timestamp=now - timedelta(minutes=45)
            ),
            LogEntry(
                application_id=apps[4].id,
                level="WARN",
                category="Application",
                message="KYC document OCR processing latency above threshold (>800ms)",
                trace_id="tr-KYC-10422",
                source="kyc-service",
                timestamp=now - timedelta(minutes=30)
            ),
            LogEntry(
                application_id=apps[0].id,
                level="INFO",
                category="Security",
                message="Successful customer authentication and JWT issuance for user ID 10842",
                trace_id="tr-AUTH-22031",
                source="auth-service",
                timestamp=now - timedelta(minutes=10)
            ),
            LogEntry(
                application_id=apps[0].id,
                level="WARN",
                category="Security",
                message="Suspicious access attempt: rapid credential retry from untrusted CIDR block",
                trace_id="tr-SEC-99801",
                source="waf-gateway",
                timestamp=now - timedelta(minutes=70)
            ),
            LogEntry(
                application_id=apps[2].id,
                level="INFO",
                category="Audit",
                message="Loan approval stage dispatched for application #LN-2026-8819",
                trace_id="tr-LOAN-1042",
                source="loan-service",
                timestamp=now - timedelta(minutes=5)
            ),
        ])

        # 5. ALERT RULES
        rules = [
            AlertRule(
                name="High Latency & Error Cascade",
                condition_description="IF response time > 1000 ms AND error rate > 3%",
                metric_name="response_time",
                operator=">",
                threshold=1000.0,
                secondary_metric="error_rate",
                secondary_operator=">",
                secondary_threshold=3.0,
                severity="Critical",
                is_active=True
            ),
            AlertRule(
                name="High Latency Boundary",
                condition_description="IF response time > 5000 ms AND error rate > 10%",
                metric_name="response_time",
                operator=">",
                threshold=5000.0,
                secondary_metric="error_rate",
                secondary_operator=">",
                secondary_threshold=10.0,
                severity="Critical",
                is_active=True
            ),
            AlertRule(
                name="SLA Breach Warning",
                condition_description="IF uptime < SLA target",
                metric_name="uptime_pct",
                operator="<",
                threshold=99.90,
                severity="Warning",
                is_active=True
            )
        ]
        db.add_all(rules)
        db.flush()

        # 6. ALERTS & INCIDENTS
        alt1 = Alert(
            title="KYC error rate exceeded threshold",
            severity="Critical",
            status="Open",
            application_id=apps[4].id,
            rule_id=rules[0].id,
            description="Error rate spiked to 6.2%; downstream OCR engine latency cascade.",
            channel="Email, Slack",
            created_at=now - timedelta(minutes=40)
        )
        alt2 = Alert(
            title="UPI Payments latency elevated",
            severity="Warning",
            status="Open",
            application_id=apps[1].id,
            rule_id=rules[0].id,
            description="Average response time exceeded 1.2s over the last 15 minutes.",
            channel="Teams/Slack",
            created_at=now - timedelta(minutes=20)
        )
        alt3 = Alert(
            title="Platform certificate rotation completed",
            severity="Information",
            status="Acknowledged",
            application_id=apps[0].id,
            description="SSL/TLS wildcard certificates updated across API gateway ingress.",
            channel="In-app",
            created_at=now - timedelta(hours=2),
            acknowledged_by="admin@openlayer.local"
        )
        db.add_all([alt1, alt2, alt3])
        db.flush()

        db.add(Incident(
            title="KYC document upload failure spike",
            severity="Critical",
            status="Open",
            application_id=apps[4].id,
            alert_id=alt1.id,
            root_cause="Suspected downstream OCR latency and GPU worker thread exhaustion causing 504 timeouts.",
            created_at=now - timedelta(minutes=38)
        ))

        # 7. DISTRIBUTED TRACES (WITH FULL SPANS & MULTI-HOP CHAINS)
        db.add_all([
            Trace(
                transaction_id="tr-AUTH-22031",
                application_id=apps[0].id,
                request_path="/v1/customer/login",
                response_ms=185.0,
                failure_point=None,
                dependency_chain=["Customer Login", "Mobile App", "API Gateway", "Authentication Service", "Database", "Notification Service"],
                spans=[
                    {"span_id": "sp-1", "service": "Mobile App", "duration_ms": 15.0, "status": "ok"},
                    {"span_id": "sp-2", "service": "API Gateway", "duration_ms": 22.0, "status": "ok"},
                    {"span_id": "sp-3", "service": "Authentication Service", "duration_ms": 95.0, "status": "ok"},
                    {"span_id": "sp-4", "service": "User DB", "duration_ms": 32.0, "status": "ok"},
                    {"span_id": "sp-5", "service": "Notification Service", "duration_ms": 21.0, "status": "ok"},
                ],
                status="Success"
            ),
            Trace(
                transaction_id="tr-UPI-90821",
                application_id=apps[1].id,
                request_path="/v1/payments/upi/transfer",
                response_ms=5230.0,
                failure_point="Payment Gateway",
                dependency_chain=["Customer Mobile App", "API Gateway", "UPI Switch Service", "Payment Gateway"],
                spans=[
                    {"span_id": "sp-10", "service": "Customer Mobile App", "duration_ms": 25.0, "status": "ok"},
                    {"span_id": "sp-11", "service": "API Gateway", "duration_ms": 45.0, "status": "ok"},
                    {"span_id": "sp-12", "service": "UPI Switch Service", "duration_ms": 160.0, "status": "ok"},
                    {"span_id": "sp-13", "service": "Payment Gateway", "duration_ms": 5000.0, "status": "failed", "error": "Gateway Timeout (504)"},
                ],
                status="Failed"
            ),
            Trace(
                transaction_id="tr-LOAN-1042",
                application_id=apps[2].id,
                request_path="/v1/loans/apply",
                response_ms=640.0,
                failure_point=None,
                dependency_chain=["Web App", "API Gateway", "Loan Service", "Credit Bureau Adapter", "Customer DB"],
                spans=[
                    {"span_id": "sp-20", "service": "Web App", "duration_ms": 30.0, "status": "ok"},
                    {"span_id": "sp-21", "service": "API Gateway", "duration_ms": 35.0, "status": "ok"},
                    {"span_id": "sp-22", "service": "Loan Service", "duration_ms": 280.0, "status": "ok"},
                    {"span_id": "sp-23", "service": "Credit Bureau Adapter", "duration_ms": 240.0, "status": "ok"},
                    {"span_id": "sp-24", "service": "Customer DB", "duration_ms": 55.0, "status": "ok"},
                ],
                status="Success"
            ),
        ])

    # 8. BUSINESS WORKFLOWS
    if db.query(Workflow).count() == 0:
        db.add_all([
            Workflow(
                name="Retail loan journey",
                business_domain="Lending",
                status="At risk",
                tat_minutes=186.0,
                sla_minutes=120.0,
                failure_stage="Verification",
                stages=[
                    {"name": "Application Submitted", "status": "complete", "duration": 12.0},
                    {"name": "Verification", "status": "delayed", "duration": 94.0},
                    {"name": "Approval", "status": "pending", "duration": 0.0},
                    {"name": "Disbursement", "status": "pending", "duration": 0.0}
                ]
            ),
            Workflow(
                name="UPI payment journey",
                business_domain="Payments",
                status="Healthy",
                tat_minutes=2.4,
                sla_minutes=5.0,
                stages=[
                    {"name": "Initiated", "status": "complete", "duration": 0.2},
                    {"name": "Risk check", "status": "complete", "duration": 0.4},
                    {"name": "Bank routing", "status": "complete", "duration": 1.2},
                    {"name": "Confirmation", "status": "complete", "duration": 0.6}
                ]
            ),
            Workflow(
                name="Digital KYC onboarding",
                business_domain="Identity",
                status="At risk",
                tat_minutes=34.0,
                sla_minutes=20.0,
                failure_stage="Document upload",
                stages=[
                    {"name": "Profile Creation", "status": "complete", "duration": 4.0},
                    {"name": "Document upload", "status": "delayed", "duration": 22.0},
                    {"name": "Verification", "status": "pending", "duration": 0.0},
                    {"name": "Activation", "status": "pending", "duration": 0.0}
                ]
            ),
        ])

    # 9. INTEGRATION CATALOG (ALL SPECIFIED CATEGORIES)
    if db.query(Integration).count() == 0:
        integrations_data = [
            # Cloud
            ("AWS CloudWatch", "Cloud", "Configured", "https://monitoring.us-east-1.amazonaws.com"),
            ("Microsoft Azure Monitor", "Cloud", "Configured", "https://management.azure.com"),
            ("Google Cloud Operations", "Cloud", "Not configured", None),
            # DevOps
            ("GitHub Actions", "DevOps", "Configured", "https://api.github.com"),
            ("Jenkins CI", "DevOps", "Not configured", None),
            ("GitLab CI/CD", "DevOps", "Not configured", None),
            # Monitoring
            ("Prometheus", "Monitoring", "Configured", "http://prometheus-internal:9090"),
            ("Grafana", "Monitoring", "Configured", "http://grafana-internal:3000"),
            ("Splunk Enterprise", "Monitoring", "Not configured", None),
            ("Elasticsearch / ELK", "Monitoring", "Configured", "http://elasticsearch-internal:9200"),
            # Banking Systems
            ("Core Banking Engine", "Banking Systems", "Configured", "https://core-banking.internal.bank/v2"),
            ("UPI / Payment Systems", "Banking Systems", "Configured", "https://upi-switch.internal.bank/api"),
            ("CRM Customer Engine", "Banking Systems", "Not configured", None),
            ("Loan Origination Engine", "Banking Systems", "Configured", "https://los.internal.bank/api"),
            # Notifications
            ("Slack / Teams Webhook", "Notifications", "Configured", "https://hooks.slack.com/services/mock"),
        ]
        db.add_all([
            Integration(
                name=n,
                category=c,
                status=s,
                endpoint=ep,
                config={"auth_mode": "token" if ep else "none"}
            )
            for n, c, s, ep in integrations_data
        ])

    # 10. AUDIT EVENTS
    if db.query(AuditEvent).count() == 0:
        db.add_all([
            AuditEvent(actor="system", action="platform.initialize", resource_type="platform", details="Open Layer Platform database initialized and baseline telemetry seeded"),
            AuditEvent(actor="admin@openlayer.local", action="policy.configure", resource_type="alert_rule", details="Configured high latency & error cascade alert rule"),
        ])

    db.commit()
