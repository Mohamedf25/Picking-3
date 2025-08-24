from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth

from database import get_db, engine
from models import User, SessionModel, Line, Photo, Event
from schemas import (
    UserLogin, Token, UserResponse, OrderResponse, SessionResponse,
    ScanRequest, PhotoResponse, FinishSessionRequest
)

load_dotenv()

app = FastAPI(title="Picking System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME")

WOOCOMMERCE_URL = os.getenv("WOOCOMMERCE_URL")
WOOCOMMERCE_CONSUMER_KEY = os.getenv("WOOCOMMERCE_CONSUMER_KEY")
WOOCOMMERCE_CONSUMER_SECRET = os.getenv("WOOCOMMERCE_CONSUMER_SECRET")

s3_client = boto3.client(
    's3',
    endpoint_url=f'http://{MINIO_ENDPOINT}',
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_woocommerce_orders():
    try:
        url = f"{WOOCOMMERCE_URL}/wp-json/wc/v3/orders"
        auth = HTTPBasicAuth(WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)
        params = {"status": "processing", "per_page": 100}
        response = requests.get(url, auth=auth, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return []

def update_woocommerce_order_status(order_id: int, status: str):
    try:
        url = f"{WOOCOMMERCE_URL}/wp-json/wc/v3/orders/{order_id}"
        auth = HTTPBasicAuth(WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)
        data = {"status": status}
        response = requests.put(url, auth=auth, json=data)
        response.raise_for_status()
        return True
    except Exception as e:
        return False

@app.on_event("startup")
async def startup_event():
    try:
        s3_client.create_bucket(Bucket=MINIO_BUCKET_NAME)
    except ClientError as e:
        if e.response['Error']['Code'] != 'BucketAlreadyOwnedByYou':
            print(f"Error creating bucket: {e}")

@app.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user or not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/orders", response_model=List[OrderResponse])
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = get_woocommerce_orders()
    return [
        OrderResponse(
            id=order["id"],
            number=order["number"],
            status=order["status"],
            total=order["total"],
            customer_name=f"{order['billing']['first_name']} {order['billing']['last_name']}",
            line_items=[
                {
                    "id": item["id"],
                    "name": item["name"],
                    "sku": item["sku"] or "",
                    "quantity": item["quantity"],
                    "product_id": item["product_id"]
                }
                for item in order["line_items"]
            ]
        )
        for order in orders
    ]

@app.get("/orders/{order_id}")
async def get_order_detail(order_id: int, current_user: User = Depends(get_current_user)):
    orders = get_woocommerce_orders()
    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        id=order["id"],
        number=order["number"],
        status=order["status"],
        total=order["total"],
        customer_name=f"{order['billing']['first_name']} {order['billing']['last_name']}",
        line_items=[
            {
                "id": item["id"],
                "name": item["name"],
                "sku": item["sku"] or "",
                "quantity": item["quantity"],
                "product_id": item["product_id"]
            }
            for item in order["line_items"]
        ]
    )

@app.post("/orders/{order_id}/start", response_model=SessionResponse)
async def start_picking_session(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_session = db.query(SessionModel).filter(
        SessionModel.order_id == order_id,
        SessionModel.status == "in_progress"
    ).first()
    
    if existing_session:
        raise HTTPException(status_code=400, detail="Session already in progress for this order")
    
    orders = get_woocommerce_orders()
    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    session = SessionModel(
        order_id=order_id,
        user_id=current_user.id,
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    for item in order["line_items"]:
        line = Line(
            session_id=session.id,
            product_id=item["product_id"],
            sku=item["sku"] or "",
            expected_qty=item["quantity"],
            picked_qty=0,
            status="pending"
        )
        db.add(line)
    
    db.commit()
    
    return SessionResponse(
        id=session.id,
        order_id=session.order_id,
        status=session.status,
        started_at=session.started_at
    )

@app.post("/sessions/{session_id}/scan")
async def register_scan(
    session_id: str,
    scan_request: ScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    line = db.query(Line).filter(
        Line.session_id == session_id,
        Line.sku == scan_request.sku
    ).first()
    
    if not line:
        raise HTTPException(status_code=404, detail="Product not found in this order")
    
    if line.picked_qty < line.expected_qty:
        line.picked_qty += 1
        if line.picked_qty == line.expected_qty:
            line.status = "completed"
        else:
            line.status = "in_progress"
        
        db.commit()
        
        event = Event(
            session_id=session_id,
            user_id=current_user.id,
            type="scan",
            payload={"sku": scan_request.sku, "quantity": line.picked_qty}
        )
        db.add(event)
        db.commit()
    
    return {"message": "Scan registered", "picked_qty": line.picked_qty, "expected_qty": line.expected_qty}

@app.post("/sessions/{session_id}/photo", response_model=PhotoResponse)
async def upload_photo(
    session_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    file_key = f"sessions/{session_id}/{file.filename}"
    
    try:
        s3_client.upload_fileobj(file.file, MINIO_BUCKET_NAME, file_key)
        photo_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{file_key}"
        
        photo = Photo(
            session_id=session_id,
            url=photo_url
        )
        db.add(photo)
        db.commit()
        db.refresh(photo)
        
        event = Event(
            session_id=session_id,
            user_id=current_user.id,
            type="photo",
            payload={"url": photo_url}
        )
        db.add(event)
        db.commit()
        
        return PhotoResponse(id=photo.id, url=photo.url, created_at=photo.created_at)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

@app.post("/sessions/{session_id}/finish")
async def finish_session(
    session_id: str,
    finish_request: FinishSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    lines = db.query(Line).filter(Line.session_id == session_id).all()
    photos = db.query(Photo).filter(Photo.session_id == session_id).all()
    
    if not photos:
        raise HTTPException(status_code=400, detail="At least one photo is required")
    
    all_completed = all(line.picked_qty == line.expected_qty for line in lines)
    if not all_completed:
        raise HTTPException(status_code=400, detail="Not all items have been picked")
    
    session.status = "finished"
    session.finished_at = datetime.utcnow()
    db.commit()
    
    if update_woocommerce_order_status(session.order_id, "completed"):
        event = Event(
            session_id=session_id,
            user_id=current_user.id,
            type="finish",
            payload={"order_status": "completed"}
        )
        db.add(event)
        db.commit()
    
    return {"message": "Session completed successfully"}

@app.get("/")
async def root():
    return {"message": "Picking System API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
