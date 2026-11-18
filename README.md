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
│   │   ├── rate-limit.middleware.ts # Rate limit API dan autentikasi
│   │   ├── request-context.middleware.ts # Request ID dan request logger
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
│   ├── logger.ts                 # Structured request/error logging
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

### Konfigurasi keamanan HTTP

`src/app.ts` mengurutkan middleware request ID/logging, Helmet, CORS, parser
request, pembatasan laju API, route, 404, lalu error handler. Di `.env`:

- `CORS_ORIGINS`: origin frontend yang diizinkan, dipisahkan koma. Wajib diisi
  pada production; gunakan origin tepat tanpa path.
- `TRUST_PROXY_HOPS`: default `0`. Ubah hanya ke jumlah proxy tepercaya yang
  benar-benar berada di depan backend agar IP klien dan rate limit akurat.
- `API_RATE_LIMIT_*`: default 100 request per 15 menit per IP.
- `AUTH_RATE_LIMIT_*`: default 10 request per 15 menit per IP untuk login dan
  autentikasi Google.

Rate limiter memakai memory store bawaan, sehingga batasnya berlaku per proses.
Jika backend dijalankan dalam beberapa instance, konfigurasikan store bersama
(misalnya Redis) sebelum mengandalkan batas rate limit lintas instance. Header
dan body request, termasuk password, token, dan cookie, tidak dicatat oleh
request logger. Setiap respons membawa `X-Request-ID` untuk korelasi log.

Endpoint unggah `/api/upload` sekarang memerlukan autentikasi dan role `admin`.

Jalankan pemeriksaan build dan tes HTTP dengan:

```bash
npm test
```

---

## 📡 Endpoint API

Semua respons API menggunakan format `{ "success": true, "message": "...", "data": ... }`.
Header akses admin dan logout: `Authorization: Bearer <accessToken>`.

### Authentication

| Method | Endpoint | Kegunaan |
|---|---|---|
| `POST` | `/api/auth/login` | Login pengguna |
| `POST` | `/api/auth/admin/login` | Login khas admin; pengguna bukan admin ditolak |
| `POST` | `/api/auth/logout` | Batalkan token semasa |
| `POST` | `/api/auth/google` | Login OAuth Google (mock sedia ada) |

Kedua-dua endpoint login menerima JSON `{ "email": "...", "password": "..." }`.
Respons login mengandungi `data.user` (termasuk `role`) dan `data.accessToken`.
Logout memerlukan token akses dan token yang dibatalkan tidak boleh digunakan semula.
Jadual `revoked_tokens` diwujudkan oleh `database/schema.sql`; jalankan skrip itu pada
database sedia ada sebelum menggunakan fungsi logout.

### Admin dashboard dan pengurusan pengguna

Semua route `/api/admin/*` memerlukan token pengguna berperanan `admin`.

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Statistik ringkas |
| `GET` | `/api/admin/users?search=budi&role=user&page=1&limit=10` | Carian, penapis dan pagination |
| `POST` | `/api/admin/users` | Cipta pengguna |
| `GET` | `/api/admin/users/:id` | Dapatkan butiran pengguna |
| `PUT` | `/api/admin/users/:id` | Kemaskini satu atau lebih medan |
| `DELETE` | `/api/admin/users/:id` | Padam pengguna |
| `GET` | `/api/admin/packages` | Senarai dan carian paket kunjungan |
| `POST` | `/api/admin/packages` | Cipta paket kunjungan |
| `PUT` | `/api/admin/packages/:id` | Kemaskini paket kunjungan |
| `DELETE` | `/api/admin/packages/:id` | Padam paket kunjungan |
| `GET` | `/api/admin/routine-schedules` | Senarai jadual rutin mingguan |
| `POST` | `/api/admin/routine-schedules` | Cipta jadual rutin |
| `PUT` | `/api/admin/routine-schedules/:id` | Kemaskini jadual rutin |
| `DELETE` | `/api/admin/routine-schedules/:id` | Padam jadual rutin |

Body cipta pengguna: `{ "email": "...", "fullName": "...", "password": "...", "role": "user" }`.
Kemaskini menerima `email`, `fullName`, `password`, `role`, dan/atau `avatarUrl`.
Senarai memulangkan `data.users`, `data.total` dan metadata `data.pagination`.
Statistik memulangkan `totalUsers`, `totalUmkm`, `totalEvents`, dan `activePackages`.
Jumlah UMKM/event/paket ialah `null` jika jadual modul tersebut belum wujud.
Jadual rutin menerima `name`, `day` (Senin hingga Minggu), `description`,
`capacity`, `price`, dan `imageUrl`.

Jalankan `database/migration_admin_content.sql` sekali pada database sedia ada
untuk menyediakan jadual UMKM, event, dan paket yang belum tersedia. Jalankan
`database/migration_routine_schedules.sql` untuk menambahkan jadual rutin mingguan.
Migrasi ini tidak memasukkan data seed. Jadual `packages` menyimpan nama, deskripsi,
durasi, kapasitas, harga, URL gambar, dan status aktif; `routine_schedules` menyimpan
nama kegiatan, hari, deskripsi, kapasitas, harga, dan URL gambar.

### Endpoint auth terdahulu

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
