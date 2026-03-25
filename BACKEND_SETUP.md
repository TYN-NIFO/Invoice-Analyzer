# Invoice Hub - Backend Setup Guide

## Prerequisites
- Python 3.8+
- PostgreSQL database
- Node.js 16+ (for frontend)

## Backend Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb invoice_hub

# Update database credentials in backend/database.py
# Or use environment variables:
export DATABASE_URL="postgresql://username:password@localhost:5432/invoice_hub"
```

### 4. Initialize Database
```bash
cd backend
python create_tables.py
python hash_passwords.py  # Create initial users
```

### 5. Start Backend Server
```bash
cd backend
python main.py
```

Server will run on: http://localhost:8000

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Frontend will run on: http://localhost:5173

## Environment Variables

Create `.env` file in project root:
```
DATABASE_URL=postgresql://username:password@localhost:5432/invoice_hub
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
```

## Default Users

After running `hash_passwords.py`:
- **Admin**: username `admin`, password `admin123`
- **Reviewer**: username `reviewer`, password `reviewer123`

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
