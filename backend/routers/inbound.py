from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/inbound", tags=["inbound"])


def enrich_container(container: models.Container, db: Session) -> dict:
    """Add computed inventory fields"""
    agg = db.query(
        func.coalesce(func.sum(models.OutboundRecord.ctns_out), 0),
        func.coalesce(func.sum(models.OutboundRecord.skids_out), 0),
    ).filter(models.OutboundRecord.container_id == container.id).first()
    ctns_out = agg[0]
    skids_out = agg[1]
    d = {c.name: getattr(container, c.name) for c in container.__table__.columns}
    d["ctns_out_total"] = ctns_out
    d["skids_out_total"] = skids_out
    d["ctns_balance"] = max(0, d["ctns_in"] - ctns_out)
    d["skids_balance"] = max(0, d["skids_in"] - skids_out)
    return d


@router.get("/", response_model=List[schemas.ContainerOut])
def list_containers(
    search: Optional[str] = None,
    client_code: Optional[str] = None,
    status: Optional[str] = None,
    destination: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    q = db.query(models.Container)
    if search:
        q = q.filter(
            models.Container.container_no.contains(search) |
            models.Container.client_code.contains(search) |
            models.Container.mark.contains(search)
        )
    if client_code:
        q = q.filter(models.Container.client_code == client_code)
    if status:
        q = q.filter(models.Container.status == status)
    if destination:
        q = q.filter(models.Container.destination.contains(destination))
    containers = q.order_by(models.Container.date_in.desc()).offset(skip).limit(limit).all()
    return [enrich_container(c, db) for c in containers]


@router.post("/", response_model=schemas.ContainerOut)
def create_container(container: schemas.ContainerCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    # Ensure client exists
    if not db.query(models.Client).filter(models.Client.code == container.client_code).first():
        # Auto-create client if not exists
        db.add(models.Client(code=container.client_code, name=container.client_code))
        db.commit()
    db_container = models.Container(**container.dict(), created_by=current_user.username)
    db.add(db_container)
    db.commit()
    db.refresh(db_container)
    return enrich_container(db_container, db)


@router.get("/{container_id}", response_model=schemas.ContainerOut)
def get_container(container_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    c = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Container not found")
    return enrich_container(c, db)


@router.put("/{container_id}", response_model=schemas.ContainerOut)
def update_container(container_id: int, container: schemas.ContainerUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_container = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not db_container:
        raise HTTPException(status_code=404, detail="Container not found")
    for field, value in container.dict(exclude_unset=True).items():
        setattr(db_container, field, value)
    db.commit()
    db.refresh(db_container)
    return enrich_container(db_container, db)


@router.delete("/{container_id}")
def delete_container(container_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_admin_user)):
    db_container = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not db_container:
        raise HTTPException(status_code=404, detail="Container not found")
    db.delete(db_container)
    db.commit()
    return {"ok": True}
