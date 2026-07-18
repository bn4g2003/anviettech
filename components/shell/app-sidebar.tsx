"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { resetDemoData } from "@/features/shared/workflows/reset-demo";
import { cn } from "@/lib/cn";
import {
  CheckCircle2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HELP_ITEM, MAIN_NAV, PUBLIC_VIEWS } from "./nav-config";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { toast } = useToast();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-white transition-[width]",
        collapsed ? "w-16" : "w-[var(--sidebar-width)]",
      )}
    >
      <div className="flex h-12 items-center gap-2 border-b border-border px-3">
        {!collapsed ? (
          <>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-white">
              AV
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">AnViet CRM</p>
              <button
                type="button"
                className="flex items-center gap-0.5 truncate text-xs text-muted"
              >
                Michelle Alva
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-white">
            AV
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {MAIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted-bg font-medium text-foreground"
                      : "text-foreground/80 hover:bg-surface",
                    collapsed && "justify-center",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed ? (
          <div className="mt-4">
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Views công khai
            </p>
            <ul className="space-y-0.5">
              {PUBLIC_VIEWS.map((view) => (
                <li key={view.href}>
                  <Link
                    href={view.href}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-surface"
                  >
                    {view.tone === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{view.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="space-y-1 border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
          title="Khôi phục dữ liệu demo"
          onClick={() => {
            resetDemoData();
            toast("Đã khôi phục dữ liệu demo", "success");
          }}
        >
          <RotateCcw className="h-4 w-4" />
          {!collapsed ? "Reset demo" : null}
        </Button>
        <a
          href={HELP_ITEM.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface",
            collapsed && "justify-center",
          )}
        >
          <HELP_ITEM.icon className="h-4 w-4" />
          {!collapsed ? HELP_ITEM.label : null}
        </a>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
          onClick={onToggle}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              Thu gọn
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
