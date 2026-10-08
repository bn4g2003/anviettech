import fs from "node:fs";
import { Pool } from "pg";
import argon2 from "argon2";

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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEV_EMAIL = process.env.DEV_EMAIL || "dev@anviet.local";
const DEV_PASSWORD = process.env.DEV_PASSWORD || "Dev@12345678";
const DEV_FULL_NAME = "Developer Admin";

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check roles
    const superAdminRole = await client.query("SELECT id, name FROM roles WHERE name = 'Super admin'");
    const adminRole = await client.query("SELECT id, name FROM roles WHERE name = 'Admin'");

    if (superAdminRole.rows.length === 0) {
      throw new Error("Không tìm thấy vai trò 'Super admin' trong hệ thống.");
    }

    const superAdminId = superAdminRole.rows[0].id;
    const adminId = adminRole.rows.length > 0 ? adminRole.rows[0].id : null;

    const passwordHash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });

    // Upsert user
    const existing = await client.query("SELECT id, email FROM users WHERE lower(email) = lower($1)", [DEV_EMAIL]);

    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`Đang cập nhật tài khoản dev hiện có (${DEV_EMAIL}, id: ${userId})...`);
      await client.query(
        `UPDATE users
         SET full_name = $1,
             password_hash = $2,
             status = 'active',
             must_change_password = false,
             is_hidden = true,
             deleted_at = NULL,
             updated_at = now()
         WHERE id = $3`,
        [DEV_FULL_NAME, passwordHash, userId]
      );
    } else {
      console.log(`Đang tạo tài khoản dev mới (${DEV_EMAIL})...`);
      const insertResult = await client.query(
        `INSERT INTO users (full_name, email, password_hash, status, must_change_password, is_hidden)
         VALUES ($1, $2, $3, 'active', false, true)
         RETURNING id`,
        [DEV_FULL_NAME, DEV_EMAIL, passwordHash]
      );
      userId = insertResult.rows[0].id;
    }

    // Assign roles: Super admin and Admin
    const roleIdsToAssign = [superAdminId];
    if (adminId) roleIdsToAssign.push(adminId);

    for (const rId of roleIdsToAssign) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId, rId]
      );
    }

    await client.query("COMMIT");

    console.log("\n==========================================");
    console.log("✅ TẠO TÀI KHOẢN DEV THÀNH CÔNG!");
    console.log("------------------------------------------");
    console.log(`- Họ và tên : ${DEV_FULL_NAME}`);
    console.log(`- Email     : ${DEV_EMAIL}`);
    console.log(`- Mật khẩu  : ${DEV_PASSWORD}`);
    console.log(`- Vai trò   : Super admin, Admin (Full quyền)`);
    console.log(`- Trạng thái: active (Hoạt động)`);
    console.log(`- Bắt buộc đổi MK: false (Có thể đăng nhập dùng ngay)`);
    console.log("==========================================\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi khi tạo tài khoản dev:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
