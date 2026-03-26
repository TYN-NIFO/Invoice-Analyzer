from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Invoice, LineItem, InvoiceAuditLog, EmailIngestionLog, User
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func
import io
import re
from pydantic import BaseModel
import boto3
import os
from services.email_ingestion import process_emails_async, get_s3_client, process_manual_invoice_upload, log_ingestion
from auth import verify_api_key

SECURITY_TERMS = [
    "security", "otp", "2fa", "mfa", "verification", "verify", "alert",
    "unauthorized", "suspicious", "password", "sign-in", "login", "fraud", "phishing"
]

def classify_mail_category(subject: str, status: str) -> str:
    if status == "success":
        return "invoice"
    if status == "skipped":
        subject_lower = (subject or "").lower()
        if any(term in subject_lower for term in SECURITY_TERMS):
            return "security"
        return "other"
    return "unknown"

router = APIRouter()

# ============= PYDANTIC SCHEMAS =============

class LineItemSchema(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total_price: float

class InvoiceCreateSchema(BaseModel):
    invoice_number: str
    vendor_name: str
    vendor_email: Optional[str] = None
    customer_name: str
    po_number: Optional[str] = None
    invoice_date: datetime
    amount: float
    tax: float
    total_amount: float
    line_items: List[LineItemSchema] = []
    email_subject: Optional[str] = None
    pdf_url: Optional[str] = None
    ocr_data: Optional[dict] = None

class InvoiceUpdateSchema(BaseModel):
    status: str
    notes: Optional[str] = None
    reviewed_by: Optional[str] = None  # Username of the reviewer

class LineItemUpdateSchema(BaseModel):
    id: int
    unit_price: float

class InvoiceDetailsUpdateSchema(BaseModel):
    invoice_number: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_email: Optional[str] = None
    customer_name: Optional[str] = None
    po_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    amount: Optional[float] = None
    tax: Optional[float] = None
    line_items: Optional[List[LineItemUpdateSchema]] = None

class InvoiceResponseSchema(BaseModel):
    id: int
    invoice_number: str
    vendor_name: str
    vendor_email: Optional[str]
    customer_name: str
    po_number: Optional[str]
    invoice_date: datetime
    amount: float
    tax: float
    total_amount: float
    status: str
    email_subject: Optional[str]
    pdf_url: Optional[str]
    drive_file_id: Optional[str]
    created_at: datetime
    line_items: List[LineItemSchema]

    class Config:
        from_attributes = True

# ============= INVOICE ROUTES =============

@router.post("/invoices", response_model=dict)
async def create_invoice(invoice_data: InvoiceCreateSchema, db: Session = Depends(get_db)):
    """Create a new invoice from OCR data"""
    try:
        # Create invoice
        new_invoice = Invoice(
            invoice_number=invoice_data.invoice_number,
            vendor_name=invoice_data.vendor_name,
            vendor_email=invoice_data.vendor_email,
            customer_name=invoice_data.customer_name,
            po_number=invoice_data.po_number,
            invoice_date=invoice_data.invoice_date,
            amount=invoice_data.amount,
            tax=invoice_data.tax,
            total_amount=invoice_data.total_amount,
            status="pending",
            email_subject=invoice_data.email_subject,
            pdf_url=invoice_data.pdf_url,
            ocr_data=invoice_data.ocr_data
        )
        
        db.add(new_invoice)
        db.flush()  # Flush to get the ID
        
        # Create line items
        for item in invoice_data.line_items:
            line_item = LineItem(
                invoice_id=new_invoice.id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price
            )
            db.add(line_item)
        
        db.commit()
        
        return {
            "success": True,
            "invoice_id": new_invoice.id,
            "message": f"Invoice {invoice_data.invoice_number} created successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating invoice: {str(e)}"
        )

@router.get("/invoices")
async def get_invoices(
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db)
):
    """Get all invoices with optional filtering"""
    try:
        query = db.query(Invoice)
        
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        invoices = query.offset((page - 1) * page_size).limit(page_size).all()
        
        # Fetch line items for each invoice
        invoices_data = []
        for invoice in invoices:
            line_items = db.query(LineItem).filter(LineItem.invoice_id == invoice.id).all()
            invoices_data.append({
                "id": invoice.id,
                "invoiceNumber": invoice.invoice_number,
                "vendorName": invoice.vendor_name,
                "vendorEmail": invoice.vendor_email,
                "customerName": invoice.customer_name,
                "poNumber": invoice.po_number,
                "invoiceDate": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                "amount": invoice.amount,
                "tax": invoice.tax,
                "totalAmount": invoice.total_amount,
                "status": invoice.status,
                "emailSubject": invoice.email_subject,
                "pdfUrl": invoice.pdf_url,
                "reviewedBy": invoice.reviewed_by,
                "reviewedAt": invoice.reviewed_at.isoformat() if invoice.reviewed_at else None,
                "createdAt": invoice.created_at.isoformat() if invoice.created_at else None,
                "lineItems": [
                    {
                        "id": item.id,
                        "description": item.description,
                        "quantity": item.quantity,
                        "unitPrice": item.unit_price,
                        "total": item.total_price
                    }
                    for item in line_items
                ]
            })
        
        return {
            "data": invoices_data,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching invoices: {str(e)}"
        )

@router.get("/invoices/history")
async def get_invoice_decision_history(
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db)
):
    """Get accepted/rejected invoices ordered by decision date"""
    try:
        query = (
            db.query(Invoice)
            .filter(Invoice.status.in_(["accepted", "rejected"]))
            .order_by(Invoice.reviewed_at.desc().nullslast(), Invoice.created_at.desc())
        )

        total = query.count()
        total_pages = (total + page_size - 1) // page_size

        invoices = query.offset((page - 1) * page_size).limit(page_size).all()

        invoices_data = []
        for invoice in invoices:
            line_items = db.query(LineItem).filter(LineItem.invoice_id == invoice.id).all()
            invoices_data.append({
                "id": invoice.id,
                "invoiceNumber": invoice.invoice_number,
                "vendorName": invoice.vendor_name,
                "vendorEmail": invoice.vendor_email,
                "customerName": invoice.customer_name,
                "poNumber": invoice.po_number,
                "invoiceDate": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                "amount": invoice.amount,
                "tax": invoice.tax,
                "totalAmount": invoice.total_amount,
                "status": invoice.status,
                "emailSubject": invoice.email_subject,
                "pdfUrl": invoice.pdf_url,
                "reviewedBy": invoice.reviewed_by,
                "reviewedAt": invoice.reviewed_at.isoformat() if invoice.reviewed_at else None,
                "createdAt": invoice.created_at.isoformat() if invoice.created_at else None,
                "lineItems": [
                    {
                        "id": item.id,
                        "description": item.description,
                        "quantity": item.quantity,
                        "unitPrice": item.unit_price,
                        "total": item.total_price
                    }
                    for item in line_items
                ]
            })

        return {
            "data": invoices_data,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching decision history: {str(e)}"
        )

@router.get("/invoices/{invoice_id}/file")
async def get_invoice_file(invoice_id: int, db: Session = Depends(get_db)):
    """Stream invoice file from Google Drive for in-app preview (optimized with caching)"""
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        # Get S3 URL from pdf_url or drive_file_id
        pdf_url = invoice.pdf_url

        if not pdf_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice file not available"
            )

        # If URL is an S3 URL, download from S3
        try:
            BUCKET = os.getenv("BUCKET_NAME", "tyn-claims-app-storage-prod")
            s3 = get_s3_client()

            if s3 and "s3." in pdf_url and BUCKET in pdf_url:
                # Extract S3 key from URL
                s3_key = pdf_url.split(f"{BUCKET}.s3.")[1].split("/", 1)[1] if f"{BUCKET}.s3." in pdf_url else None
                if s3_key:
                    response = s3.get_object(Bucket=BUCKET, Key=s3_key)
                    filename = s3_key.split("/")[-1]
                    return StreamingResponse(
                        response['Body'],
                        media_type=response.get('ContentType', 'application/pdf'),
                        headers={
                            "Content-Disposition": f'inline; filename="{filename}"',
                            "Cache-Control": "public, max-age=86400",
                        }
                    )

            # Fallback: redirect to the URL directly
            return RedirectResponse(url=pdf_url)
        except Exception as s3_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cannot access invoice file. Error: {str(s3_error)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching invoice file: {str(e)}"
        )

@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get a single invoice by ID"""
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        line_items = db.query(LineItem).filter(LineItem.invoice_id == invoice_id).all()
        
        return {
            "id": invoice.id,
            "invoiceNumber": invoice.invoice_number,
            "vendorName": invoice.vendor_name,
            "vendorEmail": invoice.vendor_email,
            "customerName": invoice.customer_name,
            "poNumber": invoice.po_number,
            "invoiceDate": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
            "amount": invoice.amount,
            "tax": invoice.tax,
            "totalAmount": invoice.total_amount,
            "status": invoice.status,
            "emailSubject": invoice.email_subject,
            "pdfUrl": invoice.pdf_url,
            "reviewedBy": invoice.reviewed_by,
            "reviewedAt": invoice.reviewed_at.isoformat() if invoice.reviewed_at else None,
            "createdAt": invoice.created_at.isoformat() if invoice.created_at else None,
            "lineItems": [
                {
                    "id": item.id,
                    "description": item.description,
                    "quantity": item.quantity,
                    "unitPrice": item.unit_price,
                    "total": item.total_price
                }
                for item in line_items
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching invoice: {str(e)}"
        )

@router.put("/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: int,
    update_data: InvoiceUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update invoice status"""
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        old_status = invoice.status
        invoice.status = update_data.status
        invoice.updated_at = datetime.now()
        
        # If status is accepted or rejected, capture review information
        if update_data.status in ["accepted", "rejected"]:
            invoice.reviewed_by = update_data.reviewed_by or "system"
            invoice.reviewed_at = datetime.now()
        
        # Create audit log
        audit_log = InvoiceAuditLog(
            invoice_id=invoice_id,
            action="status_updated",
            old_value={"status": old_status},
            new_value={"status": update_data.status},
            notes=update_data.notes
        )
        
        db.add(audit_log)
        db.commit()
        
        return {
            "success": True,
            "message": f"Invoice {invoice.invoice_number} status updated to {update_data.status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating invoice: {str(e)}"
        )

@router.put("/invoices/{invoice_id}/details")
async def update_invoice_details(
    invoice_id: int,
    update_data: InvoiceDetailsUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update invoice editable fields"""
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        if update_data.invoice_number is not None:
            invoice.invoice_number = update_data.invoice_number
        if update_data.vendor_name is not None:
            invoice.vendor_name = update_data.vendor_name
        if update_data.vendor_email is not None:
            invoice.vendor_email = update_data.vendor_email
        if update_data.customer_name is not None:
            invoice.customer_name = update_data.customer_name
        if update_data.po_number is not None:
            invoice.po_number = update_data.po_number
        if update_data.invoice_date is not None:
            invoice.invoice_date = update_data.invoice_date
        if update_data.amount is not None:
            invoice.amount = update_data.amount
        if update_data.tax is not None:
            invoice.tax = update_data.tax

        if update_data.line_items:
            for item_data in update_data.line_items:
                line_item = (
                    db.query(LineItem)
                    .filter(LineItem.id == item_data.id, LineItem.invoice_id == invoice_id)
                    .first()
                )

                if line_item:
                    line_item.unit_price = item_data.unit_price
                    line_item.total_price = (line_item.quantity or 0) * (item_data.unit_price or 0)

        invoice.total_amount = (invoice.amount or 0) + (invoice.tax or 0)
        invoice.updated_at = datetime.now()

        db.commit()

        return {
            "success": True,
            "message": f"Invoice {invoice.invoice_number} updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating invoice details: {str(e)}"
        )

@router.post("/ingestion/run")
async def run_email_ingestion(
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Trigger email ingestion and OCR processing (API Key Required)"""
    try:
        # Run ingestion in background
        background_tasks.add_task(process_emails_async)
        
        return {
            "success": True,
            "message": "Email ingestion started in background",
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )

@router.post("/ingestion/run-sync")
async def run_email_ingestion_sync(
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Trigger email ingestion synchronously (API Key Required)"""
    try:
        result = await process_emails_async()
        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ingestion failed: {result['error']}"
            )
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )

@router.get("/invoices/status/stats")
async def get_invoice_stats(db: Session = Depends(get_db)):
    """Get invoice statistics"""
    try:
        total = db.query(Invoice).count()
        pending = db.query(Invoice).filter(Invoice.status == "pending").count()
        in_review = db.query(Invoice).filter(Invoice.status == "in_review").count()
        accepted = db.query(Invoice).filter(Invoice.status == "accepted").count()
        rejected = db.query(Invoice).filter(Invoice.status == "rejected").count()
        
        total_amount = db.query(func.sum(Invoice.total_amount)).scalar() or 0
        
        return {
            "total": total,
            "pending": pending,
            "in_review": in_review,
            "accepted": accepted,
            "rejected": rejected,
            "total_amount": float(total_amount)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching stats: {str(e)}"
        )

@router.get("/ingestion-logs")
async def get_ingestion_logs(db: Session = Depends(get_db)):
    """Get email ingestion logs"""
    try:
        logs = db.query(EmailIngestionLog).order_by(EmailIngestionLog.created_at.desc()).limit(100).all()
        
        return {
            "data": [
                {
                    "id": log.id,
                    "emailSubject": log.email_subject,
                    "filename": log.filename,
                    "emailFrom": log.email_from,
                    "status": log.status,
                    "mailCategory": classify_mail_category(log.email_subject, log.status),
                    "driveLink": log.drive_link,
                    "errorMessage": log.error_message,
                    "createdAt": log.created_at.isoformat()
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching logs: {str(e)}"
        )

@router.post("/ingestion/trigger")
async def trigger_email_ingestion(
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Trigger email ingestion process from Gmail
    
    Requires: X-API-Key header with valid API key
    
    Returns:
    - Processed count
    - Total emails found
    - Status of each processed email
    """
    try:
        result = await process_emails_async()
        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Email ingestion failed: {result['error']}"
            )
        
        return {
            "success": True,
            "message": "Email ingestion completed",
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email ingestion failed: {str(e)}"
        )

@router.post("/ingestion/manual-upload")
async def manual_invoice_upload(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Upload invoice file manually and run OCR + Drive + DB + Excel logging flow."""
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )

        result = process_manual_invoice_upload(
            file_name=file.filename or "manual_upload",
            file_bytes=file_bytes,
            uploaded_by="admin"
        )

        return {
            "success": True,
            "message": "Manual invoice upload processed successfully",
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except ValueError as validation_error:
        status_code = status.HTTP_400_BAD_REQUEST
        if "duplicate invoice" in str(validation_error).lower():
            status_code = status.HTTP_409_CONFLICT

        log_ingestion(
            email_subject="Manual Upload",
            filename=file.filename or "manual_upload",
            email_from="admin",
            email_date=datetime.utcnow(),
            status="failed",
            error_message=str(validation_error)
        )
        raise HTTPException(
            status_code=status_code,
            detail=str(validation_error)
        )
    except Exception as e:
        log_ingestion(
            email_subject="Manual Upload",
            filename=file.filename or "manual_upload",
            email_from="admin",
            email_date=datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manual invoice upload failed: {str(e)}"
        )

