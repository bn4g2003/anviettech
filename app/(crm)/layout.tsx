import { AppShell } from "@/components/shell/app-shell";
import { ReactNode } from "react";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
