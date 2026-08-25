from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/docking", tags=["docking"])


@router.get("/", response_model=List[schemas.DockingOut])
def list_docking(
    search: Optional[str] = None,
    dock_no: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    q = db.query(models.DockingRecord)
    if search:
        q = q.filter(
            models.DockingRecord.container_no.contains(search) |
            models.DockingRecord.client_code.contains(search) |
            models.DockingRecord.carrier.contains(search)
        )
    if dock_no:
        q = q.filter(models.DockingRecord.dock_no.contains(dock_no))
    if status:
        q = q.filter(models.DockingRecord.status == status)
    return q.order_by(models.DockingRecord.date_in.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.DockingOut)
def create_docking(record: schemas.DockingCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_record = models.DockingRecord(**record.dict(), created_by=current_user.username)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/{record_id}", response_model=schemas.DockingOut)
def get_docking(record_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    r = db.query(models.DockingRecord).filter(models.DockingRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Docking record not found")
    return r


@router.put("/{record_id}", response_model=schemas.DockingOut)
def update_docking(record_id: int, record: schemas.DockingUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_record = db.query(models.DockingRecord).filter(models.DockingRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Docking record not found")
    for field, value in record.dict(exclude_unset=True).items():
        setattr(db_record, field, value)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/{record_id}")
def delete_docking(record_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_admin_user)):
    r = db.query(models.DockingRecord).filter(models.DockingRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Docking record not found")
    db.delete(r)
    db.commit()
    return {"ok": True}
