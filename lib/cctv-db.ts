import { Pool, type QueryResultRow } from "pg";

const globalForCctvDb = globalThis as unknown as { cctvPgPool?: Pool };

export function isCctvConfigured(): boolean {
  return Boolean(process.env.CCTV_DATABASE_URL && process.env.CCTV_DATABASE_URL.trim() !== "");
}

export function getCctvPool(): Pool {
  const connStr = process.env.CCTV_DATABASE_URL;
  if (!connStr || connStr.trim() === "") {
    throw new Error("Chưa cấu hình CCTV_DATABASE_URL trong biến môi trường .env của CRM.");
  }

  if (!globalForCctvDb.cctvPgPool) {
    globalForCctvDb.cctvPgPool = new Pool({
      connectionString: connStr,
      max: 2, // An toàn tuyệt đối: giới hạn tối đa 2 kết nối để không tranh chấp với CCTV production
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000, // Timeout 10 giây tránh treo query
    });
  }

  return globalForCctvDb.cctvPgPool;
}

/**
 * Truy vấn an toàn chỉ đọc (READ-ONLY) sang cơ sở dữ liệu của CCTV
 */
export async function queryCctv<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const pool = getCctvPool();
  return pool.query<T>(text, values);
}
