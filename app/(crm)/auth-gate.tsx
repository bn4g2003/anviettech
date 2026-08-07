import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/auth-service";

/** Async auth check isolated so the shell can stream behind Suspense. */
export async function AuthGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  if (user.mustChangePassword) redirect("/doi-mat-khau");
  return children;
}
