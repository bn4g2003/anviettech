"use client";

import { Suspense, useState, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { NavigationProgress } from "./navigation-progress";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
