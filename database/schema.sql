-- ============================================================
-- Database: kampung_polowijen
-- Tabel: users & revoked_tokens
-- Deskripsi: Skema tabel untuk autentikasi & manajemen user admin
-- ============================================================

CREATE DATABASE IF NOT EXISTS kampung_polowijen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kampung_polowijen;

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NULL     COMMENT 'NULL jika user login via OAuth',
  full_name     VARCHAR(150)  NOT NULL,
  username      VARCHAR(100)  NULL,
  role_title    VARCHAR(100)  NULL DEFAULT 'User' COMMENT 'Jabatan/Tampilan role, misal: Super Admin, Manajer UMKM',
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Akses hak akses otorisasi sistem',
  status        ENUM('Aktif', 'Suspended') NOT NULL DEFAULT 'Aktif' COMMENT 'Status akun pengguna',
  google_id     VARCHAR(255)  NULL     COMMENT 'Google OAuth Subject ID',
  avatar_url    VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabel: revoked_tokens (Revoked JWT tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_id   VARCHAR(36) NOT NULL,
  expires_at DATETIME    NOT NULL,
  PRIMARY KEY (token_id),
  KEY idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: 18 Data User (Sesuai FE Data User) + Admin Accounts
-- Password default akun:
-- - 'password123' (Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- - 'demo1234'    (Hash: $2a$10$IFfA4peyYO.NqvHflAVs3.jgnxqUG229AmX3vr8qmh2gI9r33Esq6)
-- ============================================================
INSERT INTO users (id, email, password_hash, full_name, username, role_title, role, status, created_at, updated_at)
VALUES
  ('1',  'admin@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin',     'admin_utama',    'Super Admin',     'admin', 'Aktif',     NOW(), NOW()),
  ('2',  'umkm@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajer UMKM',   'manajer_umkm',   'Manajer UMKM',   'user',  'Aktif',     NOW(), NOW()),
  ('3',  'event@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Event',    'event_admin',    'Admin Event',    'admin', 'Aktif',     NOW(), NOW()),
  ('4',  'paket@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Pengelola Paket','paket_admin',    'Pengelola Paket','user',  'Suspended', NOW(), NOW()),
  ('5',  'pembaca@kambudpolo.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User',           'pembaca1',       'User',           'user',  'Aktif',     NOW(), NOW()),
  ('6',  'budi@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajer UMKM',   'budi_santoso',   'Manajer UMKM',   'user',  'Aktif',     NOW(), NOW()),
  ('7',  'sari@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Event',    'sari_widiyanti', 'Admin Event',    'admin', 'Aktif',     NOW(), NOW()),
  ('8',  'dimas@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User',           'dimas_putri',    'User',           'user',  'Suspended', NOW(), NOW()),
  ('9',  'arif@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajer UMKM',   'arif_pratama',   'Manajer UMKM',   'user',  'Aktif',     NOW(), NOW()),
  ('10', 'maya@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Pengelola Paket','maya_lestari',   'Pengelola Paket','user',  'Aktif',     NOW(), NOW()),
  ('11', 'putri@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin',     'putri_admin',    'Super Admin',     'admin', 'Aktif',     NOW(), NOW()),
  ('12', 'rudi@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User',           'rudi_wahidin',   'User',           'user',  'Aktif',     NOW(), NOW()),
  ('13', 'nisa@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Event',    'nisa_azizah',    'Admin Event',    'admin', 'Aktif',     NOW(), NOW()),
  ('14', 'fajar@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajer UMKM',   'fajar_ramadhan', 'Manajer UMKM',   'user',  'Suspended', NOW(), NOW()),
  ('15', 'indah@kambudpolo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Pengelola Paket','indah_sari',     'Pengelola Paket','user',  'Aktif',     NOW(), NOW()),
  ('16', 'dian@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'User',           'dian_mayanti',   'User',           'user',  'Aktif',     NOW(), NOW()),
  ('17', 'rio@kambudpolo.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Event',    'rio_pratama',    'Admin Event',    'admin', 'Aktif',     NOW(), NOW()),
  ('18', 'tari@kambudpolo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajer UMKM',   'tari_puspita',   'Manajer UMKM',   'user',  'Aktif',     NOW(), NOW()),
  ('19', 'admin@demo.com',        '$2a$10$IFfA4peyYO.NqvHflAVs3.jgnxqUG229AmX3vr8qmh2gI9r33Esq6', 'Admin Demo',      'admin_demo',     'Super Admin',     'admin', 'Aktif',     NOW(), NOW()),
  ('20', 'admin@polowijen.id',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin Polowijen', 'admin_polowijen', 'Super Admin',     'admin', 'Aktif',     NOW(), NOW())
ON DUPLICATE KEY UPDATE
  full_name  = VALUES(full_name),
  username   = VALUES(username),
  role_title = VALUES(role_title),
  role       = VALUES(role),
  status     = VALUES(status),
  updated_at = NOW();


-- ============================================================
-- Tabel: umkm (Data Usaha Mikro Kecil & Menengah + URL gambar)
-- ============================================================
CREATE TABLE IF NOT EXISTS umkm (
  id          VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  name        VARCHAR(150)   NOT NULL,
  category    VARCHAR(100)   NOT NULL COMMENT 'Kriya, Kuliner, Minuman, dll.',
  description TEXT           NULL,
  price       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  image_url   VARCHAR(500)   NULL     COMMENT 'URL publik gambar',
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabel: events (Data Event/Agenda Budaya + URL poster)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id          VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  name        VARCHAR(150)   NOT NULL,
  description TEXT           NULL,
  event_date  DATE           NOT NULL,
  capacity    VARCHAR(100)   NULL DEFAULT '50 Orang',
  price       VARCHAR(100)   NULL DEFAULT 'Gratis',
  poster_url  VARCHAR(500)   NULL     COMMENT 'URL publik poster',
  status      ENUM('Upcoming', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Upcoming',
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabel: packages (Paket Kunjungan)
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id          VARCHAR(36)    NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  description TEXT           NULL,
  duration    VARCHAR(100)   NULL,
  capacity    VARCHAR(100)   NULL,
  price       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  image_url   VARCHAR(500)   NULL,
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_packages_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabel: routine_schedules (Jadwal Rutin Mingguan)
-- ============================================================
CREATE TABLE IF NOT EXISTS routine_schedules (
  id          VARCHAR(36)    NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  day         ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
  start_time  TIME           NULL,
  end_time    TIME           NULL,
  description TEXT           NULL,
  capacity    VARCHAR(100)   NULL,
  price       VARCHAR(100)   NULL,
  image_url   VARCHAR(2048)  NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routine_schedules_day (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
