import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

async function migrateRoutineScheduleTimes() {
  const { DB_USER, DB_NAME } = process.env;
  if (!DB_USER || !DB_NAME) {
    throw new Error("DB_USER and DB_NAME must be set in Backend/.env.");
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: DB_NAME,
    charset: "utf8mb4",
  });

  try {
    const [columns] = await connection.query("SHOW COLUMNS FROM routine_schedules");
    const existingColumns = new Set(columns.map((column) => column.Field));

    if (!existingColumns.has("start_time")) {
      await connection.query(
        "ALTER TABLE routine_schedules ADD COLUMN start_time TIME NULL AFTER day"
      );
    }
    if (!existingColumns.has("end_time")) {
      await connection.query(
        "ALTER TABLE routine_schedules ADD COLUMN end_time TIME NULL AFTER start_time"
      );
    }

    console.log("Routine schedule time columns are ready.");
  } finally {
    await connection.end();
  }
}

migrateRoutineScheduleTimes().catch((error) => {
  console.error("Failed to migrate routine schedule time columns:", error);
  process.exitCode = 1;
});
