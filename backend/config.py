"""
Centralized configuration management for Invoice Hub backend
"""
import os
from urllib.parse import quote_plus
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

# ============= DATABASE =============
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "postgres")
    db_password = quote_plus(os.getenv("DB_PASSWORD", "postgres123"))
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "invoice")
    DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# ============= EMAIL =============
EMAIL_USER = os.getenv("EMAIL_USER", "invoice.project01@gmail.com")
EMAIL_PASS = os.getenv("EMAIL_PASS", "pend sdym nkzx hrzg")
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
PROCESSED_LABEL = os.getenv("PROCESSED_LABEL", "Processed_Invoices")

# ============= AWS TEXTRACT (OCR) =============
# Uses existing AWS credentials from environment

# ============= GOOGLE DRIVE =============
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1LoRbKdiCsO4UpC2ahXcjdS4O5Nz3-ua_")
CREDENTIALS_FILE = os.getenv("CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = "token.pickle"
SCOPES = ["https://www.googleapis.com/auth/drive"]

# ============= API SECURITY =============
API_KEY = os.getenv("API_KEY", "invoice-hub-secret-key-2024")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
NIFO_USERINFO_URL = os.getenv("NIFO_USERINFO_URL", "").strip()
NIFO_AUTO_PROVISION = os.getenv("NIFO_AUTO_PROVISION", "false").strip().lower() == "true"

# ============= CORS =============
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8080"
).split(",")

# ============= INVOICE DETECTION =============
INVOICE_TERMS = [
    "invoice", "bill", "payment", "receipt", "total", "due",
    "order", "statement", "quote", "estimate", "contract",
    "subscription", "purchase", "transaction", "amount", "inv"
]

ALLOWED_EXTENSIONS = ('.pdf', '.jpg', '.jpeg', '.png', '.webp', '.docx', '.doc', '.xlsx', '.csv')

# ============= EXCEL LOGGING =============
EXCEL_FILE = os.getenv("EXCEL_FILE", "Invoice_Log_Highlighted.xlsx")

# ============= LOGGING =============
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
