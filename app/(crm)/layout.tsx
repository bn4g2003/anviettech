import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { AuthGate } from "./auth-gate";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <AppShell currentUser={currentUser}>
      <Suspense fallback={<PageSkeleton />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </AppShell>
  );
}
