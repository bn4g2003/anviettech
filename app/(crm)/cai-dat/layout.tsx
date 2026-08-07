"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const AUTH_TABS = [
  { href: "/cai-dat/nguoi-dung", label: "Người dùng" },
  { href: "/cai-dat/vai-tro", label: "Vai trò & quyền" },
] as const;

export default function AuthSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border bg-white px-5 pt-5">
        <h1 className="text-xl font-semibold tracking-wide">AUTH</h1>
        <p className="mt-1 text-sm text-muted">Quản lý tài khoản, vai trò và phân quyền truy cập CRM.</p>
        <nav className="mt-4 flex gap-0.5" aria-label="AUTH">
          {AUTH_TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative -mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
