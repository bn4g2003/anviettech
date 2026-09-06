import { describe, expect, it } from "vitest";
import { adminSetupSchema, loginSchema, passwordSchema, userSchema } from "./validation";

describe("auth validation", () => {
  it("rejects malformed login credentials", () => {
    expect(() => loginSchema.parse({ email: "not-an-email", password: "" })).toThrow();
  });

  it("requires a strong initial password and role", () => {
    expect(() => userSchema.parse({ fullName: "A", email: "a@example.com", temporaryPassword: "short", roleIds: [] })).toThrow();
    expect(userSchema.parse({ fullName: "Nguyễn Văn A", email: "a@example.com", temporaryPassword: "SafePassword1", roleIds: ["00000000-0000-0000-0000-000000000004"] }).roleIds).toHaveLength(1);
  });

  it("requires at least ten characters for a changed password", () => {
    expect(() => passwordSchema.parse({ currentPassword: "old", nextPassword: "short" })).toThrow();
  });

  it("requires matching passwords for first admin bootstrap", () => {
    expect(() =>
      adminSetupSchema.parse({
        fullName: "Quản trị",
        email: "admin@anviet.local",
        password: "SafePassword1",
        confirmPassword: "Different1",
      }),
    ).toThrow();
    expect(
      adminSetupSchema.parse({
        fullName: "Quản trị AnViet",
        email: "admin@anviet.local",
        password: "SafePassword1",
        confirmPassword: "SafePassword1",
      }).email,
    ).toBe("admin@anviet.local");
  });
});
