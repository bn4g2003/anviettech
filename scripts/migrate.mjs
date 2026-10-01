import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Lỗi: Không tìm thấy DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function run() {
  try {
    const migrationsDir = path.join(process.cwd(), "database", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("Không tìm thấy thư mục migrations.");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`Tìm thấy ${files.length} file migration trong database/migrations/`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`-> Đang áp dụng migration: ${file}...`);
      await pool.query(sql);
    }

    console.log("✅ Toàn bộ database migrations đã được áp dụng thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi thực thi migration:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
