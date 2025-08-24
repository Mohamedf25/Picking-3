from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    
    class Config:
        from_attributes = True

class LineItem(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    product_id: int

class OrderResponse(BaseModel):
    id: int
    number: str
    status: str
    total: str
    customer_name: str
    line_items: List[LineItem]

class SessionResponse(BaseModel):
    id: uuid.UUID
    order_id: int
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    sku: str

class PhotoResponse(BaseModel):
    id: uuid.UUID
    url: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FinishSessionRequest(BaseModel):
    notes: Optional[str] = None
