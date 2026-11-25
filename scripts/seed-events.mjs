import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const sampleEvents = [
  {
    id: "dummy-tari-topeng",
    name: "Tari Topeng",
    description:
      "Nikmati pertunjukan tari topeng khas Malang yang menghidupkan kisah dan tradisi Kampung Budaya Polowijen.",
    eventDate: "2026-12-31",
    capacity: "120 Kursi",
    price: "Rp. 50.000 / Orang",
    status: "Upcoming",
    posterUrl: "https://0p5ckc0e2ixb1mde.public.blob.vercel-storage.com/static-assets/images/taritopeng.png",
  },
  {
    id: "dummy-festival-batik",
    name: "Festival Batik Polowijen",
    description:
      "Perayaan karya batik lokal, pertunjukan seni, dan kreativitas warga Polowijen.",
    eventDate: "2026-02-28",
    capacity: "120 Kursi",
    price: "Rp. 50.000 / Orang",
    status: "Completed",
    posterUrl: "https://0p5ckc0e2ixb1mde.public.blob.vercel-storage.com/static-assets/images/batik.jpeg",
  },
  {
    id: "dummy-megengan-nyadran",
    name: "Megengan & Nyadran",
    description:
      "Tradisi kebersamaan warga untuk menyambut bulan suci dengan doa dan sajian budaya.",
    eventDate: "2026-03-01",
    capacity: "120 Kursi",
    price: "Rp. 50.000 / Orang",
    status: "Completed",
    posterUrl: "https://0p5ckc0e2ixb1mde.public.blob.vercel-storage.com/static-assets/images/nyadran.png",
  },
];

async function seedEvents() {
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
    for (const event of sampleEvents) {
      const [result] = await connection.execute(
        `INSERT INTO events
          (id, name, description, event_date, capacity, price, poster_url, status)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
         FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM events WHERE id = ? OR name = ?
         )`,
        [
          event.id,
          event.name,
          event.description,
          event.eventDate,
          event.capacity,
          event.price,
          event.posterUrl,
          event.status,
          event.id,
          event.name,
        ]
      );
      inserted += result.affectedRows;
    }

    for (const event of sampleEvents) {
      await connection.execute(
        "UPDATE events SET poster_url = ? WHERE name = ? AND (poster_url IS NULL OR poster_url = '')",
        [event.posterUrl, event.name]
      );
    }

    console.log(
      `Event seed complete: ${inserted} inserted, ${sampleEvents.length - inserted} already present.`
    );
  } finally {
    await connection.end();
  }
}

seedEvents().catch((error) => {
  console.error("Failed to seed event data:", error);
  process.exitCode = 1;
});
