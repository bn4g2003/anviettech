"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

type Permission = { id: string; module: string; action: string; scope: string };
type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [edit, setEdit] = useState<Role | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const [r, p] = await Promise.all([apiFetch<Role[]>("/api/v1/roles"), apiFetch<Permission[]>("/api/v1/permissions")]);
    setRoles(r.data);
    setPermissions(p.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải"));
  }, []);

  const modules = useMemo(() => [...new Set(permissions.map((p) => p.module))].sort(), [permissions]);

  function openEdit(role: Role) {
    setEdit(role);
    setSelected(new Set(role.permissions.map((p) => p.id)));
  }

  async function save() {
    if (!edit) return;
    try {
      await apiFetch(`/api/v1/roles/${edit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissionIds: [...selected] }),
      });
      setEdit(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu quyền");
    }
  }

  async function create() {
    try {
      await apiFetch("/api/v1/roles", {
        method: "POST",
        body: JSON.stringify({ name, description, permissionIds: [...selected] }),
      });
      setCreating(false);
      setName("");
      setDescription("");
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo vai trò");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vai trò & quyền</h1>
          <p className="mt-1 text-sm text-muted">Bật từng quyền module × action × scope. Có hiệu lực ở request tiếp theo.</p>
        </div>
        <Button
          onClick={() => {
            setCreating(true);
            setSelected(new Set());
          }}
        >
          Tạo vai trò
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <section key={role.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{role.name}</h2>
                <p className="mt-1 text-sm text-muted">{role.description ?? "—"}</p>
                <p className="mt-2 text-xs text-muted">
                  {role.isSystem ? "Vai trò hệ thống" : "Tùy chỉnh"} · {role.permissions.length} quyền
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                Sửa quyền
              </Button>
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={!!edit || creating}
        onOpenChange={(v) => {
          if (!v) {
            setEdit(null);
            setCreating(false);
          }
        }}
        title={creating ? "Tạo vai trò" : `Quyền: ${edit?.name}`}
        size="xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEdit(null);
                setCreating(false);
              }}
            >
              Hủy
            </Button>
            <Button onClick={() => void (creating ? create() : save())}>Lưu</Button>
          </>
        }
      >
        {creating ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              Tên
              <Input className="mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              Mô tả
              <Input className="mt-1 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
          </div>
        ) : null}
        <div className="max-h-[60vh] space-y-4 overflow-auto">
          {modules.map((module) => (
            <div key={module}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{module}</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {permissions
                  .filter((p) => p.module === module)
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                      <span>
                        {p.action} · {p.scope}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
