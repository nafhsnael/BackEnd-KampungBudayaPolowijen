USE kampung_polowijen;

ALTER TABLE umkm
  ADD COLUMN craftsman_name VARCHAR(150) NULL AFTER image_url,
  ADD COLUMN whatsapp_number VARCHAR(30) NULL AFTER craftsman_name,
  ADD KEY idx_umkm_category_name (category, name);

CREATE TABLE IF NOT EXISTS umkm_images (
  id         VARCHAR(36)   NOT NULL,
  umkm_id    VARCHAR(36)   NOT NULL,
  image_url  VARCHAR(500)  NOT NULL,
  sort_order INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_umkm_images_owner (umkm_id, sort_order),
  CONSTRAINT fk_umkm_images_umkm
    FOREIGN KEY (umkm_id) REFERENCES umkm (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  user_id    VARCHAR(36) NOT NULL,
  umkm_id    VARCHAR(36) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, umkm_id),
  KEY idx_wishlists_umkm_id (umkm_id),
  CONSTRAINT fk_wishlists_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_umkm
    FOREIGN KEY (umkm_id) REFERENCES umkm (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_id   VARCHAR(36) NOT NULL,
  expires_at DATETIME    NOT NULL,
  PRIMARY KEY (token_id),
  KEY idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
