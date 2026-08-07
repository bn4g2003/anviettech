import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AuthGate } from "./auth-gate";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </AppShell>
  );
}
