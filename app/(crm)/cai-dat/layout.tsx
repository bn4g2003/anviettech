"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Users, ShieldCheck } from "lucide-react";

const AUTH_TABS = [
  { href: "/cai-dat/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/cai-dat/vai-tro", label: "Vai trò & phân quyền", icon: ShieldCheck },
] as const;

export default function AuthSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-sm">Cài đặt</span>
          <span className="text-muted">/</span>
          <nav className="flex items-center gap-1" aria-label="Cài đặt hệ thống">
            {AUTH_TABS.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-muted-bg text-foreground font-semibold shadow-2xs"
                      : "text-muted hover:bg-muted-bg/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
