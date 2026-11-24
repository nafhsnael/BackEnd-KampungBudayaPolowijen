import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const sampleSchedules = [
  {
    id: "dummy-sarasehan",
    name: "Sarasehan Budaya Malang",
    day: "Jumat",
    startTime: "19:00",
    endTime: "21:00",
    description: "Sarasehan budaya yang membahas macapat, topeng, dan wayang",
  },
  {
    id: "dummy-bantengan",
    name: "Bantengan / Jaranan",
    day: "Sabtu",
    startTime: "09:00",
    endTime: "13:00",
    description: "Seni Bantengan dan Jaranan tiap Sabtu pagi",
  },
  {
    id: "dummy-gladhi",
    name: "Gladhi Tari Tradisi",
    day: "Sabtu",
    startTime: "13:00",
    endTime: "16:00",
    description: "Gladhi atau latihan tari tradisi bersama",
  },
  {
    id: "dummy-hasta-karya",
    name: "Hasta Karya / Liwetan",
    day: "Sabtu",
    startTime: "13:00",
    endTime: "15:00",
    description: "Gladhi atau latihan tari tradisi bersama",
  },
];

async function seedRoutineSchedules() {
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
    let inserted = 0;
    for (const schedule of sampleSchedules) {
      const [result] = await connection.execute(
        `INSERT INTO routine_schedules
          (id, name, day, start_time, end_time, description, capacity, price, image_url)
         SELECT ?, ?, ?, ?, ?, ?, NULL, NULL, NULL
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM routine_schedules WHERE id = ? OR name = ?
         )`,
        [
          schedule.id,
          schedule.name,
          schedule.day,
          schedule.startTime,
          schedule.endTime,
          schedule.description,
          schedule.id,
          schedule.name,
        ]
      );
      inserted += result.affectedRows;
    }

    console.log(
      `Routine schedule seed complete: ${inserted} inserted, ${sampleSchedules.length - inserted} already present.`
    );
  } finally {
    await connection.end();
  }
}

seedRoutineSchedules().catch((error) => {
  console.error("Failed to seed routine schedule data:", error);
  process.exitCode = 1;
});
