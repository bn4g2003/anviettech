"use client";

import { useId, useMemo, useState } from "react";
import {
  Shield,
  ShieldCheck,
  Briefcase,
  Users,
  Target,
  FileText,
  ShoppingBag,
  Scroll,
  Receipt,
  Wallet,
  Boxes,
  PackageSearch,
  CheckSquare,
  BarChart3,
  BadgePercent,
  Megaphone,
  FolderGit2,
  UserCog,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type PermissionItem = {
  id: string;
  module: string;
  action: string;
  scope: string;
};

interface PermissionMatrixTableProps {
  permissions: PermissionItem[];
  selectedPermissionIds: Set<string>;
  onTogglePermission: (permissionId: string) => void;
  onSelectMultiple: (permissionIds: string[], select: boolean) => void;
  onSetPermissions: (permissionIds: string[]) => void;
  isSystemRole?: boolean;
}

type ModuleMeta = {
  key: string;
  title: string;
  icon: React.ReactNode;
  note: string;
};

const MODULE_DEFINITIONS: Record<string, Omit<ModuleMeta, "key">> = {
  leads: {
    title: "Khách hàng Tiềm năng (Leads)",
    icon: <Target className="h-3.5 w-3.5 text-muted" />,
    note: "Tiếp nhận, phân loại và chăm sóc manh mối kinh doanh ban đầu",
  },
  customers: {
    title: "Danh sách Khách hàng",
    icon: <Building2Icon className="h-3.5 w-3.5 text-muted" />,
    note: "Hồ sơ công ty khách hàng, lịch sử giao dịch & liên hệ",
  },
  contacts: {
    title: "Người liên hệ (Contacts)",
    icon: <Users className="h-3.5 w-3.5 text-muted" />,
    note: "Danh bạ người đại diện, chức vụ & email/SĐT trực thuộc khách hàng",
  },
  deals: {
    title: "Cơ hội kinh doanh (Deals)",
    icon: <Briefcase className="h-3.5 w-3.5 text-muted" />,
    note: "Đường ống bán hàng (Pipeline), giai đoạn & xác suất thành công",
  },
  quotes: {
    title: "Báo giá (Quotes)",
    icon: <FileText className="h-3.5 w-3.5 text-muted" />,
    note: "Soạn thảo, gửi phê duyệt và phát hành báo giá cho khách hàng",
  },
  orders: {
    title: "Đơn hàng & Bán hàng (Orders)",
    icon: <ShoppingBag className="h-3.5 w-3.5 text-muted" />,
    note: "Quản lý đơn đặt hàng, xuất bán hàng hóa & giá trị bán",
  },
  contracts: {
    title: "Hợp đồng kinh tế (Contracts)",
    icon: <Scroll className="h-3.5 w-3.5 text-muted" />,
    note: "Quản lý hợp đồng thương mại, giá trị, ngày hiệu lực & điều khoản",
  },
  invoices: {
    title: "Hóa đơn & Thu nợ (Invoices)",
    icon: <Receipt className="h-3.5 w-3.5 text-muted" />,
    note: "Phát hành hóa đơn tài chính, ghi nhận thanh toán & nợ phải thu",
  },
  payments: {
    title: "Phiếu thu & Sổ quỹ (Payments)",
    icon: <Wallet className="h-3.5 w-3.5 text-muted" />,
    note: "Ghi nhận phiếu thu/chi tiền mặt & chuyển khoản ngân hàng",
  },
  operating_expenses: {
    title: "Chi phí vận hành (Expenses)",
    icon: <BadgePercent className="h-3.5 w-3.5 text-muted" />,
    note: "Quản lý chi phí lương, thuê VP, bảo hiểm, thuế & chi phí phòng KT",
  },
  inventory: {
    title: "Kho & Tồn kho (Inventory)",
    icon: <Boxes className="h-3.5 w-3.5 text-muted" />,
    note: "Theo dõi tồn kho theo kho bãi, định mức tồn tối thiểu",
  },
  products: {
    title: "Danh mục Sản phẩm & Vật tư",
    icon: <PackageSearch className="h-3.5 w-3.5 text-muted" />,
    note: "Mã SKU, đơn giá bán, giá vốn & VAT vật tư thiết bị",
  },
  stock_moves: {
    title: "Phiếu Nhập / Xuất / Chuyển kho",
    icon: <Boxes className="h-3.5 w-3.5 text-muted" />,
    note: "Tạo và ghi sổ các phiếu nhập kho, xuất kho thi công & chuyển kho",
  },
  warehouses: {
    title: "Danh sách Kho bãi (Warehouses)",
    icon: <Boxes className="h-3.5 w-3.5 text-muted" />,
    note: "Khai báo địa điểm kho bãi & kho chứa phụ tùng",
  },
  tasks: {
    title: "Công việc & Giao kỹ thuật (Tasks)",
    icon: <CheckSquare className="h-3.5 w-3.5 text-muted" />,
    note: "Giao việc, nhắc hẹn & phân công kỹ thuật thi công/sửa chữa",
  },
  analytics: {
    title: "Báo cáo & Phân tích HĐKD",
    icon: <BarChart3 className="h-3.5 w-3.5 text-muted" />,
    note: "Bảng báo cáo tài chính 12 tháng, lợi nhuận gộp & phân tích HĐKD",
  },
  campaigns: {
    title: "Chiến dịch Marketing (Campaigns)",
    icon: <Megaphone className="h-3.5 w-3.5 text-muted" />,
    note: "Theo dõi ngân sách chiến dịch & hiệu quả chuyển đổi",
  },
  documents: {
    title: "Tài liệu & Chứng từ đính kèm",
    icon: <FolderGit2 className="h-3.5 w-3.5 text-muted" />,
    note: "Tải lên, quản lý file đính kèm, hợp đồng scan & bản vẽ",
  },
  users: {
    title: "Quản lý Người dùng (Users)",
    icon: <UserCog className="h-3.5 w-3.5 text-muted" />,
    note: "Tạo tài khoản nhân viên, đổi mật khẩu & kích hoạt tài khoản",
  },
  roles: {
    title: "Vai trò & Phân quyền (Roles)",
    icon: <Lock className="h-3.5 w-3.5 text-muted" />,
    note: "Thiết lập các nhóm vai trò và phân quyền ma trận",
  },
  permissions: {
    title: "Mã quyền Hệ thống (Permissions)",
    icon: <ShieldCheck className="h-3.5 w-3.5 text-muted" />,
    note: "Danh mục mã quyền chi tiết hệ thống",
  },
};

function Building2Icon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

export function PermissionMatrixTable({
  permissions,
  selectedPermissionIds,
  onSelectMultiple,
  onSetPermissions,
}: PermissionMatrixTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputId = useId();

  // Group permissions by module
  const moduleMap = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of permissions) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, [permissions]);

  // List of distinct module names
  const modulesList = useMemo(() => {
    return Object.keys(moduleMap).sort((a, b) => {
      const defA = MODULE_DEFINITIONS[a]?.title || a;
      const defB = MODULE_DEFINITIONS[b]?.title || b;
      return defA.localeCompare(defB);
    });
  }, [moduleMap]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return modulesList;
    const term = searchTerm.toLowerCase();
    return modulesList.filter((mKey) => {
      const def = MODULE_DEFINITIONS[mKey];
      const title = def?.title?.toLowerCase() || mKey.toLowerCase();
      const note = def?.note?.toLowerCase() || "";
      return title.includes(term) || note.includes(term) || mKey.toLowerCase().includes(term);
    });
  }, [modulesList, searchTerm]);

  // Helper to check view scope status for a module
  const getViewScopeStatus = (moduleKey: string): "all" | "own" | "none" => {
    const modPerms = moduleMap[moduleKey] || [];
    const viewAll = modPerms.find((p) => p.action === "view" && p.scope === "all");
    const viewOwn = modPerms.find((p) => p.action === "view" && p.scope === "own");

    if (viewAll && selectedPermissionIds.has(viewAll.id)) return "all";
    if (viewOwn && selectedPermissionIds.has(viewOwn.id)) return "own";
    return "none";
  };

  // Set View Scope for a module
  const handleSetViewScope = (moduleKey: string, targetScope: "all" | "own" | "none") => {
    const modPerms = moduleMap[moduleKey] || [];
    const viewPerms = modPerms.filter((p) => p.action === "view");
    const toRemove = viewPerms.map((p) => p.id);

    const viewAll = modPerms.find((p) => p.action === "view" && p.scope === "all");
    const viewOwn = modPerms.find((p) => p.action === "view" && p.scope === "own");

    const newSet = new Set(selectedPermissionIds);
    toRemove.forEach((id) => newSet.delete(id));

    if (targetScope === "all" && viewAll) {
      newSet.add(viewAll.id);
    } else if (targetScope === "own" && viewOwn) {
      newSet.add(viewOwn.id);
    } else if (targetScope === "all" && !viewAll && viewOwn) {
      newSet.add(viewOwn.id);
    }

    onSetPermissions(Array.from(newSet));
  };

  // Helper to check action checkbox status
  const isActionEnabled = (moduleKey: string, actionName: string): boolean => {
    const modPerms = moduleMap[moduleKey] || [];
    const actionPerms = modPerms.filter((p) => p.action === actionName);
    return actionPerms.some((p) => selectedPermissionIds.has(p.id));
  };

  // Toggle action
  const handleToggleAction = (moduleKey: string, actionName: string) => {
    const modPerms = moduleMap[moduleKey] || [];
    const actionPerms = modPerms.filter((p) => p.action === actionName);
    if (!actionPerms.length) return;

    const anySelected = actionPerms.some((p) => selectedPermissionIds.has(p.id));
    const idsToToggle = actionPerms.map((p) => p.id);

    onSelectMultiple(idsToToggle, !anySelected);
  };

  // Toggle all permissions for a specific module
  const handleToggleAllModule = (moduleKey: string) => {
    const modPerms = moduleMap[moduleKey] || [];
    const ids = modPerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissionIds.has(id));

    onSelectMultiple(ids, !allSelected);
  };

  // Quick Presets
  const applyPresetAdmin = () => {
    onSetPermissions(permissions.map((p) => p.id));
  };

  const applyPresetSalesManager = () => {
    const managerModules = ["leads", "customers", "contacts", "deals", "quotes", "orders", "contracts", "tasks", "analytics"];
    const ids = permissions
      .filter((p) => managerModules.includes(p.module) && (p.scope === "all" || p.action !== "view"))
      .map((p) => p.id);
    onSetPermissions(ids);
  };

  const applyPresetSalesRep = () => {
    const repModules = ["leads", "customers", "contacts", "deals", "quotes", "tasks"];
    const ids = permissions
      .filter((p) => repModules.includes(p.module) && (p.scope === "own" || ["create", "update"].includes(p.action)))
      .map((p) => p.id);
    onSetPermissions(ids);
  };

  const applyPresetAccountant = () => {
    const accModules = ["invoices", "payments", "contracts", "operating_expenses", "analytics", "customers"];
    const ids = permissions
      .filter((p) => accModules.includes(p.module) && p.scope === "all")
      .map((p) => p.id);
    onSetPermissions(ids);
  };

  const applyPresetWarehouse = () => {
    const whModules = ["inventory", "products", "stock_moves", "warehouses", "orders"];
    const ids = permissions
      .filter((p) => whModules.includes(p.module))
      .map((p) => p.id);
    onSetPermissions(ids);
  };

  const clearAllPermissions = () => {
    onSetPermissions([]);
  };

  return (
    <div className="space-y-3">
      {/* Top Presets & Helper Notes */}
      <div className="rounded-md border border-border bg-neutral-50/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-muted" />
            <span>Mẫu vai trò có sẵn (Presets):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetAdmin}
              className="h-7 text-xs bg-white border-border text-foreground hover:bg-neutral-100"
            >
              Quản trị (Admin)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetSalesManager}
              className="h-7 text-xs bg-white border-border text-foreground hover:bg-neutral-100"
            >
              Trưởng phòng Kinh doanh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetSalesRep}
              className="h-7 text-xs bg-white border-border text-foreground hover:bg-neutral-100"
            >
              Nhân viên Kinh doanh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetAccountant}
              className="h-7 text-xs bg-white border-border text-foreground hover:bg-neutral-100"
            >
              Kế toán / Tài chính
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyPresetWarehouse}
              className="h-7 text-xs bg-white border-border text-foreground hover:bg-neutral-100"
            >
              Quản lý Kho
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllPermissions}
              className="h-7 text-xs bg-white border-border text-danger hover:bg-rose-50"
            >
              Tắt tất cả
            </Button>
          </div>
        </div>

        {/* Vietnamese Scope Notes Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-neutral-800 text-[10px] font-medium text-white">Tất cả (All)</span>
            <span>Xem & thao tác toàn bộ dữ liệu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-neutral-500 text-[10px] font-medium text-white">Cá nhân (Own)</span>
            <span>Chỉ xem/thao tác dữ liệu tự tạo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-neutral-300 text-[10px] font-medium text-neutral-800">Tắt (None)</span>
            <span>Ẩn khỏi menu & chặn API</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <label htmlFor={searchInputId} className="sr-only">Tìm phân hệ</label>
          <input
            id={searchInputId}
            type="text"
            placeholder="Tìm theo tên phân hệ hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="text-xs text-muted font-medium">
          Đã chọn: <span className="font-bold text-foreground">{selectedPermissionIds.size}</span> / {permissions.length} quyền
        </div>
      </div>

      {/* Structured Matrix Table */}
      <div className="rounded-md border border-border bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[50vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-neutral-100 font-semibold text-foreground">
                <th scope="col" className="px-3.5 py-2.5 min-w-[240px]">Phân hệ & Chức năng</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[160px]">Quyền Xem (View)</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[80px]">Tạo mới</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[80px]">Chỉnh sửa</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[80px]">Xóa</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[120px]">Thao tác đặc biệt</th>
                <th scope="col" className="px-2 py-2.5 text-center min-w-[90px]">Chọn nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredModules.map((mKey) => {
                const def = MODULE_DEFINITIONS[mKey] || {
                  title: mKey,
                  icon: <Shield className="h-3.5 w-3.5 text-muted" />,
                  note: `Phân hệ mã ${mKey}`,
                };

                const modPerms = moduleMap[mKey] || [];
                const viewStatus = getViewScopeStatus(mKey);
                const hasCreate = modPerms.some((p) => p.action === "create");
                const hasUpdate = modPerms.some((p) => p.action === "update");
                const hasDelete = modPerms.some((p) => p.action === "delete");

                const isCreateChecked = isActionEnabled(mKey, "create");
                const isUpdateChecked = isActionEnabled(mKey, "update");
                const isDeleteChecked = isActionEnabled(mKey, "delete");

                const specialActions = modPerms.filter(
                  (p) => !["view", "create", "update", "delete"].includes(p.action)
                );
                const uniqueSpecialActionNames = Array.from(new Set(specialActions.map((p) => p.action)));
                const allModSelected = modPerms.every((p) => selectedPermissionIds.has(p.id));

                return (
                  <tr
                    key={mKey}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    {/* Module Title & Vietnamese Note */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0 text-muted">{def.icon}</div>
                        <div>
                          <div className="font-semibold text-foreground text-xs">
                            {def.title}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {def.note}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* View Scope Segmented Control */}
                    <td className="px-2 py-2 text-center">
                      <div className="inline-flex rounded-md border border-border bg-neutral-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "all")}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                            viewStatus === "all"
                              ? "bg-neutral-800 text-white shadow-2xs"
                              : "text-muted hover:text-foreground"
                          }`}
                          title="Xem toàn bộ dữ liệu trong hệ thống"
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "own")}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                            viewStatus === "own"
                              ? "bg-neutral-600 text-white shadow-2xs"
                              : "text-muted hover:text-foreground"
                          }`}
                          title="Chỉ xem dữ liệu do chính mình tạo / phụ trách"
                        >
                          Cá nhân
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "none")}
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all ${
                            viewStatus === "none"
                              ? "bg-neutral-300 text-neutral-700 shadow-2xs"
                              : "text-muted hover:text-foreground"
                          }`}
                          title="Tắt quyền xem"
                        >
                          Tắt
                        </button>
                      </div>
                    </td>

                    {/* Create Checkbox */}
                    <td className="px-2 py-2 text-center">
                      {hasCreate ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isCreateChecked}
                            onChange={() => handleToggleAction(mKey, "create")}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </label>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>

                    {/* Update Checkbox */}
                    <td className="px-2 py-2 text-center">
                      {hasUpdate ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isUpdateChecked}
                            onChange={() => handleToggleAction(mKey, "update")}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </label>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>

                    {/* Delete Checkbox */}
                    <td className="px-2 py-2 text-center">
                      {hasDelete ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isDeleteChecked}
                            onChange={() => handleToggleAction(mKey, "delete")}
                            className="h-4 w-4 rounded border-border text-danger focus:ring-danger"
                          />
                        </label>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>

                    {/* Special Actions */}
                    <td className="px-2 py-2 text-center">
                      {uniqueSpecialActionNames.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {uniqueSpecialActionNames.map((act) => {
                            const isChecked = isActionEnabled(mKey, act);
                            const actLabel =
                              act === "export"
                                ? "Xuất Excel"
                                : act === "approve"
                                ? "Phê duyệt"
                                : act === "post"
                                ? "Ghi sổ kho"
                                : act === "convert"
                                ? "Chuyển đổi"
                                : act;

                            return (
                              <button
                                key={act}
                                type="button"
                                onClick={() => handleToggleAction(mKey, act)}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                                  isChecked
                                    ? "bg-neutral-800 text-white border-neutral-800"
                                    : "bg-white text-muted border-border hover:bg-neutral-100"
                                }`}
                              >
                                {isChecked ? "✓ " : ""}{actLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>

                    {/* Row Quick Action */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAllModule(mKey)}
                        className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                          allModSelected
                            ? "bg-neutral-200 text-neutral-800 border-neutral-300"
                            : "bg-white text-foreground border-border hover:bg-neutral-100"
                        }`}
                      >
                        {allModSelected ? "Bỏ chọn" : "Bật tất cả"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
