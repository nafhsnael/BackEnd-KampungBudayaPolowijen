USE kampung_polowijen;

CREATE TABLE IF NOT EXISTS umkm (
  id          VARCHAR(36)    NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  category    VARCHAR(100)   NOT NULL,
  description TEXT           NULL,
  price       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  image_url   VARCHAR(500)   NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id          VARCHAR(36)    NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  description TEXT           NULL,
  event_date  DATE           NOT NULL,
  capacity    VARCHAR(100)   NULL DEFAULT '50 Orang',
  price       VARCHAR(100)   NULL DEFAULT 'Gratis',
  poster_url  VARCHAR(500)   NULL,
  status      ENUM('Upcoming', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Upcoming',
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS routine_schedules (
  id          VARCHAR(36)    NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  day         ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
  description TEXT           NULL,
  capacity    VARCHAR(100)   NULL,
  price       VARCHAR(100)   NULL,
  image_url   VARCHAR(2048)  NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routine_schedules_day (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
