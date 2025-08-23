# 📦 Sistema de Recogepedidos para WooCommerce

## 🔹 Descripción
Sistema **separado de WordPress** que permite a pickers preparar pedidos de WooCommerce de forma rápida y segura.  
Incluye **frontend en React**, **backend en FastAPI**, **base de datos PostgreSQL**, **almacenamiento de fotos en MinIO (S3)** y **sincronización con WooCommerce vía API REST**.

---

## 🚀 Tecnologías
- **Frontend:** React + Material UI (mobile-first, PDA friendly).  
- **Backend:** FastAPI (Python 3.11).  
- **DB:** PostgreSQL 15.  
- **Storage:** MinIO (S3-compatible).  
- **Infraestructura:** Docker Compose.  
- **Proxy:** Nginx reverse proxy.  
- **WooCommerce Integration:** REST API (Consumer Key / Secret).  

---

## 🔹 Funcionalidades MVP
1. **Login de usuarios** (roles: picker, supervisor, admin).  
2. **Lista de pedidos** → pedidos en WooCommerce con estado `processing`.  
3. **Detalle del pedido** → productos, cantidades, SKU, imagen.  
4. **Sesión de picking:**  
   - Crear sesión al abrir un pedido.  
   - Escaneo de SKU/EAN/UPC/QR.  
   - Actualización automática de cantidades recogidas.  
   - Registro de eventos en DB.  
5. **PhotoProof:** al menos **1 foto obligatoria** por pedido.  
6. **Finalizar pedido:** si está completo → cambia a `completed` en WooCommerce.  

---

## 🔹 Modelo de datos
### Tabla `users`
- id (uuid), email, password_hash, role (picker/supervisor/admin)

### Tabla `sessions`
- id, order_id (Woo), user_id, status (in_progress/finished), started_at, finished_at

### Tabla `lines`
- id, session_id, product_id, sku, expected_qty, picked_qty, status

### Tabla `photos`
- id, session_id, line_id?, url, created_at

### Tabla `events`
- id, session_id, user_id, type (scan/photo/finish/error), payload (json), created_at

---

## 🔹 Endpoints API (FastAPI)
- `POST /auth/login` → login con JWT.  
- `GET /orders` → lista de pedidos (status=processing).  
- `GET /orders/{id}` → detalle del pedido.  
- `POST /orders/{id}/start` → crear sesión de picking.  
- `POST /sessions/{sid}/scan` → registrar escaneo.  
- `POST /sessions/{sid}/photo` → subir foto (S3).  
- `POST /sessions/{sid}/finish` → validar → marcar en WooCommerce como `completed`.  

---

## 🔹 Infraestructura (Docker Compose)

Servicios:
- **api** → FastAPI backend.  
- **web** → React frontend.  
- **db** → PostgreSQL.  
- **minio** → almacenamiento de fotos.  
- **nginx** → reverse proxy.  

Ejemplo de `docker-compose.yml`:

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      - db
      - minio

  web:
    build: ./frontend
    ports:
      - "3000:80"

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: picking
      POSTGRES_USER: picking
      POSTGRES_PASSWORD: change_me
    volumes:
      - dbdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: change_me
    ports:
      - "9000:9000"
    volumes:
      - minio:/data

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - api
      - web

volumes:
  dbdata:
  minio:
