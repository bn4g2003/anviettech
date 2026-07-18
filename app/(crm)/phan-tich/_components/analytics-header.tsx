"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { resetDemoData } from "@/features/shared/workflows/reset-demo";
import { RotateCcw } from "lucide-react";

export function AnalyticsHeader() {
  const { toast } = useToast();

  return (
    <AppHeader
      moduleLabel="Phân tích HĐKD"
      viewLabel="Tổng quan"
      secondaryAction={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetDemoData();
            toast("Đã khôi phục dữ liệu demo", "success");
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset demo
        </Button>
      }
    />
  );
}
