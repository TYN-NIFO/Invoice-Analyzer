from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from config import API_KEY

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key from request header"""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key required. Include 'X-API-Key' header."
        )
    
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return api_key

def verify_optional_api_key(api_key: str = Security(api_key_header)):
    """Verify API key - optional but if provided must be valid"""
    if api_key and api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return api_key
