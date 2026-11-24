import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const features = [
  "Sinau budaya",
  "Sajian tari tradisi/topeng",
  "Bebas dokumentasi",
  "Demo membatik/topeng",
  "Kudapan jajanan lawas",
  "Omben jamu-jamu/dawet",
];

const extras = [
  "Tambah makan sego berkat 20rb/ orang",
  "Tambah edukasi cek di paket Hasta Karya",
];

const samplePackages = [
  { id: "dummy-paket-sambang", name: "Sambang Kampung" },
  ...[2, 3, 4, 5].map((number) => ({
    id: `dummy-paket-contoh-${number}`,
    name: `Paket Contoh ${number}`,
  })),
];

async function seedPackages() {
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
    for (const item of samplePackages) {
      const description = JSON.stringify({ features, extras });
      const [result] = await connection.execute(
        `INSERT INTO packages
          (id, name, description, duration, capacity, price, image_url, is_active)
         SELECT ?, ?, ?, NULL, ?, ?, NULL, 1
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM packages WHERE id = ? OR name = ?
         )`,
        [
          item.id,
          item.name,
          description,
          "30 orang",
          1000000,
          item.id,
          item.name,
        ]
      );
      inserted += result.affectedRows;
    }

    console.log(
      `Package seed complete: ${inserted} inserted, ${samplePackages.length - inserted} already present.`
    );
  } finally {
    await connection.end();
  }
}

seedPackages().catch((error) => {
  console.error("Failed to seed package data:", error);
  process.exitCode = 1;
});
