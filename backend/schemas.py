from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32, pattern=r'^[A-Za-z0-9._-]+$')
    password: str = Field(min_length=6)
    role: str = "picker"

class WarehouseResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    address: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    role: str
    warehouse_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LineItem(BaseModel):
    id: int
    name: str
    sku: Optional[str] = None
    ean: Optional[str] = None
    gtin: Optional[str] = None
    upc: Optional[str] = None
    quantity: int
    product_id: int
    image_url: Optional[str] = None

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
    warehouse_id: Optional[uuid.UUID] = None
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    code: str
    ean: Optional[str] = None
    gtin: Optional[str] = None
    upc: Optional[str] = None
    sku: Optional[str] = None

class PhotoResponse(BaseModel):
    id: uuid.UUID
    url: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FinishSessionRequest(BaseModel):
    notes: Optional[str] = None

class PickerMetrics(BaseModel):
    picker_username: str
    picker_role: str
    completed_orders: int
    avg_picking_time_minutes: float
    total_items_picked: int

class ProductMetrics(BaseModel):
    ean: str
    product_name: str
    error_count: int
    total_picked: int
    error_rate: float

class WarehouseCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None

class MetricsResponse(BaseModel):
    total_completed_orders: int
    total_active_sessions: int
    avg_picking_time_minutes: float
    picker_metrics: List[PickerMetrics]
    top_error_products: List[ProductMetrics]
    incidents_count: int

class CreateExceptionRequest(BaseModel):
    reason: str

class ExceptionResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    picker_id: uuid.UUID
    supervisor_id: Optional[uuid.UUID] = None
    reason: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ApproveExceptionRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None
