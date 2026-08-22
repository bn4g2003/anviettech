import {
  BarChart3,
  Boxes,
  Briefcase,
  CalendarDays,
  FileText,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Shield,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { CurrentUser } from "@/features/auth/services/auth-types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: string;
  adminOnly?: boolean;
};

export type PublicView = {
  href: string;
  label: string;
  tone?: "success" | "default";
};

export const MAIN_NAV: NavItem[] = [
  { href: "/tiem-nang", label: "Tiềm năng", icon: Target, module: "leads" },
  { href: "/khach-hang", label: "Khách hàng", icon: Users, module: "customers" },
  { href: "/co-hoi", label: "Cơ hội", icon: Briefcase, module: "deals" },
  { href: "/cong-viec", label: "Công việc", icon: CalendarDays, module: "tasks" },
  { href: "/san-pham", label: "Sản phẩm", icon: Package, module: "products" },
  { href: "/bao-gia", label: "Báo giá", icon: FileText, module: "quotes" },
  { href: "/hop-dong", label: "Hợp đồng", icon: Handshake, module: "contracts" },
  { href: "/kho", label: "Kho", icon: Boxes, module: "inventory" },
  { href: "/tai-chinh", label: "Tài chính", icon: Receipt, module: "finance" },
  { href: "/marketing", label: "Marketing", icon: Megaphone, module: "campaigns" },
  { href: "/phan-tich", label: "Phân tích HĐKD", icon: BarChart3, module: "analytics" },
  { href: "/cai-dat/nguoi-dung", label: "AUTH", icon: Shield, module: "users", adminOnly: true },
];

export function getRoleQuickViews(user?: CurrentUser | null): PublicView[] {
  if (!user) return [];

  const roles = user.roles.map((r) => r.toLowerCase());
  const isKho = roles.some((r) => r.includes("kho"));
  const isKeToan = roles.some((r) => r.includes("kế toán") || r.includes("tài chính"));
  const isMarketing = roles.some((r) => r.includes("marketing"));
  const isViewer = roles.some((r) => r.includes("chỉ xem"));

  if (isKho) {
    return [
      { href: "/kho", label: "Tồn kho thực tế" },
      { href: "/kho", label: "Phiếu xuất / nhập" },
      { href: "/san-pham", label: "Danh mục sản phẩm" },
    ];
  }

  if (isKeToan) {
    return [
      { href: "/tai-chinh", label: "Hóa đơn chưa thu" },
      { href: "/tai-chinh", label: "Theo dõi công nợ" },
      { href: "/hop-dong", label: "Hợp đồng đã duyệt" },
      { href: "/phan-tich", label: "Báo cáo tài chính" },
    ];
  }

  if (isMarketing) {
    return [
      { href: "/marketing", label: "Chiến dịch đang chạy" },
      { href: "/tiem-nang", label: "Tiềm năng mới" },
      { href: "/phan-tich", label: "Hiệu quả chiến dịch" },
    ];
  }

  if (isViewer) {
    return [
      { href: "/co-hoi", label: "Cơ hội bán hàng" },
      { href: "/tai-chinh", label: "Tổng quan tài chính" },
      { href: "/phan-tich", label: "Phân tích HĐKD" },
    ];
  }

  // Sales Rep / Sales Manager / Admin default
  return [
    { href: "/khach-hang?view=mine", label: "KH của tôi" },
    { href: "/co-hoi?view=mine", label: "Cơ hội của tôi" },
    { href: "/cong-viec?view=today", label: "Việc hôm nay" },
    { href: "/co-hoi?stage=won", label: "Đã thắng", tone: "success" },
  ];
}

export const PUBLIC_VIEWS: PublicView[] = [
  { href: "/khach-hang?view=mine", label: "KH của tôi" },
  { href: "/co-hoi?view=mine", label: "Cơ hội của tôi" },
  { href: "/cong-viec?view=today", label: "Việc hôm nay" },
  { href: "/co-hoi?stage=won", label: "Đã thắng", tone: "success" },
];

export const HELP_ITEM = {
  href: "#",
  label: "Trợ giúp",
  icon: HelpCircle,
};

export const DASHBOARD_ICON = LayoutDashboard;
