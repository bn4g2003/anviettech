"use client";

import { Suspense, useState, type ReactNode } from "react";
import type { CurrentUser } from "@/features/auth/services/auth-types";
import { AppSidebar } from "./app-sidebar";
import { NavigationProgress } from "./navigation-progress";

export function AppShell({
  children,
  currentUser,
}: {
  children: ReactNode;
  currentUser?: CurrentUser | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        currentUser={currentUser}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
