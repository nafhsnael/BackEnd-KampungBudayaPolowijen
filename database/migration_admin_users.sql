-- ============================================================
-- File: migration_admin_users.sql
-- Database: kampung_polowijen
-- Deskripsi: Script aman untuk phpMyAdmin (tanpa PREPARE/information_schema)
-- ============================================================

USE kampung_polowijen;

-- 1. Buat tabel users jika belum ada sama sekali
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NULL,
  full_name     VARCHAR(150)  NOT NULL,
  username      VARCHAR(100)  NULL,
  role_title    VARCHAR(100)  NULL DEFAULT 'User',
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status        ENUM('Aktif', 'Suspended') NOT NULL DEFAULT 'Aktif',
  google_id     VARCHAR(255)  NULL,
  avatar_url    VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tambah kolom ke tabel users (jika tabel lama belum memiliki kolom ini)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL AFTER full_name;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_title VARCHAR(100) NULL DEFAULT 'User' AFTER username;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('Aktif', 'Suspended') NOT NULL DEFAULT 'Aktif' AFTER role;

-- 3. Buat tabel revoked_tokens jika belum ada
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_id   VARCHAR(36) NOT NULL,
  expires_at DATETIME    NOT NULL,
  PRIMARY KEY (token_id),
  KEY idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. INSERT DATA: 18 Data User (Sesuai FE Data User) + Admin Akun
-- Password akun:
-- - password123 (Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- - demo1234    (Hash: $2a$10$IFfA4peyYO.NqvHflAVs3.jgnxqUG229AmX3vr8qmh2gI9r33Esq6)
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
