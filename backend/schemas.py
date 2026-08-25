from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ---- Auth ----
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ---- User ----
class UserCreate(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: str
    role: str = "staff"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    role: str
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ---- Client ----
class ClientCreate(BaseModel):
    code: str
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None


class ClientOut(BaseModel):
    id: int
    code: str
    name: Optional[str]
    contact: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    note: Optional[str]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ---- Container (Inbound) ----
class ContainerCreate(BaseModel):
    client_code: str
    date_in: Optional[datetime] = None
    container_type: Optional[str] = "container"
    container_no: Optional[str] = None
    mark: Optional[str] = None
    inspection: Optional[str] = None
    ctns_in: int = 0
    skids_in: int = 0
    sku: Optional[str] = None
    destination: Optional[str] = None
    note: Optional[str] = None
    status: str = "In Storage"


class ContainerUpdate(BaseModel):
    client_code: Optional[str] = None
    date_in: Optional[datetime] = None
    container_type: Optional[str] = None
    container_no: Optional[str] = None
    mark: Optional[str] = None
    inspection: Optional[str] = None
    ctns_in: Optional[int] = None
    skids_in: Optional[int] = None
    sku: Optional[str] = None
    destination: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None


class ContainerOut(BaseModel):
    id: int
    client_code: str
    date_in: Optional[datetime]
    container_type: Optional[str]
    container_no: Optional[str]
    mark: Optional[str]
    inspection: Optional[str]
    ctns_in: int
    skids_in: int
    sku: Optional[str]
    destination: Optional[str]
    note: Optional[str]
    status: str
    created_by: Optional[str]
    created_at: Optional[datetime]
    # computed inventory
    ctns_out_total: Optional[int] = 0
    skids_out_total: Optional[int] = 0
    ctns_balance: Optional[int] = 0
    skids_balance: Optional[int] = 0

    class Config:
        orm_mode = True


# ---- Outbound ----
class OutboundCreate(BaseModel):
    container_id: int
    date_out: Optional[datetime] = None
    ctns_out: int = 0
    skids_out: int = 0
    carrier: Optional[str] = None
    destination: Optional[str] = None
    isa: Optional[str] = None
    note: Optional[str] = None
    pod: Optional[str] = None
    wait_time: Optional[str] = None
    time_in: Optional[str] = None
    time_out: Optional[str] = None
    total_pallets: Optional[int] = None


class OutboundUpdate(BaseModel):
    date_out: Optional[datetime] = None
    ctns_out: Optional[int] = None
    skids_out: Optional[int] = None
    carrier: Optional[str] = None
    destination: Optional[str] = None
    isa: Optional[str] = None
    note: Optional[str] = None
    pod: Optional[str] = None
    wait_time: Optional[str] = None
    time_in: Optional[str] = None
    time_out: Optional[str] = None
    total_pallets: Optional[int] = None


class OutboundOut(BaseModel):
    id: int
    container_id: int
    container_no: Optional[str] = None
    client_code: Optional[str] = None
    date_out: Optional[datetime]
    ctns_out: int
    skids_out: int
    carrier: Optional[str]
    destination: Optional[str]
    isa: Optional[str]
    note: Optional[str]
    pod: Optional[str]
    wait_time: Optional[str]
    time_in: Optional[str]
    time_out: Optional[str]
    total_pallets: Optional[int]
    created_by: Optional[str]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ---- FBA Appointment ----
class AppointmentCreate(BaseModel):
    client_code: Optional[str] = None
    appointment_id: Optional[str] = None
    trailer_number: Optional[str] = None
    reference_code: Optional[str] = None
    destination_fc: Optional[str] = None
    isa: Optional[str] = None
    carrier: Optional[str] = None
    status: str = "PENDING"
    requested_delivery_date: Optional[str] = None
    earliest_arrival_time: Optional[str] = None
    scheduled_time: Optional[str] = None
    arrival_time: Optional[str] = None
    checkin_time: Optional[str] = None
    unloaded_time: Optional[str] = None
    closed_time: Optional[str] = None
    creation_time: Optional[str] = None
    note: Optional[str] = None


class AppointmentUpdate(BaseModel):
    client_code: Optional[str] = None
    appointment_id: Optional[str] = None
    trailer_number: Optional[str] = None
    reference_code: Optional[str] = None
    destination_fc: Optional[str] = None
    isa: Optional[str] = None
    carrier: Optional[str] = None
    status: Optional[str] = None
    requested_delivery_date: Optional[str] = None
    earliest_arrival_time: Optional[str] = None
    scheduled_time: Optional[str] = None
    arrival_time: Optional[str] = None
    checkin_time: Optional[str] = None
    unloaded_time: Optional[str] = None
    closed_time: Optional[str] = None
    creation_time: Optional[str] = None
    note: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    client_code: Optional[str]
    appointment_id: Optional[str]
    trailer_number: Optional[str]
    reference_code: Optional[str]
    destination_fc: Optional[str]
    isa: Optional[str]
    carrier: Optional[str]
    status: str
    requested_delivery_date: Optional[str]
    earliest_arrival_time: Optional[str]
    scheduled_time: Optional[str]
    arrival_time: Optional[str]
    checkin_time: Optional[str]
    unloaded_time: Optional[str]
    closed_time: Optional[str]
    creation_time: Optional[str]
    note: Optional[str]
    created_by: Optional[str]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ---- Docking ----
class DockingCreate(BaseModel):
    date_in: Optional[datetime] = None
    dock_no: Optional[str] = None
    container_id: Optional[int] = None
    container_no: Optional[str] = None
    carrier: Optional[str] = None
    client_code: Optional[str] = None
    status: str = "PENDING"
    date_out: Optional[datetime] = None
    note: Optional[str] = None


class DockingUpdate(BaseModel):
    date_in: Optional[datetime] = None
    dock_no: Optional[str] = None
    container_no: Optional[str] = None
    carrier: Optional[str] = None
    client_code: Optional[str] = None
    status: Optional[str] = None
    date_out: Optional[datetime] = None
    note: Optional[str] = None


class DockingOut(BaseModel):
    id: int
    date_in: Optional[datetime]
    dock_no: Optional[str]
    container_id: Optional[int]
    container_no: Optional[str]
    carrier: Optional[str]
    client_code: Optional[str]
    status: str
    date_out: Optional[datetime]
    note: Optional[str]
    created_by: Optional[str]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ---- Dashboard ----
class DashboardStats(BaseModel):
    total_containers: int
    active_containers: int
    total_ctns_in: int
    total_ctns_out: int
    total_ctns_balance: int
    pending_appointments: int
    active_docks: int
    recent_inbound: list
    recent_outbound: list
