USE kampung_polowijen;

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
