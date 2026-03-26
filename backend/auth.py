import os
from functools import lru_cache
from fastapi import HTTPException, status, Header, Request
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY", "invoice-hub-secret-key-2024")

@lru_cache(maxsize=1)
def get_api_key():
    return API_KEY

async def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key from request header"""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key in header (x-api-key)"
        )
    
    if x_api_key != get_api_key():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    return x_api_key
