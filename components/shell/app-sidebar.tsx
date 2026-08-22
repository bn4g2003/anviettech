"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CheckCircle2,
  ChevronsUpDown,
  KeyRound,
  Loader2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import type { CurrentUser } from "@/features/auth/services/auth-types";
import { setCurrentUserCache } from "@/features/auth/hooks/use-current-user";
import { HELP_ITEM, MAIN_NAV, getRoleQuickViews } from "./nav-config";
import { NavLink } from "./nav-link";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  currentUser?: CurrentUser | null;
};

function isNavActive(pathname: string, href: string) {
  if (href.startsWith("/cai-dat")) return pathname.startsWith("/cai-dat");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string | null): string {
  if (!name) return "AV";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar({ collapsed, onToggle, currentUser }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(currentUser);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser);
      if (currentUser) setCurrentUserCache(currentUser);
      return;
    }
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data) {
          setUser(payload.data);
          setCurrentUserCache(payload.data);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/dang-nhap";
    }
  }

  const displayName = user?.fullName || "Người dùng";
  const displayEmail = user?.email || "";
  const initials = getInitials(user?.fullName);
  const userRoles = user?.roles ?? [];
  const displayRole = userRoles.length > 0 ? userRoles[0] : "Thành viên";
  const canAccessAuth =
    userRoles.some((r) => r.toLowerCase().includes("admin")) ||
    user?.permissions?.some((p) => p.module === "users" || p.module === "roles");

  const renderDropdownContent = (side: "bottom" | "right", align: "start" | "end") => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side={side}
        align={align}
        sideOffset={8}
        className="z-50 min-w-[220px] max-w-[280px] rounded-lg border border-border bg-white p-1.5 shadow-lg text-foreground animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
            {displayEmail ? <p className="truncate text-[11px] text-muted">{displayEmail}</p> : null}
            {userRoles.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-block rounded bg-muted-bg px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DropdownMenu.Separator className="my-1 h-px bg-border" />

        <DropdownMenu.Item
          onSelect={() => router.push("/doi-mat-khau")}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground/90 outline-none transition-colors hover:bg-surface focus:bg-surface data-[highlighted]:bg-surface"
        >
          <KeyRound className="h-3.5 w-3.5 text-muted" />
          <span>Đổi mật khẩu</span>
        </DropdownMenu.Item>

        {canAccessAuth ? (
          <DropdownMenu.Item
            onSelect={() => router.push("/cai-dat/nguoi-dung")}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground/90 outline-none transition-colors hover:bg-surface focus:bg-surface data-[highlighted]:bg-surface"
          >
            <Shield className="h-3.5 w-3.5 text-muted" />
            <span>Quản trị người dùng & quyền</span>
          </DropdownMenu.Item>
        ) : null}

        <DropdownMenu.Separator className="my-1 h-px bg-border" />

        <DropdownMenu.Item
          disabled={loggingOut}
          onSelect={(e) => {
            e.preventDefault();
            void handleLogout();
          }}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-danger outline-none transition-colors hover:bg-red-50 focus:bg-red-50 data-[highlighted]:bg-red-50 disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-white transition-[width]",
        collapsed ? "w-16" : "w-[var(--sidebar-width)]",
      )}
    >
      <div className="flex h-13 items-center border-b border-border px-3">
        {!collapsed ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="group flex w-full min-w-0 items-center gap-2 rounded-lg p-1 text-left transition-colors hover:bg-surface focus:outline-none cursor-pointer"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {displayRole}
                  </p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-foreground" />
              </button>
            </DropdownMenu.Trigger>
            {renderDropdownContent("bottom", "start")}
          </DropdownMenu.Root>
        ) : (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                title={displayName}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-white transition-opacity hover:opacity-90 focus:outline-none cursor-pointer"
              >
                {initials}
              </button>
            </DropdownMenu.Trigger>
            {renderDropdownContent("right", "start")}
          </DropdownMenu.Root>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {MAIN_NAV.filter((item) => {
            if (!user) return true;
            if (item.adminOnly) return canAccessAuth;
            if (!item.module) return true;
            if (user.roles.some((r) => r.toLowerCase().includes("admin"))) return true;
            return user.permissions.some(
              (p) => p.module === "*" || p.module === item.module,
            );
          }).map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
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
                </NavLink>
              </li>
            );
          })}
        </ul>

        {!collapsed ? (
          <div className="mt-4">
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Góc nhìn nhanh
            </p>
            <ul className="space-y-0.5">
              {getRoleQuickViews(user).map((view) => (
                <li key={view.href + view.label}>
                  <NavLink
                    href={view.href}
                    showPendingHint={false}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-surface"
                  >
                    {view.tone === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{view.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="space-y-1 border-t border-border p-2">
        <a
          href={HELP_ITEM.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface transition-colors",
            collapsed && "justify-center",
          )}
          title={collapsed ? HELP_ITEM.label : undefined}
        >
          <HELP_ITEM.icon className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>{HELP_ITEM.label}</span> : null}
        </a>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full text-muted hover:text-foreground", collapsed ? "justify-center" : "justify-start")}
          onClick={onToggle}
          title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Thu gọn</span>
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Đăng xuất"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          {!collapsed ? <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span> : null}
        </button>
      </div>
    </aside>
  );
}

