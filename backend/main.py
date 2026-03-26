from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from routes.auth import router as auth_router
from routes.invoices import router as invoices_router
from routes.logs import router as logs_router
from routes.metrics import router as metrics_router
from routes.users import router as users_router
from database import engine, Base
from config import ALLOWED_ORIGINS
from services.email_ingestion import connect_and_fetch
import uvicorn
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()

def safe_email_ingestion():
    """Wrapper to safely run email ingestion with error handling"""
    try:
        logger.info("[*] Running scheduled email ingestion...")
        result = connect_and_fetch()
        logger.info(f"[OK] Email ingestion complete: {result}")
    except Exception as e:
        logger.error(f"[ERROR] Email ingestion failed: {str(e)}")

app = FastAPI(
    title="Invoice Hub API",
    description="Professional invoice management and processing system",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    try:
        logger.info("[*] Starting Email Ingestion Scheduler...")
        scheduler.add_job(
            safe_email_ingestion,
            "interval",
            minutes=5,
            id="email_ingestion",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        if not scheduler.running:
            scheduler.start()
        logger.info("[OK] Scheduler running - Email ingestion every 5 minutes")
    except Exception as e:
        logger.error(f"[ERROR] Failed to start scheduler: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router)
app.include_router(invoices_router)
app.include_router(logs_router)
app.include_router(metrics_router)
app.include_router(users_router)

@app.get("/")
def read_root():
    return {"message": "Invoice Hub Backend API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
