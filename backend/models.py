from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String)  # values: admin or reviewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    vendor_name = Column(String)
    vendor_email = Column(String, nullable=True)
    customer_name = Column(String)
    po_number = Column(String, nullable=True)
    invoice_date = Column(DateTime)
    amount = Column(Float)
    tax = Column(Float, default=0.0)
    total_amount = Column(Float)
    status = Column(String, default="pending")  # pending, accepted, rejected, in_review
    email_id = Column(String, nullable=True)
    email_subject = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    drive_file_id = Column(String, nullable=True)
    ocr_data = Column(JSON, nullable=True)
    reviewed_by = Column(String, nullable=True)  # Username of reviewer
    reviewed_at = Column(DateTime, nullable=True)  # Date/time of review
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class LineItem(Base):
    __tablename__ = "line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Float)
    unit_price = Column(Float)
    total_price = Column(Float)
    created_at = Column(DateTime, default=func.now())


class InvoiceAuditLog(Base):
    __tablename__ = "invoice_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)  # created, updated, reviewed, accepted, rejected
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())


class EmailIngestionLog(Base):
    __tablename__ = "email_ingestion_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    email_subject = Column(String)
    filename = Column(String)
    email_from = Column(String)
    email_date = Column(DateTime)
    status = Column(String)  # success, failed, skipped
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    error_message = Column(String, nullable=True)
    drive_file_id = Column(String, nullable=True)
    drive_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    action = Column(String, index=True)
    details = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())