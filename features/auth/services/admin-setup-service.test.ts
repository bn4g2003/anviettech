import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/cctv-db", () => ({
  isCctvConfigured: vi.fn(() => true),
}));
vi.mock("argon2", () => ({
  default: { hash: vi.fn(async () => "hashed-password") },
}));

import { query, transaction } from "@/lib/db";
import { isCctvConfigured } from "@/lib/cctv-db";
import { ApiError } from "@/lib/api";
import { bootstrapFirstAdmin, getAdminSetupStatus, hasAdminAccount } from "./admin-setup-service";

const queryMock = vi.mocked(query);
const transactionMock = vi.mocked(transaction);
const cctvMock = vi.mocked(isCctvConfigured);

describe("admin setup status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cctvMock.mockReturnValue(true);
  });

  it("is available only when no admin account exists", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ exists: false }], rowCount: 1 } as never);
    await expect(hasAdminAccount()).resolves.toBe(false);
    queryMock.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 } as never);
    await expect(getAdminSetupStatus()).resolves.toEqual({ available: false, cctvConfigured: true });
  });
});

describe("bootstrapFirstAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to create a second admin", async () => {
    transactionMock.mockImplementation(async (callback) => {
      const client = {
        query: vi
          .fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }),
      };
      return callback(client as never);
    });

    await expect(
      bootstrapFirstAdmin({ fullName: "Quản trị", email: "admin@anviet.local", password: "SafePassword1" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("creates the first Super admin when the system is empty", async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ exists: false }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: "00000000-0000-0000-0000-000000000001" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: "user-1" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    transactionMock.mockImplementation(async (callback) => callback({ query: clientQuery } as never));

    await expect(
      bootstrapFirstAdmin({ fullName: "Quản trị AnViet", email: "admin@anviet.local", password: "SafePassword1" }),
    ).resolves.toEqual({ id: "user-1" });

    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["Quản trị AnViet", "admin@anviet.local", "hashed-password"],
    );
  });
});
