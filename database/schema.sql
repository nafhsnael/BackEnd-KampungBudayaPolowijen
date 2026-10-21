-- ============================================================
-- Database: kampung_polowijen
-- Tabel: users
-- Deskripsi: Skema tabel untuk autentikasi & manajemen user
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
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  google_id     VARCHAR(255)  NULL     COMMENT 'Google OAuth Subject ID',
  avatar_url    VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA - Dummy users untuk pengetesan
-- password_hash = bcrypt hash dari 'password123'  (cost=10)
-- Untuk generate ulang: import bcryptjs lalu bcrypt.hashSync('password123', 10)
-- ============================================================
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES
  (
    'usr-00000000-0001',
    'user@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Budi Santoso',
    'user',
    NOW(),
    NOW()
  ),
  (
    'usr-00000000-0002',
    'admin@polowijen.id',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Admin Polowijen',
    'admin',
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE updated_at = updated_at;

-- Token IDs are stored until expiry to support immediate logout/revocation.
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_id   VARCHAR(36) NOT NULL,
  expires_at DATETIME    NOT NULL,
  PRIMARY KEY (token_id),
  KEY idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Google OAuth user (tanpa password)
INSERT INTO users (id, email, password_hash, full_name, role, google_id, avatar_url, created_at, updated_at)
VALUES
  (
    'usr-00000000-0003',
    'googleuser@example.com',
    NULL,
    'Siti Rahma',
    'user',
    'google-sub-id-123456',
    'https://lh3.googleusercontent.com/a/mock-photo',
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE updated_at = updated_at;
