# Guía de Despliegue en VPS

Esta guía te ayudará a desplegar el Sistema de Picking WooCommerce en tu VPS.

## Requisitos Previos

- VPS con Ubuntu 20.04+ o similar
- Acceso root o sudo
- Dominio o IP pública
- Credenciales de WooCommerce API

## 1. Preparar el VPS

### Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Docker
```bash
# Instalar dependencias
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Agregar clave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Agregar repositorio de Docker
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Instalar Docker
sudo apt update
sudo apt install docker-ce -y

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
```

### Instalar Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Verificar instalación
```bash
docker --version
docker-compose --version
```

## 2. Clonar el Repositorio

```bash
# Clonar el proyecto
git clone https://github.com/Mohamedf25/Picking-3.git
cd Picking-3
```

## 3. Configurar Variables de Entorno

### Backend (.env)
```bash
# Editar archivo de configuración del backend
nano backend/.env
```

Contenido del archivo `backend/.env`:
```env
# Base de datos
DATABASE_URL=postgresql://picking:change_me@db:5432/picking

# JWT
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=picking-photos

# WooCommerce (REEMPLAZAR CON TUS DATOS)
WOOCOMMERCE_URL=https://productosmagnate.com/pa
WOOCOMMERCE_CONSUMER_KEY=ck_5fbcb17af51d6297844a6a53dd180029a40ccd2c
WOOCOMMERCE_CONSUMER_SECRET=cs_14874e117d38808476ed7c074c293c9cfb98c343
```

### Frontend (.env)
```bash
# Editar archivo de configuración del frontend
nano frontend/.env
```

Contenido del archivo `frontend/.env`:
```env
# Cambiar por tu dominio o IP
VITE_API_URL=http://tu-dominio.com:8000
# O si usas IP: VITE_API_URL=http://123.456.789.123:8000
```

## 4. Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw enable
```

## 5. Desplegar el Sistema

```bash
# Construir y ejecutar contenedores
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

Deberías ver 5 servicios corriendo:
- `picking-3-nginx-1`
- `picking-3-frontend-1`
- `picking-3-api-1`
- `picking-3-db-1`
- `picking-3-minio-1`

## 6. Verificar Funcionamiento

### Verificar backend
```bash
curl http://localhost:8000/health
```

### Verificar frontend
Abrir en navegador: `http://tu-dominio.com:3000`

### Credenciales de prueba
- **Email:** admin@picking.com
- **Contraseña:** admin123

## 7. Configuración de Producción (Opcional)

### Usar Nginx como proxy reverso
```bash
# Instalar Nginx en el host
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/picking
```

Contenido de la configuración:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/picking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL con Let's Encrypt (Recomendado)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com
```

## 8. Mantenimiento

### Ver logs
```bash
# Logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs api
docker-compose logs frontend
```

### Reiniciar servicios
```bash
# Reiniciar todos los servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart api
```

### Actualizar el sistema
```bash
# Obtener últimos cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose up -d --build
```

### Backup de base de datos
```bash
# Crear backup
docker-compose exec db pg_dump -U picking picking > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db psql -U picking picking < backup_20231201.sql
```

## 9. Solución de Problemas

### Si el frontend no carga
1. Verificar que `VITE_API_URL` en `frontend/.env` apunte a tu dominio/IP
2. Reconstruir frontend: `docker-compose up -d --build frontend`

### Si hay errores de autenticación
1. Verificar logs: `docker-compose logs api`
2. Recrear usuario admin: `docker-compose exec api python init_admin.py`

### Si WooCommerce no conecta
1. Verificar credenciales en `backend/.env`
2. Probar conexión: `curl -u consumer_key:consumer_secret https://tu-tienda.com/wp-json/wc/v3/orders`

## 10. URLs de Acceso

Una vez desplegado, el sistema estará disponible en:

- **Frontend:** http://tu-dominio.com:3000
- **Backend API:** http://tu-dominio.com:8000
- **Documentación API:** http://tu-dominio.com:8000/docs
- **MinIO Console:** http://tu-dominio.com:9001

## Soporte

Si encuentras problemas durante el despliegue, revisa:
1. Los logs de Docker: `docker-compose logs`
2. El estado de los contenedores: `docker-compose ps`
3. La conectividad de red: `curl http://localhost:8000/health`

¡Tu sistema de picking estará listo para usar en producción!
