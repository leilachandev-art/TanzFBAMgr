from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
import models, auth

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/")
def get_inventory(
    search: Optional[str] = None,
    client_code: Optional[str] = None,
    destination: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """Returns containers with balance > 0 (items still in storage)"""
    q = db.query(models.Container).filter(models.Container.status != "Completed")
    if search:
        q = q.filter(
            models.Container.container_no.contains(search) |
            models.Container.client_code.contains(search)
        )
    if client_code:
        q = q.filter(models.Container.client_code == client_code)
    if destination:
        q = q.filter(models.Container.destination.contains(destination))

    results = []
    for c in q.order_by(models.Container.date_in.desc()).all():
        agg = db.query(
            func.coalesce(func.sum(models.OutboundRecord.ctns_out), 0),
            func.coalesce(func.sum(models.OutboundRecord.skids_out), 0),
        ).filter(models.OutboundRecord.container_id == c.id).first()
        ctns_balance = max(0, c.ctns_in - agg[0])
        skids_balance = max(0, c.skids_in - agg[1])
        if ctns_balance > 0 or c.status == "In Storage":
            results.append({
                "id": c.id,
                "client_code": c.client_code,
                "container_no": c.container_no,
                "container_type": c.container_type,
                "date_in": c.date_in,
                "destination": c.destination,
                "sku": c.sku,
                "mark": c.mark,
                "ctns_in": c.ctns_in,
                "skids_in": c.skids_in,
                "ctns_out": agg[0],
                "skids_out": agg[1],
                "ctns_balance": ctns_balance,
                "skids_balance": skids_balance,
                "status": c.status,
            })
    return results


@router.get("/summary")
def inventory_summary(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    total_ctns_in = db.query(func.coalesce(func.sum(models.Container.ctns_in), 0)).scalar()
    total_ctns_out = db.query(func.coalesce(func.sum(models.OutboundRecord.ctns_out), 0)).scalar()
    total_skids_in = db.query(func.coalesce(func.sum(models.Container.skids_in), 0)).scalar()
    total_skids_out = db.query(func.coalesce(func.sum(models.OutboundRecord.skids_out), 0)).scalar()
    active = db.query(models.Container).filter(models.Container.status == "In Storage").count()
    partial = db.query(models.Container).filter(models.Container.status == "Partially Out").count()
    completed = db.query(models.Container).filter(models.Container.status == "Completed").count()
    return {
        "total_ctns_in": total_ctns_in,
        "total_ctns_out": total_ctns_out,
        "total_ctns_balance": max(0, total_ctns_in - total_ctns_out),
        "total_skids_in": total_skids_in,
        "total_skids_out": total_skids_out,
        "total_skids_balance": max(0, total_skids_in - total_skids_out),
        "active_containers": active,
        "partial_containers": partial,
        "completed_containers": completed,
    }
