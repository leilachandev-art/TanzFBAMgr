from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/", response_model=List[schemas.ClientOut])
def list_clients(search: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    q = db.query(models.Client)
    if search:
        q = q.filter(models.Client.code.contains(search) | models.Client.name.contains(search))
    return q.order_by(models.Client.code).all()


@router.post("/", response_model=schemas.ClientOut)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    if db.query(models.Client).filter(models.Client.code == client.code).first():
        raise HTTPException(status_code=400, detail="Client code already exists")
    db_client = models.Client(**client.dict())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.get("/{client_id}", response_model=schemas.ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    c = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@router.put("/{client_id}", response_model=schemas.ClientOut)
def update_client(client_id: int, client: schemas.ClientUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in client.dict(exclude_unset=True).items():
        setattr(db_client, field, value)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_admin_user)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(db_client)
    db.commit()
    return {"ok": True}
