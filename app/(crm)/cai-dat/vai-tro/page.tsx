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
    <div className="p-5 max-w-7xl mx-auto space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Quản lý Vai trò & Ma trận Phân quyền
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Cấu hình danh mục vai trò người dùng, cấp quyền theo Phân hệ (Module), Hành động và Phạm vi (Tất cả / Cá nhân).
          </p>
        </div>

        <Button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Tạo Vai trò Mới</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Đang tải danh sách vai trò và phân quyền...</span>
          </div>
        </div>
      ) : (
        /* Roles Grid Cards */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      {role.isSystem ? <Lock className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {role.name}
                      </h2>
                      <span
                        className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-semibold ${
                          role.isSystem
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {role.isSystem ? "Vai trò hệ thống" : "Vai trò tùy chỉnh"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                  {role.description || "Chưa có mô tả chi tiết cho vai trò này."}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Đã cấp <strong className="text-blue-600 dark:text-blue-400">{role.permissions.length}</strong> / {permissions.length} quyền
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(role)}
                  className="flex items-center gap-1.5 border-slate-300 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Phân quyền</span>
                </Button>
              </div>
            </div>
          ))}

          {!roles.length ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-500 dark:text-slate-400">
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
            <Button onClick={() => void save()} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
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
        {/* Role Name & Description Fields (if editable) */}
        {(creating || (edit && !edit.isSystem)) && (
          <div className="mb-4 grid gap-3 md:grid-cols-2 bg-slate-50 p-3 rounded-lg border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Vai Trò <span className="text-rose-500">*</span>
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
