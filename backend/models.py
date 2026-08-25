from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    email = Column(String(100))
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="staff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200))
    contact = Column(String(100))
    phone = Column(String(50))
    email = Column(String(100))
    note = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    containers = relationship("Container", back_populates="client_obj")


class Container(Base):
    """Inbound container / shipment record"""
    __tablename__ = "containers"
    id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String(50), ForeignKey("clients.code"), index=True, nullable=False)
    date_in = Column(DateTime)
    container_type = Column(String(50))          # container / truck / LTL
    container_no = Column(String(100), index=True)  # CN# / JOB#
    mark = Column(String(200))
    inspection = Column(String(50))              # 清点 result: 一致/短少/多出
    ctns_in = Column(Integer, default=0)         # cartons inbound
    skids_in = Column(Integer, default=0)
    sku = Column(String(500))
    destination = Column(String(100))            # Amazon FC code e.g. YYZ9
    note = Column(Text)
    status = Column(String(50), default="In Storage")  # In Storage / Partially Out / Completed
    created_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client_obj = relationship("Client", back_populates="containers")
    outbounds = relationship("OutboundRecord", back_populates="container")
    docking = relationship("DockingRecord", back_populates="container")


class OutboundRecord(Base):
    """Each outbound delivery from a container"""
    __tablename__ = "outbound_records"
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), index=True, nullable=False)
    date_out = Column(DateTime)
    ctns_out = Column(Integer, default=0)
    skids_out = Column(Integer, default=0)
    carrier = Column(String(100))
    destination = Column(String(100))            # Amazon FC
    isa = Column(String(100))                    # ISA / appointment ISA
    note = Column(Text)
    pod = Column(String(200))                    # Proof of Delivery
    wait_time = Column(String(50))              # 等时
    time_in = Column(String(50))
    time_out = Column(String(50))
    total_pallets = Column(Integer)
    created_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    container = relationship("Container", back_populates="outbounds")


class FbaAppointment(Base):
    """FBA carrier appointment tracking"""
    __tablename__ = "fba_appointments"
    id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String(50), index=True)
    appointment_id = Column(String(100), index=True)
    trailer_number = Column(String(100))
    reference_code = Column(String(200))
    destination_fc = Column(String(50))
    isa = Column(String(100))
    carrier = Column(String(100))
    status = Column(String(100), default="PENDING")
    requested_delivery_date = Column(String(100))
    earliest_arrival_time = Column(String(100))
    scheduled_time = Column(String(100))
    arrival_time = Column(String(100))
    checkin_time = Column(String(100))
    unloaded_time = Column(String(100))
    closed_time = Column(String(100))
    creation_time = Column(String(100))
    note = Column(Text)
    created_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DockingRecord(Base):
    """Dock door assignment form"""
    __tablename__ = "docking_records"
    id = Column(Integer, primary_key=True, index=True)
    date_in = Column(DateTime)
    dock_no = Column(String(50))
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)
    container_no = Column(String(100))
    carrier = Column(String(100))
    client_code = Column(String(50))
    status = Column(String(50), default="PENDING")  # FULL / EMPTY / PARTIAL
    date_out = Column(DateTime, nullable=True)
    note = Column(Text)
    created_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    container = relationship("Container", back_populates="docking")
