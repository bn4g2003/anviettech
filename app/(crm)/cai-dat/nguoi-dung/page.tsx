"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  Pencil,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Lock,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusDot } from "@/components/ui/status-dot";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api-client";
import { relativeTime } from "@/features/shared/utils/date";

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

type Role = {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
};

const COLUMN_DEFS = [
  { id: "user", label: "Người dùng" },
  { id: "email", label: "Email" },
  { id: "roles", label: "Vai trò" },
  { id: "status", label: "Trạng thái" },
  { id: "lastLoginAt", label: "Đăng nhập gần nhất" },
  { id: "actions", label: "Thao tác" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_DEFS.map((c) => c.id),
  );

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    temporaryPassword: "",
    roleIds: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    status: "active" as "active" | "inactive",
    roleIds: [] as string[],
    resetPassword: false,
    newTemporaryPassword: "",
  });

  const [quickPass, setQuickPass] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, r] = await Promise.all([
        apiFetch<User[]>("/api/v1/users"),
        apiFetch<Role[]>("/api/v1/roles"),
      ]);
      setUsers(u.data ?? []);
      setRoles(r.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtering
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false;
      if (roleFilter && !u.roleIds.includes(roleFilter)) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [users, query, roleFilter, statusFilter]);

  // Pagination
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // Open Create
  function openCreateDialog() {
    const defaultRole = roles.find((r) => r.name.toLowerCase().includes("kinh doanh"))?.id || roles[0]?.id || "";
    setCreateForm({
      fullName: "",
      email: "",
      temporaryPassword: "",
      roleIds: defaultRole ? [defaultRole] : [],
    });
    setCreateOpen(true);
  }

  // Handle Create
  async function handleCreate() {
    if (!createForm.fullName.trim()) {
      setError("Vui lòng nhập họ và tên nhân viên");
      return;
    }
    if (!createForm.email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }
    if (createForm.temporaryPassword.length < 10) {
      setError("Mật khẩu tạm thời cần ít nhất 10 ký tự");
      return;
    }
    if (createForm.roleIds.length === 0) {
      setError("Vui lòng chọn ít nhất một vai trò");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setCreateOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản");
    } finally {
      setSaving(false);
    }
  }

  // Open Edit
  function openEditDialog(user: User) {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      status: user.status,
      roleIds: user.roleIds || [],
      resetPassword: false,
      newTemporaryPassword: "",
    });
    setError("");
  }

  // Handle Edit Save
  async function handleSaveEdit() {
    if (!editUser) return;
    if (!editForm.fullName.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }
    if (editForm.roleIds.length === 0) {
      setError("Tài khoản cần ít nhất một vai trò");
      return;
    }
    if (editForm.resetPassword && editForm.newTemporaryPassword.trim().length < 10) {
      setError("Mật khẩu mới cần ít nhất 10 ký tự");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/v1/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          status: editForm.status,
          roleIds: editForm.roleIds,
          temporaryPassword: editForm.resetPassword ? editForm.newTemporaryPassword.trim() : undefined,
        }),
      });
      setEditUser(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật tài khoản");
    } finally {
      setSaving(false);
    }
  }

  // Toggle user active status quickly
  async function handleToggleStatus(user: User) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const label = nextStatus === "active" ? "kích hoạt" : "vô hiệu hóa";
    if (!window.confirm(`Bạn có chắc chắn muốn ${label} tài khoản "${user.fullName}" (${user.email})?`)) {
      return;
    }

    try {
      await apiFetch(`/api/v1/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi trạng thái tài khoản");
    }
  }

  // Quick Reset Password
  async function handleQuickResetPassword() {
    if (!resetPassUser) return;
    if (quickPass.trim().length < 10) {
      setError("Mật khẩu mới cần ít nhất 10 ký tự");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/v1/users/${resetPassUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ temporaryPassword: quickPass.trim() }),
      });
      setResetPassUser(null);
      setQuickPass("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu");
    } finally {
      setSaving(false);
    }
  }

  // Define Columns
  const allColumns: DataGridColumn<User>[] = [
    {
      id: "user",
      header: "Người dùng",
      sortable: true,
      cell: (r) => {
        const name = r.fullName || "Chưa đặt tên";
        const initial = name.slice(0, 1).toUpperCase();
        const isSuper = r.roles.some((role) => role.toLowerCase().includes("super admin"));
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-2xs"
              style={{
                backgroundColor: isSuper ? "#7c3aed" : r.status === "active" ? "#0284c7" : "#94a3b8",
              }}
            >
              {initial}
            </span>
            <div className="min-w-0">
              <span className="block truncate font-medium text-sm text-foreground">{name}</span>
              {isSuper ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Quản trị tối cao
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs text-muted" title={r.email}>
          {r.email}
        </span>
      ),
    },
    {
      id: "roles",
      header: "Vai trò",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.length > 0 ? (
            r.roles.map((role) => (
              <span
                key={role}
                className="inline-block rounded bg-muted-bg px-2 py-0.5 text-xs text-foreground"
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => (
        <StatusDot
          color={r.status === "active" ? "green" : "gray"}
          label={r.status === "active" ? "Hoạt động" : "Đã khóa"}
        />
      ),
    },
    {
      id: "lastLoginAt",
      header: "Đăng nhập gần nhất",
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.lastLoginAt ? relativeTime(r.lastLoginAt) : "Chưa đăng nhập"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-28",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Chỉnh sửa tài khoản"
            onClick={() => openEditDialog(r)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Đặt lại mật khẩu"
            onClick={() => {
              setResetPassUser(r);
              setQuickPass("");
              setError("");
            }}
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${
              r.status === "active"
                ? "text-muted hover:text-danger"
                : "text-muted hover:text-green-600"
            }`}
            title={r.status === "active" ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
            onClick={() => void handleToggleStatus(r)}
          >
            {r.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Filter Bar */}
      <FilterBar
        filters={
          <>
            <Input
              className="w-56"
              placeholder="Tìm theo tên, email..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              className="w-44"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Vai trò</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
            <Select
              className="w-36"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </Select>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="icon" title="Làm mới" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <ColumnToggle
              columns={COLUMN_DEFS}
              visibleIds={visibleColumns}
              onChange={setVisibleColumns}
            />
            <Button variant="primary" size="sm" onClick={openCreateDialog}>
              <Plus className="h-3.5 w-3.5" />
              Tạo tài khoản
            </Button>
          </>
        }
      />

      {error ? (
        <div className="border-b border-danger/20 bg-danger/10 px-4 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {/* Main DataGrid Table */}
      <DataGrid
        columns={columns}
        rows={pageRows}
        loading={loading}
        empty={
          <EmptyState
            icon={Users}
            title="Không tìm thấy tài khoản"
            description="Thử thay đổi điều kiện tìm kiếm hoặc tạo tài khoản mới."
            action={
              <Button variant="primary" size="sm" onClick={openCreateDialog}>
                <Plus className="h-3.5 w-3.5" />
                Tạo tài khoản mới
              </Button>
            }
          />
        }
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredUsers.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* MODAL: SỬA TÀI KHOẢN (ĐẦY ĐỦ THÔNG TIN) */}
      <Modal
        open={Boolean(editUser)}
        onOpenChange={(open) => !open && setEditUser(null)}
        title="Chỉnh sửa tài khoản"
        size="lg"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setEditUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" disabled={saving} onClick={() => void handleSaveEdit()}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        {editUser ? (
          <div className="space-y-4">
            {/* Header info badge */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {editUser.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted" />
                  <span>{editUser.email}</span>
                  <span className="text-[10px] text-muted">(Cố định)</span>
                </div>
                <div className="mt-0.5 text-muted">
                  Đăng nhập gần nhất: {editUser.lastLoginAt ? new Date(editUser.lastLoginAt).toLocaleString("vi-VN") : "Chưa từng"}
                </div>
              </div>
            </div>

            {/* Field: Họ và tên */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Họ và tên <span className="text-danger">*</span>
              </label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            {/* Field: Trạng thái */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Trạng thái tài khoản
              </label>
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
              >
                <option value="active">Đang hoạt động (Cho phép đăng nhập)</option>
                <option value="inactive">Đã khóa / Vô hiệu hóa (Chặn đăng nhập)</option>
              </Select>
            </div>

            {/* Field: Phân quyền vai trò (Multi-select) */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Vai trò truy cập <span className="text-danger">*</span> (Có thể chọn nhiều vai trò)
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 max-h-48 overflow-auto">
                {roles.map((role) => {
                  const checked = editForm.roleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex items-start gap-2 rounded-md p-2 text-xs cursor-pointer transition-colors ${
                        checked ? "bg-primary/5 border border-primary/20" : "hover:bg-muted-bg"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({ ...editForm, roleIds: [...editForm.roleIds, role.id] });
                          } else {
                            setEditForm({ ...editForm, roleIds: editForm.roleIds.filter((id) => id !== role.id) });
                          }
                        }}
                        className="mt-0.5 rounded border-border"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-foreground block">{role.name}</span>
                        {role.description ? (
                          <span className="text-[10px] text-muted line-clamp-1">{role.description}</span>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section: Đặt lại mật khẩu tạm */}
            <div className="rounded-lg border border-border p-3 bg-surface/50">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.resetPassword}
                  onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.checked })}
                  className="rounded border-border"
                />
                <span>Đặt lại mật khẩu mới cho tài khoản này</span>
              </label>

              {editForm.resetPassword ? (
                <div className="mt-3 space-y-2">
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu tạm thời mới (ít nhất 10 ký tự)..."
                    value={editForm.newTemporaryPassword}
                    onChange={(e) => setEditForm({ ...editForm, newTemporaryPassword: e.target.value })}
                  />
                  <p className="text-[11px] text-muted flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần tới.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL: TẠO TÀI KHOẢN MỚI */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo tài khoản người dùng"
        size="lg"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" disabled={saving} onClick={() => void handleCreate()}>
              {saving ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-foreground mb-1">
                Họ và tên <span className="text-danger">*</span>
              </label>
              <Input
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-foreground mb-1">
                Email đăng nhập <span className="text-danger">*</span>
              </label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="nhanvien@anviet.vn"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Mật khẩu khởi tạo <span className="text-danger">*</span>
            </label>
            <Input
              type="password"
              value={createForm.temporaryPassword}
              onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
              placeholder="Nhập mật khẩu tạm (tối thiểu 10 ký tự)..."
            />
            <p className="mt-1 text-[11px] text-muted">
              Nhân viên bắt buộc phải đổi mật khẩu này khi đăng nhập lần đầu tiên.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Phân quyền vai trò <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 max-h-48 overflow-auto">
              {roles.map((role) => {
                const checked = createForm.roleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={`flex items-start gap-2 rounded-md p-2 text-xs cursor-pointer transition-colors ${
                      checked ? "bg-primary/5 border border-primary/20" : "hover:bg-muted-bg"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCreateForm({ ...createForm, roleIds: [...createForm.roleIds, role.id] });
                        } else {
                          setCreateForm({ ...createForm, roleIds: createForm.roleIds.filter((id) => id !== role.id) });
                        }
                      }}
                      className="mt-0.5 rounded border-border"
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block">{role.name}</span>
                      {role.description ? (
                        <span className="text-[10px] text-muted line-clamp-1">{role.description}</span>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: ĐẶT LẠI MẬT KHẨU NHANH */}
      <Modal
        open={Boolean(resetPassUser)}
        onOpenChange={(open) => !open && setResetPassUser(null)}
        title="Đặt lại mật khẩu tài khoản"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setResetPassUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" disabled={saving} onClick={() => void handleQuickResetPassword()}>
              {saving ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </>
        }
      >
        {resetPassUser ? (
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Thiết lập mật khẩu tạm thời mới cho tài khoản{" "}
              <strong className="text-foreground">{resetPassUser.fullName}</strong> ({resetPassUser.email}).
            </p>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Mật khẩu mới (Tối thiểu 10 ký tự) <span className="text-danger">*</span>
              </label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={quickPass}
                onChange={(e) => setQuickPass(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted">
              Tài khoản sẽ bị đăng xuất khỏi tất cả thiết bị hiện tại và bắt buộc đổi mật khẩu này khi đăng nhập lại.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
