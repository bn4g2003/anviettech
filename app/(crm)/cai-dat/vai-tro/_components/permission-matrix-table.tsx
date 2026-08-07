"use client";

import { useId, useMemo, useState } from "react";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
  Info,
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
  category: "crm text" | "finance" | "inventory" | "system";
};

const MODULE_DEFINITIONS: Record<string, Omit<ModuleMeta, "key">> = {
  leads: {
    title: "Khách hàng Tiềm năng (Leads)",
    icon: <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    note: "Tiếp nhận, phân loại và chăm sóc manh mối kinh doanh ban đầu",
    category: "crm text",
  },
  customers: {
    title: "Danh sách Khách hàng",
    icon: <Building2Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    note: "Hồ sơ công ty khách hàng, lịch sử giao dịch & liên hệ",
    category: "crm text",
  },
  contacts: {
    title: "Người liên hệ (Contacts)",
    icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    note: "Danh bạ người đại diện, chức vụ & email/sĐT trực thuộc khách hàng",
    category: "crm text",
  },
  deals: {
    title: "Cơ hội kinh doanh (Deals)",
    icon: <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    note: "Đường ống bán hàng (Pipeline), giai đoạn & xác suất thành công",
    category: "crm text",
  },
  quotes: {
    title: "Báo giá (Quotes)",
    icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    note: "Soạn thảo, gửi phê duyệt và phát hành báo giá cho khách hàng",
    category: "crm text",
  },
  orders: {
    title: "Đơn hàng & Bán hàng (Orders)",
    icon: <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    note: "Quản lý đơn đặt hàng, xuất bán hàng hóa & giá trị bán",
    category: "crm text",
  },
  contracts: {
    title: "Hợp đồng kinh tế (Contracts)",
    icon: <Scroll className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    note: "Quản lý hợp đồng thương mại, giá trị, ngày hiệu lực & điều khoản",
    category: "crm text",
  },
  invoices: {
    title: "Hóa đơn & Thu nợ (Invoices)",
    icon: <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    note: "Phát hành hóa đơn tài chính, ghi nhận thanh toán & nợ phải thu",
    category: "finance",
  },
  payments: {
    title: "Phiếu thu & Sổ quỹ (Payments)",
    icon: <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    note: "Ghi nhận phiếu thu/chi tiền mặt & chuyển khoản ngân hàng",
    category: "finance",
  },
  operating_expenses: {
    title: "Chi phí vận hành (Expenses)",
    icon: <BadgePercent className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    note: "Quản lý chi phí lương, thuê VP, bảo hiểm, thuế & chi phí phòng KT",
    category: "finance",
  },
  inventory: {
    title: "Kho & Tồn kho (Inventory)",
    icon: <Boxes className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    note: "Theo dõi tồn kho theo kho bãi, định mức tồn tối thiểu",
    category: "inventory",
  },
  products: {
    title: "Danh mục Sản phẩm & Vật tư",
    icon: <PackageSearch className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    note: "Mã SKU, đơn giá bán, giá vốn & VAT vật tư thiết bị",
    category: "inventory",
  },
  stock_moves: {
    title: "Phiếu Nhập / Xuất / Chuyển kho",
    icon: <Boxes className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    note: "Tạo và ghi sổ các phiếu nhập kho, xuất kho thi công & chuyển kho",
    category: "inventory",
  },
  warehouses: {
    title: "Danh sách Kho bãi (Warehouses)",
    icon: <Boxes className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    note: "Khai báo địa điểm kho bãi & kho chứa phụ tùng",
    category: "inventory",
  },
  tasks: {
    title: "Công việc & Giao kỹ thuật (Tasks)",
    icon: <CheckSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
    note: "Giao việc, nhắc hẹn & phân công kỹ thuật thi công/sửa chữa",
    category: "crm text",
  },
  analytics: {
    title: "Báo cáo & Phân tích HĐKD",
    icon: <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    note: "Bảng báo cáo tài chính 12 tháng, lợi nhuận gộp & phân tích HĐKD",
    category: "crm text",
  },
  campaigns: {
    title: "Chiến dịch Marketing (Campaigns)",
    icon: <Megaphone className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    note: "Theo dõi ngân sách chiến dịch & hiệu quả chuyển đổi",
    category: "crm text",
  },
  documents: {
    title: "Tài liệu & Chứng từ đính kèm",
    icon: <FolderGit2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
    note: "Tải lên, quản lý file đính kèm, hợp đồng scan & bản vẽ",
    category: "system",
  },
  users: {
    title: "Quản lý Người dùng (Users)",
    icon: <UserCog className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
    note: "Tạo tài khoản nhân viên, đổi mật khẩu & kích hoạt tài khoản",
    category: "system",
  },
  roles: {
    title: "Vai trò & Phân quyền (Roles)",
    icon: <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
    note: "Thiết lập các nhóm vai trò và phân quyền ma trận",
    category: "system",
  },
  permissions: {
    title: "Mã quyền Hệ thống (Permissions)",
    icon: <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
    note: "Danh mục mã quyền chi tiết hệ thống",
    category: "system",
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
  onTogglePermission,
  onSelectMultiple,
  onSetPermissions,
  isSystemRole = false,
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
      // Fallback if no 'all' scope exists
      newSet.add(viewOwn.id);
    }

    onSetPermissions(Array.from(newSet));
  };

  // Helper to check action checkbox status (Create, Update, Delete, Export, Approve, etc.)
  const isActionEnabled = (moduleKey: string, actionName: string): boolean => {
    const modPerms = moduleMap[moduleKey] || [];
    const actionPerms = modPerms.filter((p) => p.action === actionName);
    return actionPerms.some((p) => selectedPermissionIds.has(p.id));
  };

  // Toggle action (Create, Update, Delete, etc.) for a module
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

  // Quick Preset Actions
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
    <div className="space-y-4">
      {/* Top Banner & Quick Presets */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Thao tác nhanh theo mẫu vai trò (Presets):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applyPresetAdmin}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200"
            >
              👑 Quyền Quản Trị (Admin)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applyPresetSalesManager}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200"
            >
              💼 Trưởng Phòng Kinh Doanh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applyPresetSalesRep}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200"
            >
              🧑‍💼 Nhân Viên Kinh Doanh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applyPresetAccountant}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200"
            >
              📑 Kế Toán / Tài Chính
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applyPresetWarehouse}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-200"
            >
              📦 Quản Lý Kho
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={clearAllPermissions}
              className="h-7 text-xs bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300"
            >
              🚫 Tắt Tất Cả
            </Button>
          </div>
        </div>

        {/* Vietnamese Scope Notes Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900/80 dark:text-blue-300/80">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-blue-600 text-[10px] font-bold text-white">Tất cả (All)</span>
            <span>Xem & thao tác trên toàn bộ dữ liệu công ty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-amber-600 text-[10px] font-bold text-white">Cá nhân (Own)</span>
            <span>Chỉ xem/thao tác trên dữ liệu tự tạo / phụ trách</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 px-1.5 items-center rounded bg-slate-400 text-[10px] font-bold text-white">Tắt (None)</span>
            <span>Ẩn khỏi menu & chặn truy cập API</span>
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Đã chọn: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedPermissionIds.size}</span> / {permissions.length} quyền
        </div>
      </div>

      {/* Structured Matrix Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto max-h-[55vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 font-semibold text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-200">
                <th scope="col" className="px-4 py-3 min-w-[250px]">Phân hệ & Chức năng</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[170px]">Quyền Xem (View)</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[90px]">Tạo mới</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[90px]">Chỉnh sửa</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[90px]">Xóa</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[130px]">Thao tác đặc biệt</th>
                <th scope="col" className="px-3 py-3 text-center min-w-[100px]">Chọn nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredModules.map((mKey) => {
                const def = MODULE_DEFINITIONS[mKey] || {
                  title: mKey,
                  icon: <Shield className="h-4 w-4 text-slate-500" />,
                  note: `Phân hệ mã ${mKey}`,
                  category: "system",
                };

                const modPerms = moduleMap[mKey] || [];
                const viewStatus = getViewScopeStatus(mKey);
                const hasCreate = modPerms.some((p) => p.action === "create");
                const hasUpdate = modPerms.some((p) => p.action === "update");
                const hasDelete = modPerms.some((p) => p.action === "delete");

                const isCreateChecked = isActionEnabled(mKey, "create");
                const isUpdateChecked = isActionEnabled(mKey, "update");
                const isDeleteChecked = isActionEnabled(mKey, "delete");

                // Special actions (approve, export, post, convert, etc.)
                const specialActions = modPerms.filter(
                  (p) => !["view", "create", "update", "delete"].includes(p.action)
                );
                // Deduplicate special action names
                const uniqueSpecialActionNames = Array.from(new Set(specialActions.map((p) => p.action)));

                const allModSelected = modPerms.every((p) => selectedPermissionIds.has(p.id));

                return (
                  <tr
                    key={mKey}
                    className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                  >
                    {/* Module Title & Vietnamese Note */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">{def.icon}</div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {def.title}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {def.note}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* View Scope (Segmented Control / Radio) */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "all")}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition-all ${
                            viewStatus === "all"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                          title="Xem toàn bộ dữ liệu trong hệ thống"
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "own")}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition-all ${
                            viewStatus === "own"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                          title="Chỉ xem dữ liệu do chính mình tạo / phụ trách"
                        >
                          Cá nhân
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetViewScope(mKey, "none")}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition-all ${
                            viewStatus === "none"
                              ? "bg-slate-400 text-white shadow-xs dark:bg-slate-600"
                              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                          title="Tắt quyền xem"
                        >
                          Tắt
                        </button>
                      </div>
                    </td>

                    {/* Create Checkbox */}
                    <td className="px-3 py-3 text-center">
                      {hasCreate ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isCreateChecked}
                            onChange={() => handleToggleAction(mKey, "create")}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </label>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">&mdash;</span>
                      )}
                    </td>

                    {/* Update Checkbox */}
                    <td className="px-3 py-3 text-center">
                      {hasUpdate ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isUpdateChecked}
                            onChange={() => handleToggleAction(mKey, "update")}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </label>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">&mdash;</span>
                      )}
                    </td>

                    {/* Delete Checkbox */}
                    <td className="px-3 py-3 text-center">
                      {hasDelete ? (
                        <label className="inline-flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isDeleteChecked}
                            onChange={() => handleToggleAction(mKey, "delete")}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </label>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">&mdash;</span>
                      )}
                    </td>

                    {/* Special Actions */}
                    <td className="px-3 py-3 text-center">
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
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border transition-all ${
                                  isChecked
                                    ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                              >
                                {isChecked ? "✓ " : ""}{actLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">&mdash;</span>
                      )}
                    </td>

                    {/* Row Quick Action */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAllModule(mKey)}
                        className={`rounded px-2 py-1 text-[11px] font-medium border transition-colors ${
                          allModSelected
                            ? "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                            : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400 dark:border-blue-900"
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
