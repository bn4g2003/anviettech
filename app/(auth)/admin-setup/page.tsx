import type { Metadata } from "next";
import { AdminSetupClient } from "./admin-setup-client";
import { getAdminSetupStatus } from "@/features/auth/services/admin-setup-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khởi tạo quản trị hệ thống",
  robots: { index: false, follow: false },
};

export default async function AdminSetupPage() {
  const status = await getAdminSetupStatus();
  return <AdminSetupClient available={status.available} cctvConfigured={status.cctvConfigured} />;
}
