"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";

type User = {
  id: string;
  fullName: string;
  email: string;
  status: "active" | "inactive";
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  roles: string[];
  roleIds: string[];
};
type Role = { id: string; name: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    temporaryPassword: "",
    roleIds: ["00000000-0000-0000-0000-000000000004"],
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [u, r] = await Promise.all([fetch("/api/v1/users"), fetch("/api/v1/roles")]);
      if (!u.ok) {
        setError("Không thể tải tài khoản");
        return;
      }
      setUsers((await u.json()).data);
      if (r.ok) setRoles((await r.json()).data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    try {
      await apiFetch("/api/v1/users", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      setForm({ fullName: "", email: "", temporaryPassword: "", roleIds: ["00000000-0000-0000-0000-000000000004"] });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản");
    }
  }

  async function saveEdit() {
    if (!editId) return;
    try {
      await apiFetch(`/api/v1/users/${editId}`, {
        method: "PATCH",
        body: JSON.stringify({ fullName: form.fullName, roleIds: form.roleIds }),
      });
      setEditId(null);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật");
    }
  }

  async function toggleStatus(user: User) {
    try {
      await apiFetch(`/api/v1/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: user.status === "active" ? "inactive" : "active" }),
      });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi trạng thái");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Tạo tài khoản, đổi vai trò và vô hiệu hóa truy cập.</p>
        <Button onClick={() => setOpen(true)}>Tạo tài khoản</Button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 overflow-auto rounded-lg border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3">Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Đăng nhập gần nhất</th>
              <th>Trạng thái</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted">
                  Đang tải...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.roles.join(", ") || "—"}</td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "—"}</td>
                  <td>{user.status}</td>
                  <td className="space-x-2 p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditId(user.id);
                        setForm({
                          fullName: user.fullName,
                          email: user.email,
                          temporaryPassword: "",
                          roleIds: user.roleIds?.length ? user.roleIds : [],
                        });
                      }}
                    >
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void toggleStatus(user)}>
                      {user.status === "active" ? "Vô hiệu" : "Kích hoạt"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && !users.length && !error ? (
          <EmptyState title="Chưa có tài khoản" description="Tạo tài khoản để mời nhân viên vào CRM." />
        ) : null}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tạo tài khoản"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()}>Tạo</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            Họ tên
            <Input className="mt-1 w-full" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label className="block text-sm">
            Email
            <Input className="mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block text-sm">
            Mật khẩu tạm
            <Input
              className="mt-1 w-full"
              type="password"
              value={form.temporaryPassword}
              onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Vai trò
            <Select
              className="mt-1 w-full"
              value={form.roleIds[0] ?? ""}
              onChange={(e) => setForm({ ...form, roleIds: [e.target.value] })}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Modal>

      <Modal
        open={!!editId}
        onOpenChange={(v) => !v && setEditId(null)}
        title="Sửa tài khoản"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditId(null)}>
              Hủy
            </Button>
            <Button onClick={() => void saveEdit()}>Lưu</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            Họ tên
            <Input className="mt-1 w-full" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label className="block text-sm">
            Vai trò
            <Select
              className="mt-1 w-full"
              value={form.roleIds[0] ?? ""}
              onChange={(e) => setForm({ ...form, roleIds: [e.target.value] })}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
