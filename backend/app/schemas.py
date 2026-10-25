from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=190)
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    model_config = ConfigDict(from_attributes=True)

class ApplicationIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    owner: str = Field(min_length=2, max_length=180)
    business_function: str = Field(min_length=2, max_length=120)
    environment: str = Field(default="Dev", pattern="^(Dev|Test|Prod)$")
    technology_stack: str = Field(default="Unknown", max_length=240)
    hosting_environment: str = Field(default="Cloud", max_length=120)
    criticality: str = Field(default="Medium", pattern="^(Critical|High|Medium|Low)$")
    sla_target: float = Field(default=99.9, ge=0.0, le=100.0)

class ApplicationUpdateIn(BaseModel):
    name: str | None = None
    owner: str | None = None
    business_function: str | None = None
    environment: str | None = None
    technology_stack: str | None = None
    hosting_environment: str | None = None
    criticality: str | None = None
    sla_target: float | None = None
    status: str | None = None
    uptime_pct: float | None = None
    response_ms: float | None = None
    error_rate: float | None = None
    transaction_volume: int | None = None

class ApplicationOut(ApplicationIn):
    id: int
    status: str
    uptime_pct: float
    response_ms: float
    error_rate: float
    transaction_volume: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MetricIn(BaseModel):
    application_id: int
    layer: str = "Application"  # Application, Infrastructure, Database, API
    name: str
    value: float
    unit: str = ""
    recorded_at: datetime | None = None
    labels: dict = {}

class MetricOut(MetricIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class LogIn(BaseModel):
    application_id: int | None = None
    timestamp: datetime | None = None
    level: str = "INFO"
    category: str = "Application"  # Application, Security, Integration, Audit
    message: str
    trace_id: str | None = None
    source: str = "api"

class LogOut(LogIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AlertRuleIn(BaseModel):
    name: str
    condition_description: str
    metric_name: str
    operator: str = ">"
    threshold: float
    secondary_metric: str | None = None
    secondary_operator: str | None = None
    secondary_threshold: float | None = None
    severity: str = "Warning"
    is_active: bool = True

class AlertRuleOut(AlertRuleIn):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AlertIn(BaseModel):
    title: str
    severity: str = "Warning"  # Critical, Warning, Information
    status: str = "Open"
    application_id: int | None = None
    rule_id: int | None = None
    description: str = ""
    channel: str = "In-app"

class AlertOut(AlertIn):
    id: int
    created_at: datetime
    acknowledged_by: str | None = None
    model_config = ConfigDict(from_attributes=True)

class IncidentOut(BaseModel):
    id: int
    title: str
    severity: str
    status: str
    application_id: int | None
    alert_id: int | None
    root_cause: str
    created_at: datetime
    resolved_at: datetime | None
    model_config = ConfigDict(from_attributes=True)

class TraceIn(BaseModel):
    transaction_id: str
    application_id: int | None = None
    request_path: str
    response_ms: float = 0
    failure_point: str | None = None
    dependency_chain: list = []
    spans: list = []
    status: str = "Success"

class TraceOut(TraceIn):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WorkflowIn(BaseModel):
    name: str
    business_domain: str = "Banking"
    status: str = "In progress"
    tat_minutes: float = 0
    sla_minutes: float = 60
    failure_stage: str | None = None
    stages: list = []

class WorkflowOut(WorkflowIn):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IntegrationIn(BaseModel):
    name: str
    category: str
    status: str = "Not configured"
    endpoint: str | None = None
    config: dict = {}

class IntegrationOut(IntegrationIn):
    id: int
    last_tested_at: datetime | None = None
    test_message: str | None = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
