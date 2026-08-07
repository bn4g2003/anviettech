import { AppShell } from "@/components/shell/app-shell";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/auth-service";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  if (user.mustChangePassword) redirect("/doi-mat-khau");
  return <AppShell>{children}</AppShell>;
}
