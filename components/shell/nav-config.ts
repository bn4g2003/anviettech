import {
  BarChart3,
  Boxes,
  Briefcase,
  CalendarDays,
  FileText,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Shield,
  Target,
  Users,
  Truck,
  HardHat,
  type LucideIcon,
} from "lucide-react";

import type { CurrentUser } from "@/features/auth/services/auth-types";

export type PublicView = {
  href: string;
  label: string;
  tone?: "success" | "default";
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: string;
  adminOnly?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Kinh doanh",
    items: [
      { href: "/tiem-nang", label: "Tiềm năng", icon: Target, module: "leads" },
      { href: "/khach-hang", label: "Khách hàng", icon: Users, module: "customers" },
      { href: "/co-hoi", label: "Cơ hội", icon: Briefcase, module: "deals" },
      { href: "/bao-gia", label: "Báo giá", icon: FileText, module: "quotes" },
      { href: "/hop-dong", label: "Hợp đồng", icon: Handshake, module: "contracts" },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { href: "/cong-viec", label: "Công việc", icon: CalendarDays, module: "tasks" },
      { href: "/cong-trinh", label: "Công trình", icon: HardHat, module: "projects" },
      { href: "/kho", label: "Kho", icon: Boxes, module: "inventory" },
      { href: "/san-pham", label: "Sản phẩm", icon: Package, module: "products" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Truck, module: "suppliers" },
    ],
  },
  {
    title: "Tài chính & Báo cáo",
    items: [
      { href: "/tai-chinh", label: "Tài chính", icon: Receipt, module: "finance" },
      { href: "/marketing", label: "Marketing", icon: Megaphone, module: "campaigns" },
      { href: "/phan-tich", label: "Phân tích HĐKD", icon: BarChart3, module: "analytics" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/cai-dat/nguoi-dung", label: "Quản trị người dùng", icon: Shield, module: "users", adminOnly: true },
    ],
  },
];

export const MAIN_NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function getRoleQuickViews(user?: CurrentUser | null): PublicView[] {
  if (!user) return [];

  const roles = user.roles.map((r) => r.toLowerCase());
  const isKho = roles.some((r) => r.includes("kho"));
  const isKeToan = roles.some((r) => r.includes("kế toán") || r.includes("tài chính"));
  const isMarketing = roles.some((r) => r.includes("marketing"));
  const isViewer = roles.some((r) => r.includes("chỉ xem"));

  if (isKho) {
    return [
      { href: "/san-pham", label: "Hàng hóa" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp" },
      { href: "/khach-hang", label: "Khách hàng" },
      { href: "/kho/danh-muc", label: "Kho bãi" },
      { href: "/cong-trinh", label: "Công trình" },
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

export const DASHBOARD_ICON = LayoutDashboard;

