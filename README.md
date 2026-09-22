# Backend Auth Service (Clean / Layered Architecture)

Service Backend Node.js & TypeScript yang dibangun dengan arsitektur modular **Clean / Layered Architecture** (Controller -> Service -> Repository) khusus untuk fitur **Authentication (Login)**.

---

## 📁 Struktur Folder Project

```text
UTS_KampungPolowijen/Backend/
├── src/
│   ├── config/
│   │   └── env.config.ts         # Pengaturan & Validasi Variabel Lingkungan (Zod)
│   ├── controllers/
│   │   └── auth.controller.ts    # Handler Request & Response HTTP
│   ├── dtos/
│   │   └── auth.dto.ts           # Data Transfer Objects (Email & Password, Google OAuth)
│   ├── errors/
│   │   └── app.error.ts          # Class Error Kustom (AppError, Unauthorized, Bad Request)
│   ├── middlewares/
│   │   ├── error.middleware.ts   # Global Centralized Error Handling Middleware
│   │   └── validate.middleware.ts# Middleware Validasi Schema Input Body (Zod)
│   ├── models/
│   │   └── user.model.ts         # User Interface / Entity
│   ├── repositories/
│   │   ├── user.repository.interface.ts # Contract Interface Repository User
│   │   └── user.repository.ts    # Implementation Repository User (Mock / Database)
│   ├── routes/
│   │   ├── auth.routes.ts        # Endpoint Router /api/auth (Login & Google Login)
│   │   └── index.ts              # Root Router API
│   ├── services/
│   │   └── auth.service.ts       # Business Logic Authentication & Penerbitan JWT Token
│   ├── utils/
│   │   ├── jwt.util.ts           # Helper Sign & Verify Token JWT
│   │   ├── password.util.ts      # Helper Hashing & Verifikasi Password (bcryptjs)
│   │   └── response.util.ts     # Helper Standardized JSON Response
│   ├── app.ts                    # Setup Konfigurasi App Express
│   └── server.ts                 # Bootstrap & Server Entry Point
├── .env                          # Konfigurasi Environment Lokal
├── .env.example                  # Template File Environment
├── package.json
├── README.md                     # Dokumentasi & Panduan
└── tsconfig.json
```

---

## 🚀 Cara Menjalankan Project

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Jalankan Mode Development
```bash
npm run dev
```
Server akan berjalan secara otomatis di `http://localhost:5000`.

### 3. Pengecekan Type-Checking TypeScript
```bash
npm run type-check
```

### 4. Build untuk Production
```bash
npm run build
npm start
```

---

## 📡 Endpoint API Auth

### 1. Standard Login (Email & Password)
- **URL**: `POST /api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr-001",
      "email": "user@example.com",
      "fullName": "Budi Santoso",
      "avatarUrl": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Google OAuth Login
- **URL**: `POST /api/auth/google`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "idToken": "google-id-token-sample-string"
}
```

---

## 🔑 Data Seed Default (Mock Data)

| Email | Password | Role / Nama |
|---|---|---|
| `user@example.com` | `password123` | Budi Santoso |
| `googleuser@example.com` | *(OAuth Google)* | Siti Rahma |
