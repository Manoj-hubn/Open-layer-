from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(190), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(40), default="Application Owner")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    owner: Mapped[str] = mapped_column(String(180))
    business_function: Mapped[str] = mapped_column(String(120))
    environment: Mapped[str] = mapped_column(String(30), default="Dev")  # Dev, Test, Prod
    technology_stack: Mapped[str] = mapped_column(String(240), default="Unknown")
    hosting_environment: Mapped[str] = mapped_column(String(120), default="Cloud")  # AWS, Azure, GCP, etc.
    criticality: Mapped[str] = mapped_column(String(30), default="Medium")  # Critical, High, Medium, Low
    sla_target: Mapped[float] = mapped_column(Float, default=99.9)
    status: Mapped[str] = mapped_column(String(30), default="Healthy")  # Healthy, Degraded, Down
    uptime_pct: Mapped[float] = mapped_column(Float, default=99.95)
    response_ms: Mapped[float] = mapped_column(Float, default=180.0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.4)
    transaction_volume: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Metric(Base):
    __tablename__ = "metrics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    layer: Mapped[str] = mapped_column(String(40), default="Application", index=True)  # Application, Infrastructure, Database, API
    name: Mapped[str] = mapped_column(String(100), index=True)
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(30), default="")
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    labels: Mapped[dict] = mapped_column(JSON, default=dict)

class LogEntry(Base):
    __tablename__ = "logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    level: Mapped[str] = mapped_column(String(20), default="INFO", index=True)  # INFO, WARN, ERROR, DEBUG
    category: Mapped[str] = mapped_column(String(40), default="Application", index=True)  # Application, Security, Integration, Audit
    message: Mapped[str] = mapped_column(Text)
    trace_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(180), default="api")

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(180))
    condition_description: Mapped[str] = mapped_column(String(255))
    metric_name: Mapped[str] = mapped_column(String(80))
    operator: Mapped[str] = mapped_column(String(10), default=">")  # >, >=, <, <=, ==
    threshold: Mapped[float] = mapped_column(Float)
    secondary_metric: Mapped[str | None] = mapped_column(String(80), nullable=True)
    secondary_operator: Mapped[str | None] = mapped_column(String(10), nullable=True)
    secondary_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="Warning")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(220))
    severity: Mapped[str] = mapped_column(String(20), default="Warning", index=True)  # Critical, Warning, Information
    status: Mapped[str] = mapped_column(String(30), default="Open", index=True)  # Open, Acknowledged, Resolved
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    rule_id: Mapped[int | None] = mapped_column(ForeignKey("alert_rules.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    channel: Mapped[str] = mapped_column(String(40), default="In-app")  # Email, SMS, Teams/Slack, Mobile notification, Webhook
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String(180), nullable=True)

class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(220))
    severity: Mapped[str] = mapped_column(String(20), default="Warning")
    status: Mapped[str] = mapped_column(String(30), default="Open")  # Open, In Progress, Resolved, Closed
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    alert_id: Mapped[int | None] = mapped_column(ForeignKey("alerts.id"), nullable=True)
    root_cause: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Trace(Base):
    __tablename__ = "traces"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(String(100), index=True)
    application_id: Mapped[int | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    request_path: Mapped[str] = mapped_column(String(500))
    response_ms: Mapped[float] = mapped_column(Float, default=0)
    failure_point: Mapped[str | None] = mapped_column(String(180), nullable=True)
    dependency_chain: Mapped[list] = mapped_column(JSON, default=list)
    spans: Mapped[list] = mapped_column(JSON, default=list)  # Detailed span objects with timings
    status: Mapped[str] = mapped_column(String(30), default="Success")  # Success, Failed, Degraded
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Workflow(Base):
    __tablename__ = "workflows"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(180))
    business_domain: Mapped[str] = mapped_column(String(100), default="Banking")  # Lending, Payments, Identity, Core Banking
    status: Mapped[str] = mapped_column(String(30), default="In progress")  # Healthy, At risk, Delayed, Failed, Completed
    tat_minutes: Mapped[float] = mapped_column(Float, default=0)
    sla_minutes: Mapped[float] = mapped_column(Float, default=60)
    failure_stage: Mapped[str | None] = mapped_column(String(120), nullable=True)
    stages: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Integration(Base):
    __tablename__ = "integrations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(80))  # Cloud, DevOps, Monitoring, Banking Systems, Security
    status: Mapped[str] = mapped_column(String(30), default="Not configured")  # Connected, Configured, Disconnected, Not configured
    endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    last_tested_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    test_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(190))
    action: Mapped[str] = mapped_column(String(120))
    resource_type: Mapped[str] = mapped_column(String(80))
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
