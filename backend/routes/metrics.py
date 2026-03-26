from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Invoice, EmailIngestionLog
from datetime import datetime, timedelta

SECURITY_TERMS = [
    "security", "otp", "2fa", "mfa", "verification", "verify", "alert",
    "unauthorized", "suspicious", "password", "sign-in", "login", "fraud", "phishing"
]

def classify_non_invoice_mail(subject: str) -> str:
    subject_lower = (subject or "").lower()
    if any(term in subject_lower for term in SECURITY_TERMS):
        return "security"
    return "other"

router = APIRouter()

@router.get("/metrics/admin")
async def get_admin_metrics(db: Session = Depends(get_db)):
    try:
        email_logs_query = db.query(EmailIngestionLog).filter(
            ~EmailIngestionLog.email_subject.like("Manual Upload%")
        )

        invoice_emails = email_logs_query.filter(EmailIngestionLog.status == "success").count()
        skipped_logs = email_logs_query.filter(EmailIngestionLog.status == "skipped").all()
        security_emails = sum(1 for log in skipped_logs if classify_non_invoice_mail(log.email_subject) == "security")
        other_emails = sum(1 for log in skipped_logs if classify_non_invoice_mail(log.email_subject) == "other")
        non_invoice_emails = security_emails + other_emails
        total_emails = invoice_emails + non_invoice_emails

        pending = db.query(Invoice).filter(Invoice.status == "pending").count()
        in_review = db.query(Invoice).filter(Invoice.status == "in_review").count()

        return {
            "totalEmailsProcessed": total_emails,
            "invoiceEmailsDetected": invoice_emails,
            "nonInvoiceEmails": non_invoice_emails,
            "securityEmails": security_emails,
            "otherEmails": other_emails,
            "invoicesInReviewQueue": pending + in_review,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching admin metrics: {str(e)}"
        )

@router.get("/metrics/reviewer")
async def get_reviewer_metrics(db: Session = Depends(get_db)):
    try:
        pending = db.query(Invoice).filter(Invoice.status == "pending").count()
        in_review = db.query(Invoice).filter(Invoice.status == "in_review").count()
        accepted = db.query(Invoice).filter(Invoice.status == "accepted").count()
        rejected = db.query(Invoice).filter(Invoice.status == "rejected").count()

        today = datetime.utcnow().date()
        resolved_today = (
            db.query(Invoice)
            .filter(Invoice.status.in_(["accepted", "rejected"]))
            .filter(Invoice.updated_at >= datetime.combine(today, datetime.min.time()))
            .count()
        )

        return {
            "invoicesWaiting": pending + in_review,
            "acceptedInvoices": accepted,
            "rejectedInvoices": rejected,
            "resolvedToday": resolved_today,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching reviewer metrics: {str(e)}"
        )

@router.get("/metrics/trends")
async def get_processing_trends(period: str = "week", db: Session = Depends(get_db)):
    try:
        days = 7 if period == "week" else 30
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days - 1)

        labels = []
        invoices_counts = []
        emails_counts = []

        for i in range(days):
            day = start_date + timedelta(days=i)
            next_day = day + timedelta(days=1)
            labels.append(day.strftime("%a" if days == 7 else "%m-%d"))

            invoices_count = (
                db.query(Invoice)
                .filter(Invoice.created_at >= datetime.combine(day, datetime.min.time()))
                .filter(Invoice.created_at < datetime.combine(next_day, datetime.min.time()))
                .count()
            )

            emails_count = (
                db.query(EmailIngestionLog)
                .filter(EmailIngestionLog.created_at >= datetime.combine(day, datetime.min.time()))
                .filter(EmailIngestionLog.created_at < datetime.combine(next_day, datetime.min.time()))
                .count()
            )

            invoices_counts.append(invoices_count)
            emails_counts.append(emails_count)

        return {
            "labels": labels,
            "invoices": invoices_counts,
            "emails": emails_counts,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching trends: {str(e)}"
        )
