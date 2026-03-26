# Invoice Hub - Quick Start Guide

> Canonical startup/run documentation: keep this file as the single source of truth.

This guide shows you how to start the entire application (backend + frontend + email ingestion) in different ways.

## ✨ Quick Start (Recommended)

### Option 1: Using npm (All in one command)
```bash
npm run start:all
```
This starts both backend and frontend servers in the same terminal window with logs from both.

### Option 2: Using PowerShell Script (Windows - Opens separate windows)
Run: **`start-servers.ps1`**

This opens two separate command windows:
- Backend on port 8000
- Frontend on port 8080

## 🔧 After Servers Start

### Option A: Trigger Email Ingestion Manually
Once both servers are running, open a new terminal and run:
```bash
python trigger_ingestion.py
```

This will:
1. Connect to Gmail inbox
2. Find unread invoice emails
3. Process each invoice with OCR
4. Save to database
5. Upload files to Google Drive

### Option B: Trigger via API
```bash
curl -X POST http://localhost:8000/ingestion/trigger \
  -H "X-API-Key: test-api-key"
```

### Option C: Trigger from Frontend
In the application, go to Admin Dashboard → System Logs and you'll see a button to manually trigger ingestion.

## 📱 Access the Application

Once running, open your browser:
- **Frontend:** http://localhost:8080
- **Backend API Docs:** http://localhost:8000/docs
- **Database:** PostgreSQL (Neon via `DATABASE_URL`)

## 🛑 Stopping the Application

### If using `npm run start:all`:
Press **Ctrl+C** in the terminal to stop both servers.

### If using `start-servers.ps1`:
Press **Ctrl+C** in each command window, or close the windows.

## 🔐 Default Login Credentials

```
Username: reviewer
Password: test123
```

## 🗂️ File Structure

```
invoice-hub/
├── frontend/              # React + Vite frontend
├── backend/               # FastAPI backend
├── start-servers.ps1     # PowerShell script to start servers
├── trigger_ingestion.py  # Python script to manually trigger email ingestion
└── package.json          # npm scripts
```

## 📋 Available Commands

```bash
# Start both servers
npm run start:all

# Start only backend
npm run start:backend

# Start only frontend
npm run start:frontend

# Trigger email ingestion
python trigger_ingestion.py

# Build for production
npm run build
```

## 🔄 Email Ingestion Workflow

1. **Trigger**: Use `python trigger_ingestion.py` or API endpoint
2. **Connect**: Application connects to Gmail via IMAP
3. **Check**: Looks for unread emails with invoice keywords
4. **Process**: Uses Mindee OCR to extract invoice data
5. **Upload**: Saves invoice files to Google Drive
6. **Save**: Stores invoice data in PostgreSQL database
7. **Ready**: Invoices appear in Review Queue

## ⚙️ Configuration

Key environment variables are in `.env` file:
- `DATABASE_URL` - Neon/PostgreSQL connection string (primary)
- `EMAIL_USER` - Gmail account
- `EMAIL_PASS` - Gmail app password
- `DB_HOST` - PostgreSQL host (fallback only if `DATABASE_URL` is not set)
- `MINDEE_V2_API_KEY` - Mindee OCR API key
- `GOOGLE_DRIVE_FOLDER_ID` - Drive folder for uploads

## 🐛 Troubleshooting

**Backend not starting:**
- Check if port 8000 is already in use: `netstat -ano | findstr :8000`
- Ensure Python is installed: `python --version`

**Frontend not starting:**
- Check if port 8080 is already in use
- Ensure Node.js is installed: `node --version`

**Email ingestion failing:**
- Check `.env` file for valid Gmail credentials
- Ensure 2-step verification is enabled and app password is set
- Check Mindee API key is valid

**Database connection error:**
- Ensure `DATABASE_URL` is valid for Neon
- If not using `DATABASE_URL`, check `DB_*` fallback credentials in `.env`
- Run: `python backend/create_tables.py` to initialize tables

## 📚 Documentation

- **Backend API**: http://localhost:8000/docs (when running)
- **Frontend Source**: `/frontend/` directory
- **Backend Source**: `/backend/` directory
