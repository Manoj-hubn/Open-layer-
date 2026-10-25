from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.entities import Application, Metric, Alert, AuditEvent
from app.schemas import ApplicationIn, ApplicationUpdateIn, ApplicationOut
from app.security import current_user, require_roles
from app.services.analytics import analyze_application_anomalies, perform_root_cause_analysis

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationIn,
    db: Session = Depends(get_db),
    user = Depends(require_roles("Admin", "Application Owner"))
):
    # Check for duplicate application name
    existing = db.query(Application).filter(Application.name.ilike(data.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Application with name '{data.name}' already registered.")
        
    row = Application(**data.model_dump())
    db.add(row)
    db.flush()
    db.add(AuditEvent(
        actor=user.email,
        action="application.create",
        resource_type="application",
        resource_id=str(row.id),
        details=f"Created application {row.name} in environment {row.environment}"
    ))
    db.commit()
    db.refresh(row)
    return row

@router.get("", response_model=list[ApplicationOut])
def list_applications(
    q: str | None = None,
    environment: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    query = db.query(Application)
    if q:
        query = query.filter(
            (Application.name.ilike(f"%{q}%")) |
            (Application.owner.ilike(f"%{q}%")) |
            (Application.business_function.ilike(f"%{q}%"))
        )
    if environment and environment != "All":
        query = query.filter(Application.environment == environment)
    if status and status != "All":
        query = query.filter(Application.status == status)
    return query.order_by(Application.id.desc()).all()

@router.get("/{application_id}")
def get_application_details(
    application_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    row = db.get(Application, application_id)
    if not row:
        raise HTTPException(404, "Application not found")
        
    recent_metrics = db.query(Metric).filter(
        Metric.application_id == application_id
    ).order_by(desc(Metric.recorded_at)).limit(50).all()
    
    active_alerts = db.query(Alert).filter(
        Alert.application_id == application_id,
        Alert.status == "Open"
    ).all()
    
    anomalies = analyze_application_anomalies(row)
    
    return {
        "application": ApplicationOut.model_validate(row),
        "anomalies": anomalies,
        "active_alerts_count": len(active_alerts),
        "recent_metrics": [
            {"name": m.name, "value": m.value, "unit": m.unit, "layer": m.layer, "recorded_at": m.recorded_at}
            for m in recent_metrics
        ]
    }

@router.put("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    data: ApplicationUpdateIn,
    db: Session = Depends(get_db),
    user = Depends(require_roles("Admin", "Application Owner"))
):
    row = db.get(Application, application_id)
    if not row:
        raise HTTPException(404, "Application not found")
        
    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != row.name:
        existing = db.query(Application).filter(Application.name.ilike(update_data["name"].strip())).first()
        if existing and existing.id != row.id:
            raise HTTPException(400, f"Application with name '{update_data['name']}' already exists.")

    for key, value in update_data.items():
        if value is not None:
            setattr(row, key, value)
            
    db.add(AuditEvent(
        actor=user.email,
        action="application.update",
        resource_type="application",
        resource_id=str(row.id),
        details=f"Updated application {row.name} attributes: {', '.join(update_data.keys())}"
    ))
    db.commit()
    db.refresh(row)
    return row

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_roles("Admin"))
):
    row = db.get(Application, application_id)
    if not row:
        raise HTTPException(404, "Application not found")
    app_name = row.name
    
    # Delete associated metrics, alerts, traces to preserve referential integrity
    db.query(Metric).filter(Metric.application_id == application_id).delete(synchronize_session=False)
    db.query(Alert).filter(Alert.application_id == application_id).delete(synchronize_session=False)
    db.delete(row)
    db.add(AuditEvent(
        actor=user.email,
        action="application.delete",
        resource_type="application",
        resource_id=str(application_id),
        details=f"Deleted application {app_name}"
    ))
    db.commit()
    return None

@router.get("/{application_id}/insights")
def application_insights(
    application_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    row = db.get(Application, application_id)
    if not row:
        raise HTTPException(404, "Application not found")
    return {
        "application_id": row.id,
        "application_name": row.name,
        "hints": analyze_application_anomalies(row),
        "mode": "statistical_heuristic",
        "description": "Rules evaluated against response time, error rate, and SLA compliance."
    }

@router.get("/{application_id}/root-cause")
def application_root_cause(
    application_id: int,
    db: Session = Depends(get_db),
    user = Depends(current_user)
):
    row = db.get(Application, application_id)
    if not row:
        raise HTTPException(404, "Application not found")
    return perform_root_cause_analysis(row, db)
