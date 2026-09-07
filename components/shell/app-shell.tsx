"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/services/auth-types";
import { API_MUTATION_SUCCEEDED_EVENT } from "@/lib/api-client";
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
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [contentVersion, setContentVersion] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refreshContent = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => setContentVersion((version) => version + 1), 250);
    };
    window.addEventListener(API_MUTATION_SUCCEEDED_EVENT, refreshContent);
    return () => {
      window.removeEventListener(API_MUTATION_SUCCEEDED_EVENT, refreshContent);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        hidden={sidebarHidden}
        onHide={() => setSidebarHidden(true)}
        currentUser={currentUser}
      />
      {sidebarHidden ? (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-3 top-3 z-50 bg-white shadow-sm"
          onClick={() => setSidebarHidden(false)}
          aria-label="Hiện thanh điều hướng"
          aria-controls="app-sidebar"
          aria-expanded={false}
          title="Hiện thanh điều hướng"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      ) : null}
      <main key={contentVersion} className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
