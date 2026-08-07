"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { PermissionMatrixTable, type PermissionItem } from "./_components/permission-matrix-table";
import { ShieldCheck, Plus, Lock, UserCheck, Settings, Loader2 } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionItem[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Role | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [r, p] = await Promise.all([
        apiFetch<Role[]>("/api/v1/roles"),
        apiFetch<PermissionItem[]>("/api/v1/permissions"),
      ]);
      setRoles(r.data);
      setPermissions(p.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openEdit(role: Role) {
    setEdit(role);
    setSelected(new Set(role.permissions.map((p) => p.id)));
    setName(role.name);
    setDescription(role.description ?? "");
  }

  function openCreate() {
    setCreating(true);
    setEdit(null);
    setName("");
    setDescription("");
    setSelected(new Set());
  }

  async function save() {
    if (!edit && !creating) return;
    setSaving(true);
    setError("");
    try {
      if (creating) {
        await apiFetch("/api/v1/roles", {
          method: "POST",
          body: JSON.stringify({ name, description, permissionIds: [...selected] }),
        });
      } else if (edit) {
        await apiFetch(`/api/v1/roles/${edit.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: edit.isSystem ? undefined : name || edit.name,
            description: description || edit.description,
            permissionIds: [...selected],
          }),
        });
      }
      setEdit(null);
      setCreating(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thông tin vai trò");
    } finally {
      setSaving(false);
    }
  }

  const handleTogglePermission = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectMultiple = (ids: string[], select: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (select) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleSetPermissions = (ids: string[]) => {
    setSelected(new Set(ids));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted" />
            <h1 className="text-base font-bold text-foreground">
              Quản lý Vai trò & Ma trận Phân quyền
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Thiết lập vai trò người dùng, phân quyền chi tiết theo Phân hệ (Module), Hành động và Phạm vi.
          </p>
        </div>

        <Button onClick={openCreate} variant="primary" className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          <span>Tạo Vai trò Mới</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-md border border-border bg-white">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải danh sách vai trò...</span>
          </div>
        </div>
      ) : (
        /* Roles Grid Cards */
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-col justify-between rounded-md border border-border bg-white p-4 shadow-2xs transition-colors hover:border-neutral-400"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {role.isSystem ? <Lock className="h-4 w-4 text-muted" /> : <UserCheck className="h-4 w-4 text-muted" />}
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        {role.name}
                      </h2>
                      <span className="inline-block mt-0.5 rounded bg-muted-bg px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {role.isSystem ? "Vai trò hệ thống" : "Tùy chỉnh"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-muted line-clamp-2 min-h-[32px]">
                  {role.description || "Chưa có mô tả chi tiết cho vai trò này."}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                <span className="text-xs text-muted">
                  Đã cấp <strong className="text-foreground">{role.permissions.length}</strong> / {permissions.length} quyền
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(role)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Settings className="h-3.5 w-3.5 text-muted" />
                  <span>Sửa quyền</span>
                </Button>
              </div>
            </div>
          ))}

          {!roles.length ? (
            <div className="col-span-full py-8 text-center text-sm text-muted">
              Chưa có vai trò nào trong hệ thống. Nhấn &quot;Tạo Vai trò Mới&quot; để thiết lập.
            </div>
          ) : null}
        </div>
      )}

      {/* Permission Matrix Modal */}
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
        title={creating ? "Tạo Vai Trò & Phân Quyền" : `Cấu hình Phân quyền: ${edit?.name}`}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEdit(null);
                setCreating(false);
              }}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>
              {saving ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              ) : (
                "Lưu Ma Trận Quyền"
              )}
            </Button>
          </div>
        }
      >
        {/* Role Name & Description Fields */}
        {(creating || (edit && !edit.isSystem)) && (
          <div className="mb-3 grid gap-3 md:grid-cols-2 bg-neutral-50 p-3 rounded-md border border-border">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên Vai Trò <span className="text-danger">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Trưởng phòng Kinh doanh, Kế toán kho..."
                disabled={!!edit?.isSystem}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mô Tả Vai Trò
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn chức năng nhiệm vụ của vai trò..."
                className="w-full text-xs"
              />
            </div>
          </div>
        )}

        {/* Structured Matrix Table Component */}
        <PermissionMatrixTable
          permissions={permissions}
          selectedPermissionIds={selected}
          onTogglePermission={handleTogglePermission}
          onSelectMultiple={handleSelectMultiple}
          onSetPermissions={handleSetPermissions}
          isSystemRole={!!edit?.isSystem}
        />
      </Modal>
    </div>
  );
}
