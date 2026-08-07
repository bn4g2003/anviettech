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
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Role | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [r, p] = await Promise.all([
        apiFetch<Role[]>("/api/v1/roles"),
        apiFetch<Permission[]>("/api/v1/permissions"),
      ]);
      setRoles(r.data);
      setPermissions(p.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
        body: JSON.stringify({
          name: edit.isSystem ? undefined : name || edit.name,
          description: description || edit.description,
          permissionIds: [...selected],
        }),
      });
      setEdit(null);
      setName("");
      setDescription("");
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

  function openCreate() {
    setCreating(true);
    setEdit(null);
    setName("");
    setDescription("");
    setSelected(new Set());
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Tạo vai trò và bật từng quyền (module × action × scope). Có hiệu lực ở request tiếp theo.
        </p>
        <Button onClick={openCreate}>Tạo vai trò</Button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {loading ? (
        <p className="mt-8 text-center text-sm text-muted">Đang tải vai trò...</p>
      ) : (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setName(role.name);
                    setDescription(role.description ?? "");
                    openEdit(role);
                  }}
                >
                  Sửa quyền
                </Button>
              </div>
            </section>
          ))}
          {!roles.length ? (
            <p className="text-sm text-muted md:col-span-2">Chưa có vai trò. Tạo vai trò mới để phân quyền.</p>
          ) : null}
        </div>
      )}

      <Modal
        open={!!edit || creating}
        onOpenChange={(v) => {
          if (!v) {
            setEdit(null);
            setCreating(false);
            setName("");
            setDescription("");
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
        {creating || (edit && !edit.isSystem) ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              Tên
              <Input
                className="mt-1 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!edit?.isSystem}
              />
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
