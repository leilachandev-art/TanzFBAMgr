from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/carriers", tags=["carriers"])


@router.get("/", response_model=List[schemas.AppointmentOut])
def list_appointments(
    search: Optional[str] = None,
    client_code: Optional[str] = None,
    status: Optional[str] = None,
    destination_fc: Optional[str] = None,
    carrier: Optional[str] = None,
    skip: int = 0,
    limit: int = 300,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    q = db.query(models.FbaAppointment)
    if search:
        q = q.filter(
            models.FbaAppointment.appointment_id.contains(search) |
            models.FbaAppointment.reference_code.contains(search) |
            models.FbaAppointment.trailer_number.contains(search) |
            models.FbaAppointment.carrier.contains(search)
        )
    if client_code:
        q = q.filter(models.FbaAppointment.client_code == client_code)
    if status:
        q = q.filter(models.FbaAppointment.status == status)
    if destination_fc:
        q = q.filter(models.FbaAppointment.destination_fc.contains(destination_fc))
    if carrier:
        q = q.filter(models.FbaAppointment.carrier.contains(carrier))
    return q.order_by(models.FbaAppointment.id.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.AppointmentOut)
def create_appointment(appt: schemas.AppointmentCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_appt = models.FbaAppointment(**appt.dict(), created_by=current_user.username)
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt


@router.get("/{appt_id}", response_model=schemas.AppointmentOut)
def get_appointment(appt_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    appt = db.query(models.FbaAppointment).filter(models.FbaAppointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.put("/{appt_id}", response_model=schemas.AppointmentOut)
def update_appointment(appt_id: int, appt: schemas.AppointmentUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_appt = db.query(models.FbaAppointment).filter(models.FbaAppointment.id == appt_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for field, value in appt.dict(exclude_unset=True).items():
        setattr(db_appt, field, value)
    db.commit()
    db.refresh(db_appt)
    return db_appt


@router.delete("/{appt_id}")
def delete_appointment(appt_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_admin_user)):
    appt = db.query(models.FbaAppointment).filter(models.FbaAppointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()
    return {"ok": True}
