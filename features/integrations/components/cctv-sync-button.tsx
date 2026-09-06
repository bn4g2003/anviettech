"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { RefreshCw } from "lucide-react";
import { CctvSyncModal } from "./cctv-sync-modal";

interface CctvSyncButtonProps {
  onSuccess?: () => void;
  className?: string;
  size?: "sm" | "md" | "icon";
}

export function CctvSyncButton({ onSuccess, className, size = "sm" }: CctvSyncButtonProps) {
  const { hasPermission } = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);

  // Chỉ hiển thị nếu tài khoản có quyền integrations:sync (hoặc Super admin)
  const allowed = hasPermission("integrations", "sync");
  if (!allowed) return null;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => setModalOpen(true)}
        className={className}
        title="Mở cửa sổ đồng bộ dữ liệu từ hệ thống CCTV"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-primary" />
        <span>Đồng bộ CCTV</span>
      </Button>

      <CctvSyncModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
