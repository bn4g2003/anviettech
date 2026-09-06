import { z } from "zod";

export const loginSchema = z.object({ email: z.string().trim().email("Email không hợp lệ"), password: z.string().min(1, "Nhập mật khẩu") });
export const adminSetupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự").max(160),
    email: z.string().trim().email("Email không hợp lệ"),
    password: z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự"),
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });
export const passwordSchema = z.object({ currentPassword: z.string().min(1), nextPassword: z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự") });
const databaseUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID không hợp lệ");
export const userSchema = z.object({ fullName: z.string().trim().min(2).max(160), email: z.string().trim().email(), temporaryPassword: z.string().min(10), roleIds: z.array(databaseUuid).min(1) });
export const userUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  roleIds: z.array(databaseUuid).min(1).optional(),
  temporaryPassword: z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});
export const userStatusSchema = z.object({ status: z.enum(["active", "inactive"]) });
export const roleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(1000).optional(),
  permissionIds: z.array(databaseUuid).default([]),
});
export const roleUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  permissionIds: z.array(databaseUuid).optional(),
});
