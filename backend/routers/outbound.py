from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/outbound", tags=["outbound"])


def enrich_outbound(record: models.OutboundRecord) -> dict:
    d = {c.name: getattr(record, c.name) for c in record.__table__.columns}
    if record.container:
        d["container_no"] = record.container.container_no
        d["client_code"] = record.container.client_code
    else:
        d["container_no"] = None
        d["client_code"] = None
    return d


@router.get("/", response_model=List[schemas.OutboundOut])
def list_outbound(
    search: Optional[str] = None,
    container_id: Optional[int] = None,
    carrier: Optional[str] = None,
    destination: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    q = db.query(models.OutboundRecord)
    if container_id:
        q = q.filter(models.OutboundRecord.container_id == container_id)
    if carrier:
        q = q.filter(models.OutboundRecord.carrier.contains(carrier))
    if destination:
        q = q.filter(models.OutboundRecord.destination.contains(destination))
    if search:
        q = q.join(models.Container, isouter=True).filter(
            models.Container.container_no.contains(search) |
            models.OutboundRecord.carrier.contains(search) |
            models.OutboundRecord.destination.contains(search) |
            models.OutboundRecord.pod.contains(search)
        )
    records = q.order_by(models.OutboundRecord.date_out.desc()).offset(skip).limit(limit).all()
    return [enrich_outbound(r) for r in records]


@router.post("/", response_model=schemas.OutboundOut)
def create_outbound(record: schemas.OutboundCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    container = db.query(models.Container).filter(models.Container.id == record.container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    db_record = models.OutboundRecord(**record.dict(), created_by=current_user.username)
    db.add(db_record)
    # Update container status
    total_out = db.query(func.coalesce(func.sum(models.OutboundRecord.ctns_out), 0)).filter(
        models.OutboundRecord.container_id == container.id).scalar() + record.ctns_out
    if total_out >= container.ctns_in:
        container.status = "Completed"
    else:
        container.status = "Partially Out"
    db.commit()
    db.refresh(db_record)
    return enrich_outbound(db_record)


@router.get("/{record_id}", response_model=schemas.OutboundOut)
def get_outbound(record_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    r = db.query(models.OutboundRecord).filter(models.OutboundRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    return enrich_outbound(r)


@router.put("/{record_id}", response_model=schemas.OutboundOut)
def update_outbound(record_id: int, record: schemas.OutboundUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_record = db.query(models.OutboundRecord).filter(models.OutboundRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    for field, value in record.dict(exclude_unset=True).items():
        setattr(db_record, field, value)
    db.commit()
    db.refresh(db_record)
    return enrich_outbound(db_record)


@router.delete("/{record_id}")
def delete_outbound(record_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_admin_user)):
    r = db.query(models.OutboundRecord).filter(models.OutboundRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(r)
    db.commit()
    return {"ok": True}
