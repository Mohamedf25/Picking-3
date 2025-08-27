from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
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

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

if os.path.exists("/app/frontend/dist"):
    SQLITE_DATABASE_URL = "sqlite:///./picking.db"
    engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
else:
    try:
        from database import get_db, engine
    except Exception:
        SQLITE_DATABASE_URL = "sqlite:///./picking.db"
        engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        def get_db():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
from models import User, SessionModel, Line, Photo, Event, Exception, Warehouse, SystemConfig
from schemas import (
    UserLogin, UserRegister, Token, UserResponse, OrderResponse, SessionResponse,
    ScanRequest, PhotoResponse, FinishSessionRequest, MetricsResponse,
    PickerMetrics, ProductMetrics, CreateExceptionRequest, ExceptionResponse,
    ApproveExceptionRequest, WarehouseResponse, WarehouseCreate
)

load_dotenv()

app = FastAPI(title="Picking System API", version="1.0.0")

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/health/detailed")
def detailed_health(db: Session = Depends(get_db)):
    """Detailed health check including database and admin user"""
    try:
        db.execute(text("SELECT 1"))
        
        admin_user = db.query(User).filter(User.username == "admin").first()
        admin_exists = admin_user is not None
        
        return {
            "database": "ok",
            "admin_user_exists": admin_exists,
            "admin_user_role": admin_user.role if admin_user else None,
            "timestamp": "2025-08-25T05:18:00Z"
        }
    except Exception as e:
        return {
            "database": "error",
            "admin_user_exists": False,
            "error": str(e),
            "timestamp": "2025-08-25T05:18:00Z"
        }

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
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

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
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
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

def get_woocommerce_product_details(product_id: int):
    try:
        url = f"{WOOCOMMERCE_URL}/wp-json/wc/v3/products/{product_id}"
        auth = HTTPBasicAuth(WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)
        response = requests.get(url, auth=auth)
        response.raise_for_status()
        product = response.json()
        
        image_url = None
        if product.get('images') and len(product['images']) > 0:
            image_url = product['images'][0].get('src')
        
        return {
            'id': product.get('id'),
            'name': product.get('name'),
            'sku': product.get('sku'),
            'image_url': image_url
        }
    except Exception as e:
        print(f"Error fetching WooCommerce product {product_id}: {e}")
        return None

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
    print("⚠️ MinIO initialization skipped (standalone mode)")
    
    try:
        from init_admin import ensure_admin_user
        if ensure_admin_user():
            print("✅ Admin user verification completed")
        else:
            print("❌ Admin user verification failed")
    except ImportError:
        print("⚠️ Admin initialization module not found")
    except BaseException as e:
        print(f"❌ Error during admin user initialization: {e}")

@app.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    print(f"🔐 Login attempt for username: {user_login.username}")
    
    user = db.query(User).filter(User.username == user_login.username).first()
    if not user:
        print(f"❌ User not found: {user_login.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ User found: {user.username}, role: {user.role}")
    
    password_valid = verify_password(user_login.password, user.password_hash)
    print(f"🔑 Password verification: {'✅ Valid' if password_valid else '❌ Invalid'}")
    
    if not password_valid:
        print(f"❌ Password verification failed for: {user_login.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    print(f"✅ Login successful for: {user.username}")
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            warehouse_id=user.warehouse_id,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    }

@app.post("/auth/register")
async def register(user_register: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_register.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user_register.password)
    new_user = User(
        username=user_register.username,
        password_hash=hashed_password,
        role=user_register.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "username": new_user.username}

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
                    "ean": item["sku"] or "",
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
    
    line_items_with_images = []
    for item in order["line_items"]:
        product_details = get_woocommerce_product_details(item["product_id"])
        line_items_with_images.append({
            "id": item["id"],
            "name": item["name"],
            "ean": item["sku"] or "",
            "quantity": item["quantity"],
            "product_id": item["product_id"],
            "image_url": product_details.get('image_url') if product_details else None
        })
    
    return OrderResponse(
        id=order["id"],
        number=order["number"],
        status=order["status"],
        total=order["total"],
        customer_name=f"{order['billing']['first_name']} {order['billing']['last_name']}",
        line_items=line_items_with_images
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
        product_details = get_woocommerce_product_details(item["product_id"])
        line = Line(
            session_id=session.id,
            product_id=item["product_id"],
            ean=item["sku"] or "",
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
        Line.ean == scan_request.ean
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
            payload={"ean": scan_request.ean, "picked_qty": line.picked_qty}
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

@app.get("/orders/{order_id}/qr-label")
async def generate_qr_label(order_id: int, current_user: User = Depends(get_current_user)):
    """Generate QR label data for a completed order"""
    try:
        orders = get_woocommerce_orders()
        order = next((o for o in orders if o["id"] == order_id), None)
        if not order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        customer_name = f"{order.get('billing', {}).get('first_name', '')} {order.get('billing', {}).get('last_name', '')}".strip()
        if not customer_name:
            customer_name = "Cliente desconocido"
        
        qr_data = {
            "order_id": order_id,
            "order_number": order.get('number', str(order_id)),
            "customer_name": customer_name,
            "total": order.get('total', '0.00'),
            "woocommerce_url": f"https://productosmagnate.com/pa/wp-admin/post.php?post={order_id}&action=edit",
            "date_completed": datetime.utcnow().isoformat()
        }
        
        return qr_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando etiqueta QR: {str(e)}")

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Access denied. Admin or supervisor role required.")
    
    total_completed = db.query(SessionModel).filter(SessionModel.status == "finished").count()
    
    total_active = db.query(SessionModel).filter(SessionModel.status == "in_progress").count()
    
    completed_sessions = db.query(SessionModel).filter(
        SessionModel.status == "finished",
        SessionModel.finished_at.isnot(None)
    ).all()
    
    avg_picking_time = 0.0
    if completed_sessions:
        total_time = sum([
            (session.finished_at - session.started_at).total_seconds() / 60
            for session in completed_sessions
        ])
        avg_picking_time = total_time / len(completed_sessions)
    
    picker_stats = db.query(
        User.username,
        User.role,
        func.count(SessionModel.id).label('completed_orders'),
        func.sum(Line.picked_qty).label('total_items')
    ).join(SessionModel, User.id == SessionModel.user_id)\
     .join(Line, SessionModel.id == Line.session_id)\
     .filter(SessionModel.status == "finished")\
     .group_by(User.id, User.username, User.role).all()
    
    picker_metrics = []
    for stat in picker_stats:
        picker_sessions = db.query(SessionModel).filter(
            SessionModel.user_id == db.query(User.id).filter(User.username == stat.username).scalar(),
            SessionModel.status == "finished",
            SessionModel.finished_at.isnot(None)
        ).all()
        
        picker_avg_time = 0.0
        if picker_sessions:
            picker_total_time = sum([
                (session.finished_at - session.started_at).total_seconds() / 60
                for session in picker_sessions
            ])
            picker_avg_time = picker_total_time / len(picker_sessions)
        
        picker_metrics.append(PickerMetrics(
            picker_username=stat.username,
            picker_role=stat.role,
            completed_orders=stat.completed_orders,
            avg_picking_time_minutes=round(picker_avg_time, 2),
            total_items_picked=stat.total_items or 0
        ))
    
    error_products = db.query(
        Line.ean,
        func.count(Line.id).label('error_count'),
        func.sum(Line.expected_qty).label('total_expected'),
        func.sum(Line.picked_qty).label('total_picked')
    ).filter(Line.picked_qty != Line.expected_qty)\
     .group_by(Line.ean)\
     .order_by(desc('error_count'))\
     .limit(10).all()
    
    product_metrics = []
    for product in error_products:
        total_lines = db.query(func.count(Line.id)).filter(Line.ean == product.ean).scalar()
        error_rate = (product.error_count / total_lines * 100) if total_lines > 0 else 0
        
        product_metrics.append(ProductMetrics(
            ean=product.ean,
            product_name=f"Producto {product.ean}",
            error_count=product.error_count,
            total_picked=product.total_picked or 0,
            error_rate=round(error_rate, 2)
        ))
    
    incidents = db.query(SessionModel).join(Line)\
                  .filter(SessionModel.status == "finished")\
                  .filter(Line.picked_qty < Line.expected_qty)\
                  .distinct().count()
    
    return MetricsResponse(
        total_completed_orders=total_completed,
        total_active_sessions=total_active,
        avg_picking_time_minutes=round(avg_picking_time, 2),
        picker_metrics=picker_metrics,
        top_error_products=product_metrics,
        incidents_count=incidents
    )

@app.post("/sessions/{session_id}/exception", response_model=ExceptionResponse)
async def create_exception(
    session_id: str,
    exception_request: CreateExceptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create exceptions for your own sessions")
    
    existing_exception = db.query(Exception).filter(
        Exception.session_id == session_id,
        Exception.status == "pending"
    ).first()
    
    if existing_exception:
        raise HTTPException(status_code=400, detail="There is already a pending exception for this session")
    
    exception = Exception(
        session_id=session_id,
        picker_id=current_user.id,
        reason=exception_request.reason,
        status="pending"
    )
    db.add(exception)
    db.commit()
    db.refresh(exception)
    
    event = Event(
        session_id=session_id,
        user_id=current_user.id,
        type="exception_created",
        payload={"reason": exception_request.reason}
    )
    db.add(event)
    db.commit()
    
    return ExceptionResponse(
        id=exception.id,
        session_id=exception.session_id,
        picker_id=exception.picker_id,
        supervisor_id=exception.supervisor_id,
        reason=exception.reason,
        status=exception.status,
        created_at=exception.created_at,
        resolved_at=exception.resolved_at
    )

@app.get("/exceptions", response_model=List[ExceptionResponse])
async def get_pending_exceptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Access denied. Admin or supervisor role required.")
    
    exceptions = db.query(Exception).filter(Exception.status == "pending").all()
    
    return [
        ExceptionResponse(
            id=exception.id,
            session_id=exception.session_id,
            picker_id=exception.picker_id,
            supervisor_id=exception.supervisor_id,
            reason=exception.reason,
            status=exception.status,
            created_at=exception.created_at,
            resolved_at=exception.resolved_at
        )
        for exception in exceptions
    ]

@app.post("/exceptions/{exception_id}/approve")
async def approve_exception(
    exception_id: str,
    approve_request: ApproveExceptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Access denied. Admin or supervisor role required.")
    
    exception = db.query(Exception).filter(Exception.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    if exception.status != "pending":
        raise HTTPException(status_code=400, detail="Exception has already been resolved")
    
    exception.status = "approved" if approve_request.approved else "rejected"
    exception.supervisor_id = current_user.id
    exception.resolved_at = datetime.utcnow()
    
    session = db.query(SessionModel).filter(SessionModel.id == exception.session_id).first()
    
    if approve_request.approved and session:
        session.status = "finished"
        session.finished_at = datetime.utcnow()
        
        if update_woocommerce_order_status(session.order_id, "completed"):
            event = Event(
                session_id=exception.session_id,
                user_id=current_user.id,
                type="exception_approved",
                payload={
                    "exception_id": str(exception.id),
                    "approved": True,
                    "notes": approve_request.notes,
                    "order_status": "completed"
                }
            )
        else:
            event = Event(
                session_id=exception.session_id,
                user_id=current_user.id,
                type="exception_approved",
                payload={
                    "exception_id": str(exception.id),
                    "approved": True,
                    "notes": approve_request.notes
                }
            )
    else:
        event = Event(
            session_id=exception.session_id,
            user_id=current_user.id,
            type="exception_rejected",
            payload={
                "exception_id": str(exception.id),
                "approved": False,
                "notes": approve_request.notes
            }
        )
    
    db.add(event)
    db.commit()
    
    return {"message": f"Exception {'approved' if approve_request.approved else 'rejected'} successfully"}

@app.get("/sessions/{session_id}/lines")
async def get_session_lines(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != current_user.id and current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    lines = db.query(Line).filter(Line.session_id == session_id).all()
    
    lines_with_details = []
    for line in lines:
        product_details = get_woocommerce_product_details(line.product_id)
        lines_with_details.append({
            "id": str(line.id),
            "product_id": line.product_id,
            "ean": line.ean,
            "expected_qty": line.expected_qty,
            "picked_qty": line.picked_qty,
            "status": line.status,
            "product_name": product_details.get('name') if product_details else f"Producto {line.ean}",
            "image_url": product_details.get('image_url') if product_details else None
        })
    
    return lines_with_details

@app.get("/admin/config")
async def get_system_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = db.query(SystemConfig).all()
    config_dict = {}
    for item in config:
        import json
        try:
            config_dict[item.config_key] = json.loads(item.config_value)
        except:
            config_dict[item.config_key] = item.config_value
    
    return config_dict

@app.put("/admin/config")
async def update_system_config(
    config: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    import json
    for key, value in config.items():
        config_item = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
        if config_item:
            config_item.config_value = json.dumps(value)
        else:
            new_config = SystemConfig(config_key=key, config_value=json.dumps(value))
            db.add(new_config)
    
    db.commit()
    return {"message": "Configuration updated successfully", "config": config}

@app.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    return [
        {
            "id": str(user.id),
            "username": user.username,
            "role": user.role,
            "warehouse_id": str(user.warehouse_id) if user.warehouse_id else None,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat()
        }
        for user in users
    ]

@app.post("/admin/users")
async def create_user(
    user_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing_user = db.query(User).filter(User.username == user_data["username"]).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user_data["password"])
    
    warehouse_id = None
    if user_data.get("warehouse_id"):
        try:
            import uuid
            warehouse_id = uuid.UUID(user_data["warehouse_id"])
        except ValueError:
            pass
    
    new_user = User(
        email=user_data["email"],
        password_hash=hashed_password,
        role=user_data["role"],
        warehouse_id=warehouse_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": str(new_user.id),
        "username": new_user.username,
        "role": new_user.role,
        "warehouse_id": str(new_user.warehouse_id) if new_user.warehouse_id else None
    }

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "username" in user_data:
        user.username = user_data["username"]
    if "role" in user_data:
        user.role = user_data["role"]
    if "warehouse_id" in user_data:
        warehouse_id = None
        if user_data["warehouse_id"]:
            try:
                import uuid
                warehouse_id = uuid.UUID(user_data["warehouse_id"])
            except ValueError:
                pass
        user.warehouse_id = warehouse_id
    if "password" in user_data and user_data["password"]:
        user.password_hash = get_password_hash(user_data["password"])
    
    db.commit()
    
    return {"message": "User updated successfully"}

@app.delete("/admin/users/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deactivated successfully"}

@app.get("/admin/audit/sessions")
async def get_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    sessions = db.query(SessionModel).all()
    return [
        {
            "id": str(session.id),
            "order_id": session.order_id,
            "user_id": str(session.user_id),
            "status": session.status,
            "started_at": session.started_at.isoformat(),
            "finished_at": session.finished_at.isoformat() if session.finished_at else None,
            "warehouse_id": str(session.warehouse_id) if session.warehouse_id else None
        }
        for session in sessions
    ]

@app.get("/admin/audit/orders")
async def get_all_orders_audit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = get_woocommerce_orders()
    sessions = db.query(SessionModel).all()
    
    orders_with_sessions = []
    for order in orders:
        order_sessions = [s for s in sessions if s.order_id == order["id"]]
        orders_with_sessions.append({
            "order_id": order["id"],
            "order_number": order["number"],
            "status": order["status"],
            "total": order["total"],
            "customer_name": f"{order['billing']['first_name']} {order['billing']['last_name']}",
            "sessions": [
                {
                    "id": str(s.id),
                    "user_id": str(s.user_id),
                    "status": s.status,
                    "started_at": s.started_at.isoformat(),
                    "finished_at": s.finished_at.isoformat() if s.finished_at else None
                }
                for s in order_sessions
            ]
        })
    
    return orders_with_sessions

from fastapi import APIRouter

api_router = APIRouter(prefix="/api")

@api_router.post("/auth/login")
async def login_api(user_login: UserLogin, db: Session = Depends(get_db)):
    return await login(user_login, db)

@api_router.post("/auth/register") 
async def register_api(user_register: UserRegister, db: Session = Depends(get_db)):
    return await register(user_register, db)

@api_router.get("/orders")
async def get_orders_api(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await get_orders(current_user, db)

@api_router.get("/orders/{order_id}")
async def get_order_detail_api(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await get_order_detail(order_id, current_user, db)

@api_router.post("/orders/{order_id}/start")
async def start_picking_session_api(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await start_picking_session(order_id, current_user, db)

@api_router.get("/health")
async def health_api():
    return health()

@api_router.get("/health/detailed")
async def detailed_health_api(db: Session = Depends(get_db)):
    return detailed_health(db)

app.include_router(api_router)

@app.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    warehouses = db.query(Warehouse).all()
    return warehouses

@app.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(
    warehouse_data: WarehouseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear almacenes")
    
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de almacén ya existe")
    
    warehouse = Warehouse(
        name=warehouse_data.name,
        code=warehouse_data.code,
        address=warehouse_data.address
    )
    
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    
    return warehouse

@app.post("/admin/create-emergency-admin")
async def create_emergency_admin(db: Session = Depends(get_db)):
    try:
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            return {"message": "Admin user already exists", "status": "exists"}
        
        hashed_password = get_password_hash("admin123")
        admin_user = User(
            username="admin",
            password_hash=hashed_password,
            role="admin",
            warehouse_id="660e8400-e29b-41d4-a716-446655440000"
        )
        
        db.add(admin_user)
        db.commit()
        
        print("🚨 Emergency admin user created")
        return {"message": "Emergency admin user created successfully", "status": "created"}
        
    except Exception as e:
        print(f"❌ Error creating emergency admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating admin user: {str(e)}")

@app.put("/users/{user_id}/warehouse")
async def assign_user_warehouse(
    user_id: str,
    warehouse_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden asignar almacenes")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    
    user.warehouse_id = warehouse_id
    db.commit()
    
    return {"message": "Usuario asignado al almacén correctamente"}

if os.path.exists("/app/frontend/dist"):
    if os.path.exists("/app/frontend/dist/assets"):
        app.mount("/assets", StaticFiles(directory="/app/frontend/dist/assets"), name="assets")
    app.mount("/", StaticFiles(directory="/app/frontend/dist", html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
