from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import SystemLog
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class LogCreateSchema(BaseModel):
    username: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None

@router.get("/logs")
async def get_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(SystemLog)

        if action:
            query = query.filter(SystemLog.action == action)
        if username:
            query = query.filter(SystemLog.username == username)

        total = query.count()
        total_pages = (total + page_size - 1) // page_size

        logs = (
            query.order_by(SystemLog.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return {
            "data": [
                {
                    "id": log.id,
                    "username": log.username,
                    "action": log.action,
                    "details": log.details,
                    "timestamp": log.created_at.isoformat(),
                    "ipAddress": log.ip_address,
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching logs: {str(e)}"
        )

@router.get("/logs/recent")
async def get_recent_logs(limit: int = 5, db: Session = Depends(get_db)):
    try:
        logs = (
            db.query(SystemLog)
            .order_by(SystemLog.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": log.id,
                "username": log.username,
                "action": log.action,
                "details": log.details,
                "timestamp": log.created_at.isoformat(),
                "ipAddress": log.ip_address,
            }
            for log in logs
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching recent logs: {str(e)}"
        )

@router.post("/logs", response_model=dict)
async def create_log(
    log_data: LogCreateSchema,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        ip_address = log_data.ip_address or (request.client.host if request.client else None)
        log = SystemLog(
            username=log_data.username,
            action=log_data.action,
            details=log_data.details,
            ip_address=ip_address,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "success": True,
            "id": log.id,
            "message": "Log created successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating log: {str(e)}"
        )
