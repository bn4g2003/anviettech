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
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type PublicView = {
  href: string;
  label: string;
  tone?: "success" | "default";
};

export const MAIN_NAV: NavItem[] = [
  { href: "/khach-hang", label: "Khách hàng", icon: Users },
  { href: "/co-hoi", label: "Cơ hội", icon: Briefcase },
  { href: "/cong-viec", label: "Công việc", icon: CalendarDays },
  { href: "/san-pham", label: "Sản phẩm", icon: Package },
  { href: "/bao-gia", label: "Báo giá", icon: FileText },
  { href: "/hop-dong", label: "Hợp đồng", icon: Handshake },
  { href: "/kho", label: "Kho", icon: Boxes },
  { href: "/tai-chinh", label: "Tài chính", icon: Receipt },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/phan-tich", label: "Phân tích HĐKD", icon: BarChart3 },
];

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
