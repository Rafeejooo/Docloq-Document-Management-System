# 🔐 DocLoq Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Secure Document Management System Backend API**

Backend REST API untuk DocLoq - Sistem Manajemen Dokumen yang aman dengan dukungan GDPR & UU PDP Indonesia.

[Fitur](#-fitur) •
[Quick Start](#-quick-start) •
[API Docs](#-api-endpoints) •
[Database](#-database-schema) •
[Deployment](#-deployment)

</div>

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Setup Environment](#3-setup-environment-variables)
  - [4. Setup Database](#4-setup-database)
  - [5. Run Migrations](#5-run-database-migrations)
  - [6. Start Server](#6-start-server)
- [Struktur Project](#-struktur-project)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Docker Setup](#-docker-setup)
- [OnlyOffice Setup](#-onlyoffice-setup-document-editor)
- [NPM Scripts](#-npm-scripts)
- [Security Features](#-security-features)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Authentication** | JWT-based authentication dengan refresh token |
| 🔑 **Two-Factor Auth (2FA)** | TOTP-based 2FA menggunakan Google Authenticator |
| 👥 **User Management** | CRUD operations dengan role-based access control |
| 🏢 **Multi-Organization** | Support multiple organizations/tenants |
| 🛡️ **Security** | Helmet, CORS, bcrypt, rate limiting ready |
| 📊 **Audit Logging** | Track semua aktivitas user |
| 🔄 **Session Management** | Multiple device sessions support |
| 📝 **Compliance** | GDPR & UU PDP Indonesia ready |

---

## 🛠 Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime dengan ES Modules |
| **Express.js** | 5.x | Web framework |
| **PostgreSQL** | 16+ | Primary database |
| **Drizzle ORM** | 0.45+ | Type-safe SQL ORM |

### Security
| Package | Purpose |
|---------|---------|
| **bcryptjs** | Password hashing (12 rounds) |
| **jsonwebtoken** | JWT token management |
| **otplib** | TOTP 2FA implementation |
| **helmet** | HTTP security headers |
| **cors** | Cross-Origin Resource Sharing |

### Development
| Package | Purpose |
|---------|---------|
| **nodemon** | Hot reload untuk development |
| **drizzle-kit** | Database migration tools |
| **dotenv** | Environment variables |

---

## 📋 Prerequisites

Sebelum memulai, pastikan sistem kamu memiliki:

- ✅ **Node.js** v18 atau lebih tinggi ([Download](https://nodejs.org/))
- ✅ **npm** v9+ atau **yarn** v1.22+
- ✅ **PostgreSQL** v14+ ([Download](https://www.postgresql.org/download/))
- ✅ **Docker** & **Docker Compose** (opsional, tapi recommended)
- ✅ **Git** untuk version control

### Verifikasi Instalasi

```bash
# Check Node.js
node --version  # Should be v18+

# Check npm
npm --version   # Should be v9+

# Check PostgreSQL (jika install manual)
psql --version  # Should be 14+

# Check Docker (jika menggunakan Docker)
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
# Clone repository
git clone <repository-url>

# Masuk ke folder backend
cd docloq/backend
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# Atau menggunakan yarn
yarn install
```

### 3. Setup Environment Variables

Buat file `.env` di folder `backend/`:

```bash
# Copy dari template (jika ada)
cp .env.example .env

# Atau buat manual
touch .env
```

Edit file `.env` dengan konfigurasi berikut:

```env
# ═══════════════════════════════════════════════════════════════
# SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════════════
PORT=3000
NODE_ENV=development

# ═══════════════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════════
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Untuk Docker:
DATABASE_URL=postgresql://user:password@localhost:5436/docloq_db

# Untuk instalasi manual PostgreSQL:
# DATABASE_URL=postgresql://your_username:your_password@localhost:5432/docloq

# ═══════════════════════════════════════════════════════════════
# JWT CONFIGURATION
# ═══════════════════════════════════════════════════════════════
# Generate secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-change-in-production

# ═══════════════════════════════════════════════════════════════
# CORS CONFIGURATION
# ═══════════════════════════════════════════════════════════════
FRONTEND_URL=http://localhost:5173

# ═══════════════════════════════════════════════════════════════
# OPTIONAL: hCaptcha (untuk production)
# ═══════════════════════════════════════════════════════════════
HCAPTCHA_ENABLED=false
HCAPTCHA_SECRET=your-hcaptcha-secret-key
```

#### 🔑 Generate JWT Secret

```bash
# Jalankan di terminal untuk generate random JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Setup Database

#### Option A: Menggunakan Docker (Recommended) ⭐

```bash
# Start PostgreSQL container
docker-compose up -d

# Verifikasi container berjalan
docker ps

# Output yang diharapkan:
# CONTAINER ID   IMAGE              PORTS                    NAMES
# xxxx           postgres:16-alpine 0.0.0.0:5436->5432/tcp  docloq_postgres
```

Docker akan membuat:
- **Container**: `docloq_postgres`
- **Port**: `5436` (mapped ke 5432 internal)
- **Database**: `docloq_db`
- **Username**: `user`
- **Password**: `password`

#### Option B: Instalasi PostgreSQL Manual

```bash
# macOS (menggunakan Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Buat database:

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE docloq;

# Buat user (opsional)
CREATE USER docloq_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE docloq TO docloq_user;

# Keluar
\q
```

### 5. Run Database Migrations

```bash
# Generate migration dari schema (jika ada perubahan schema)
npm run db:generate

# Apply migration ke database
npm run db:migrate

# Seed data awal (admin user)
npm run db:seed
```

#### Output yang Diharapkan:

```
🌱 Starting database seed...

📁 Creating organization...
   ✅ Organization created: DocLoq Admin
🔐 Hashing password...
👤 Creating admin user...
   ✅ Admin user created: admin@docloq.site

✨ Seed completed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 Login Credentials (for testing):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Email:    admin@docloq.site
  Password: Admin123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6. Start Server

```bash
# Development mode (dengan hot reload)
npm run dev

# Production mode
npm start
```

#### ✅ Server Ready!

```
Server will run at:
→ Local:    http://localhost:3000
→ Health:   http://localhost:3000/
→ API:      http://localhost:3000/api
```

Test dengan browser atau curl:

```bash
curl http://localhost:3000

# Response:
# {
#   "project": "DocLoq Backend",
#   "status": "Secure & Running",
#   "timestamp": "2026-01-29T...",
#   "version": "1.0.0"
# }
```

---

## 📁 Struktur Project

```
backend/
├── 📄 package.json           # Dependencies & scripts
├── 📄 docker-compose.yml     # Docker PostgreSQL setup
├── 📄 drizzle.config.js      # Drizzle ORM configuration
├── 📄 .env                   # Environment variables (git ignored)
│
├── 📂 src/
│   ├── 📄 index.js           # 🚀 Entry point & Express setup
│   │
│   ├── 📂 config/
│   │   └── 📄 auth.config.js # JWT, password policy, hCaptcha config
│   │
│   ├── 📂 controllers/       # Business logic
│   │   ├── 📄 auth.controller.js    # Login, register, logout
│   │   ├── 📄 totp.controller.js    # 2FA TOTP management
│   │   └── 📄 user.controller.js    # User CRUD operations
│   │
│   ├── 📂 db/
│   │   ├── 📄 index.js       # Database connection (Drizzle)
│   │   └── 📄 schema.js      # 📊 Database schema definitions
│   │
│   ├── 📂 middlewares/
│   │   └── 📄 auth.middleware.js    # JWT verification & role auth
│   │
│   ├── 📂 routes/
│   │   ├── 📄 index.js       # Route aggregator
│   │   ├── 📄 auth.routes.js # /api/auth/*
│   │   ├── 📄 totp.routes.js # /api/totp/*
│   │   └── 📄 user.routes.js # /api/users/*
│   │
│   └── 📂 scripts/
│       └── 📄 seed.js        # 🌱 Database seeder
│
├── 📂 drizzle/               # Auto-generated migrations
│   ├── 📄 0000_goofy_magma.sql
│   └── 📂 meta/
│       ├── 📄 _journal.json
│       └── 📄 0000_snapshot.json
│
└── 📂 docs/
    └── 📄 DATABASE_SCHEMA.md # 📚 Complete schema documentation
```

---

## 📚 API Endpoints

Base URL: `http://localhost:3000/api`

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `POST` | `/login` | ❌ | Login dengan email & password |
| `POST` | `/register` | ❌ | Registrasi user baru |
| `POST` | `/complete-login` | ❌ | Complete login setelah 2FA verification |
| `POST` | `/refresh-token` | ❌ | Refresh access token |
| `POST` | `/logout` | ✅ | Logout & invalidate session |
| `GET` | `/me` | ✅ | Get current logged-in user info |

#### Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    
    C->>S: POST /api/auth/login (email, password)
    S->>DB: Verify credentials
    alt 2FA Enabled
        S->>C: { requiresTwoFactor: true, tempToken }
        C->>S: POST /api/totp/verify-login (tempToken, code)
        S->>C: { accessToken, refreshToken }
    else 2FA Disabled
        S->>C: { accessToken, refreshToken }
    end
```

### 🔑 TOTP / 2FA (`/api/totp`)

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `POST` | `/verify-login` | ❌ | Verify 2FA code saat login |
| `GET` | `/status` | ✅ | Get 2FA status (enabled/disabled) |
| `POST` | `/generate` | ✅ | Generate TOTP secret & QR code |
| `POST` | `/enable` | ✅ | Enable 2FA setelah verify code |
| `POST` | `/disable` | ✅ | Disable 2FA |

### 👥 Users (`/api/users`)

| Method | Endpoint | Auth | Role | Description |
|:------:|----------|:----:|:----:|-------------|
| `GET` | `/` | ✅ | Admin | List semua users (paginated) |
| `GET` | `/:id` | ✅ | Admin | Get user by ID |
| `POST` | `/` | ✅ | Admin | Create user baru |
| `PUT` | `/:id` | ✅ | Admin | Update user |
| `DELETE` | `/:id` | ✅ | Admin | Soft delete user |
| `POST` | `/:id/reset-password` | ✅ | Admin | Reset user password |
| `PATCH` | `/:id/toggle-status` | ✅ | Admin | Toggle active/inactive |

### 📝 Request/Response Examples

<details>
<summary><b>POST /api/auth/login</b></summary>

**Request:**
```json
{
  "email": "admin@docloq.site",
  "password": "Admin123!"
}
```

**Response (2FA Disabled):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@docloq.site",
      "firstName": "Admin",
      "lastName": "DocLoq",
      "role": "super_admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response (2FA Enabled):**
```json
{
  "success": true,
  "message": "2FA verification required",
  "data": {
    "requiresTwoFactor": true,
    "tempToken": "temporary-token-for-2fa"
  }
}
```
</details>

<details>
<summary><b>GET /api/auth/me</b></summary>

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@docloq.site",
    "firstName": "Admin",
    "lastName": "DocLoq",
    "role": "super_admin",
    "organizationId": "uuid",
    "twoFactorEnabled": false,
    "isActive": true,
    "createdAt": "2026-01-29T..."
  }
}
```
</details>

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | ❌ | `3000` | Port server berjalan |
| `NODE_ENV` | ❌ | `development` | Environment mode (`development`/`production`) |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | - | Secret key untuk JWT signing (min 32 chars) |
| `FRONTEND_URL` | ❌ | - | Frontend URL untuk CORS whitelist |
| `HCAPTCHA_ENABLED` | ❌ | `false` | Enable/disable hCaptcha verification |
| `HCAPTCHA_SECRET` | ❌ | - | hCaptcha secret key |

### Database URL Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Examples:**
```env
# Docker (dari docker-compose.yml)
DATABASE_URL=postgresql://user:password@localhost:5436/docloq_db

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docloq

# Remote Database
DATABASE_URL=postgresql://user:password@db.example.com:5432/docloq?sslmode=require
```

---

## 📊 Database Schema

DocLoq menggunakan Drizzle ORM dengan PostgreSQL. Schema lengkap didefinisikan di `src/db/schema.js`.

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant organizations |
| `users` | User accounts & profiles |
| `user_sessions` | JWT session management |

### User Roles

```typescript
type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'auditor' | 'viewer';
```

| Role | Description |
|------|-------------|
| `super_admin` | Full system access |
| `admin` | Organization admin |
| `manager` | Team/department manager |
| `user` | Regular user |
| `auditor` | Read-only audit access |
| `viewer` | View-only access |

### Entity Relationship

```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │       │     users       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ organization_id │
│ name            │       │ id (PK)         │
│ slug            │       │ email           │
│ subscription    │       │ password_hash   │
│ ...             │       │ role            │
└─────────────────┘       │ ...             │
                          └────────┬────────┘
                                   │
                          ┌────────┴────────┐
                          │  user_sessions  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ user_id (FK)    │
                          │ token           │
                          │ expires_at      │
                          └─────────────────┘
```

📖 **Dokumentasi lengkap**: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

---

## 🐳 Docker Setup

### Docker Compose Services

File `docker-compose.yml` menyediakan:

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `db` | `postgres:16-alpine` | `5436:5432` | PostgreSQL database |

### Perintah Docker

```bash
# Start semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop & hapus volumes (⚠️ data hilang!)
docker-compose down -v

# Restart services
docker-compose restart

# Masuk ke container PostgreSQL
docker exec -it docloq_postgres psql -U user -d docloq_db
```

### Docker Environment

Ketika menggunakan Docker, database tersedia di:

| Property | Value |
|----------|-------|
| **Host** | `localhost` |
| **Port** | `5436` |
| **Database** | `docloq_db` |
| **Username** | `user` |
| **Password** | `password` |

### Optional: PgAdmin

Uncomment bagian `pgadmin` di `docker-compose.yml` untuk GUI database:

```yaml
pgadmin:
  image: dpage/pgadmin4
  container_name: docloq_pgadmin
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@docloq.com
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
  networks:
    - docloq_network
  depends_on:
    - db
```

Akses PgAdmin di `http://localhost:5050`

---

## � OnlyOffice Setup (Document Editor)

OnlyOffice Document Server digunakan untuk viewing dan editing dokumen (Word, Excel, PowerPoint, PDF) langsung di browser.

### Prerequisites

- ✅ Docker & Docker Compose
- ✅ Minimum 4GB RAM untuk container OnlyOffice

### Setup OnlyOffice

#### 1. Masuk ke folder OnlyOffice

```bash
cd ../onlyoffice
# atau dari root project:
cd docloq/onlyoffice
```

#### 2. Start OnlyOffice Container

```bash
docker-compose up -d
```

#### 3. Tunggu OnlyOffice Ready

OnlyOffice membutuhkan waktu 1-2 menit untuk startup. Cek status:

```bash
# Cek container berjalan
docker ps

# Cek logs
docker-compose logs -f onlyoffice

# Tunggu sampai muncul: "nginx entered RUNNING state"
```

#### 4. Verifikasi

Buka browser dan akses:
```
http://localhost:8082
```

Jika muncul halaman "Document Server is running", OnlyOffice siap digunakan.

### OnlyOffice Configuration

File `docker-compose.yml`:

```yaml
version: '3'
services:
  onlyoffice:
    image: onlyoffice/documentserver:latest
    container_name: onlyoffice_ds
    environment:
      - JWT_ENABLED=false  # Disable JWT untuk development
      - JWT_SECRET=secret  
    ports:
      - "8082:80"          # Akses via http://localhost:8082
    volumes:
      - ./logs:/var/log/onlyoffice
      - ./data:/var/www/onlyoffice/Data
      - ./lib:/var/lib/onlyoffice
    restart: always
```

| Property | Value | Description |
|----------|-------|-------------|
| **Port** | `8082` | OnlyOffice Document Server |
| **JWT** | Disabled | Untuk kemudahan development |
| **Container** | `onlyoffice_ds` | Nama container |

### Backend Configuration

Backend menggunakan `host.docker.internal` agar OnlyOffice container bisa mengakses file dari backend:

```javascript
// Di document.controller.js
const baseUrl = process.env.NODE_ENV === 'production'
  ? process.env.BACKEND_URL
  : 'http://host.docker.internal:3000';
```

> **Note for Mac/Windows**: `host.docker.internal` otomatis tersedia.
> 
> **Note for Linux**: Tambahkan `extra_hosts` di docker-compose:
> ```yaml
> extra_hosts:
>   - "host.docker.internal:host-gateway"
> ```

### Perintah OnlyOffice

```bash
# Start OnlyOffice
docker-compose up -d

# Stop OnlyOffice
docker-compose down

# Restart OnlyOffice
docker-compose restart

# Lihat logs
docker-compose logs -f

# Masuk ke container
docker exec -it onlyoffice_ds bash
```

### Troubleshooting OnlyOffice

| Problem | Solution |
|---------|----------|
| "Download failed" di editor | Pastikan backend listen di `0.0.0.0` dan gunakan `host.docker.internal` |
| Container tidak start | Pastikan port 8082 tidak digunakan aplikasi lain |
| Lambat/hang saat startup | Normal, tunggu 1-2 menit. OnlyOffice butuh resource cukup besar |
| Memory issue | Minimum 4GB RAM untuk OnlyOffice container |

### Supported File Types

| Type | Extensions |
|------|------------|
| **Word** | `.doc`, `.docx`, `.odt`, `.rtf`, `.txt` |
| **Excel** | `.xls`, `.xlsx`, `.ods`, `.csv` |
| **PowerPoint** | `.ppt`, `.pptx`, `.odp` |
| **PDF** | `.pdf` (view only) |

---

## �🛠 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon src/index.js` | Start development server (hot reload) |
| `npm start` | `node src/index.js` | Start production server |
| `npm run db:generate` | `drizzle-kit generate` | Generate migration dari schema changes |
| `npm run db:migrate` | `drizzle-kit migrate` | Apply migrations ke database |
| `npm run db:seed` | `node src/scripts/seed.js` | Seed data awal (admin user) |
| `npm run db:studio` | `drizzle-kit studio` | Open Drizzle Studio (database GUI) |

### Drizzle Studio

```bash
npm run db:studio
```

Buka `https://local.drizzle.studio` untuk melihat dan mengedit data database secara visual.

---

## 🔒 Security Features

| Feature | Implementation | Status |
|---------|----------------|:------:|
| **Password Hashing** | bcrypt dengan 12 salt rounds | ✅ |
| **JWT Authentication** | Access token + Refresh token | ✅ |
| **Two-Factor Auth** | TOTP (Google Authenticator compatible) | ✅ |
| **Account Lockout** | Lock setelah 5 failed login attempts | ✅ |
| **Security Headers** | Helmet.js middleware | ✅ |
| **CORS Protection** | Whitelist-based CORS | ✅ |
| **Input Validation** | Request body validation | ✅ |
| **SQL Injection Protection** | Drizzle ORM parameterized queries | ✅ |
| **Rate Limiting** | Ready to implement | 🔄 |
| **Request Logging** | Development mode logging | ✅ |

### Password Policy

- Minimum 8 karakter
- Harus mengandung huruf besar
- Harus mengandung huruf kecil
- Harus mengandung angka
- Harus mengandung karakter spesial

---

## 📝 Development Guide

### Adding New Endpoint

1. **Buat Controller** di `src/controllers/`

```javascript
// src/controllers/example.controller.js
export const getExamples = async (req, res) => {
  // Logic here
  res.json({ success: true, data: [] });
};
```

2. **Buat Routes** di `src/routes/`

```javascript
// src/routes/example.routes.js
import { Router } from 'express';
import { getExamples } from '../controllers/example.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getExamples);

export default router;
```

3. **Register Routes** di `src/routes/index.js`

```javascript
import exampleRoutes from './example.routes.js';

router.use('/examples', exampleRoutes);
```

### Testing 2FA

Untuk development, kode `123456` akan selalu diterima sebagai valid TOTP code.

### Database Changes

1. Edit schema di `src/db/schema.js`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`

---

## ❓ Troubleshooting

### Connection Refused ke Database

```bash
# Check apakah Docker container berjalan
docker ps

# Restart container
docker-compose restart db

# Check logs
docker-compose logs db
```

### Port Already in Use

```bash
# macOS/Linux - cari proses yang menggunakan port
lsof -i :3000
lsof -i :5436

# Kill proses
kill -9 <PID>
```

### Migration Errors

```bash
# Reset database (⚠️ data hilang!)
docker-compose down -v
docker-compose up -d

# Run migrations ulang
npm run db:migrate
npm run db:seed
```

### JWT Token Invalid

- Pastikan `JWT_SECRET` di `.env` sama saat generate dan verify token
- Token mungkin expired, gunakan refresh token

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 🔐 Default Credentials

Setelah menjalankan `npm run db:seed`:

| Field | Value |
|-------|-------|
| **Email** | `admin@docloq.site` |
| **Password** | `Admin123!` |

> ⚠️ **PENTING**: Ganti password ini segera di production!

---

## 📞 Support

- 📧 Email: support@docloq.site
- 📖 Documentation: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- 🐛 Issues: GitHub Issues

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ by DocLoq Team**

</div>
