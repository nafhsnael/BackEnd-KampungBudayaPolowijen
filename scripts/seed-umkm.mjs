import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const sampleUmkm = [
  {
    name: "Kriya Topeng Malang",
    category: "Kriya",
    description: "Pembuatan kerajinan Topeng Malangan.",
    price: 150000,
  },
  {
    name: "Kriya Batik Malang",
    category: "Kriya",
    description: "Produksi batik khas KBP.",
    price: 125000,
  },
  {
    name: "Kerajinan KBP",
    category: "Kriya",
    description: "Berbagai kerajinan kreatif.",
    price: 85000,
  },
  {
    name: "Sego Berkat",
    category: "Kuliner",
    description: "Makanan tradisional.",
    price: 25000,
  },
  {
    name: "Tumpeng",
    category: "Kuliner",
    description: "Produk kuliner dan tradisional.",
    price: 350000,
  },
  {
    name: "Dawet",
    category: "Minuman",
    description: "Minuman tradisional.",
    price: 10000,
  },
  {
    name: "Wedang",
    category: "Minuman",
    description: "Minuman tradisional.",
    price: 12000,
  },
];

async function seedUmkm() {
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
    for (const item of sampleUmkm) {
      const [result] = await connection.execute(
        `INSERT INTO umkm (id, name, category, description, price, image_url)
         SELECT UUID(), ?, ?, ?, ?, NULL
         FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM umkm WHERE name = ?)`,
        [
          item.name,
          item.category,
          item.description,
          item.price,
          item.name,
        ]
      );
      inserted += result.affectedRows;
    }

    console.log(
      `UMKM seed complete: ${inserted} inserted, ${sampleUmkm.length - inserted} already present.`
    );
  } finally {
    await connection.end();
  }
}

seedUmkm().catch((error) => {
  console.error("Failed to seed UMKM data:", error);
  process.exitCode = 1;
});
