"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Deal, DealStage } from "@/features/deals/types";
import {
  WIN_REASONS,
  LOSS_REASONS,
  formatClosedReason,
  parseClosedReason,
} from "@/features/deals/win-loss";
import { formatVnd } from "@/features/shared/utils/money";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface DealWinLossDialogProps {
  deal: Deal | null;
  targetStage: "won" | "lost" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dealId: string, stage: DealStage, reason: string, actualValue?: number) => Promise<void>;
}

export function DealWinLossDialog({
  deal,
  targetStage,
  open,
  onOpenChange,
  onConfirm,
}: DealWinLossDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isWon = targetStage === "won";
  const reasonsList = isWon ? WIN_REASONS : LOSS_REASONS;

  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [competitor, setCompetitor] = useState<string>("");
  const [actualValue, setActualValue] = useState<string>("");

  useEffect(() => {
    if (deal && targetStage) {
      const parsed = parseClosedReason(deal.closedReason);
      const defaultCategory =
        reasonsList.find((r) => r === parsed.category) || reasonsList[0];
      setCategory(defaultCategory);
      setNotes(parsed.notes || "");
      setCompetitor(parsed.competitor || "");
      setActualValue(String(parsed.actualValue ?? deal.value ?? 0));
    } else {
      setCategory("");
      setNotes("");
      setCompetitor("");
      setActualValue("");
    }
  }, [deal, targetStage]);

  if (!deal || !targetStage) return null;

  async function handleConfirm() {
    if (!category.trim()) {
      toast("Vui lòng chọn lý do chính", "error");
      return;
    }
    setSubmitting(true);
    try {
      const val = actualValue ? Number(actualValue) : undefined;
      const formattedReason = formatClosedReason({
        category,
        notes,
        competitor: !isWon ? competitor : undefined,
        actualValue: isWon ? val : undefined,
      });

      await onConfirm(deal!.id, targetStage!, formattedReason, val);
      toast(
        isWon ? "Đã ghi nhận cơ hội Thắng 🎉" : "Đã ghi nhận cơ hội Thua",
        "success",
      );
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Không thể cập nhật kết quả", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isWon ? "Xác nhận Cơ hội Thắng" : "Ghi nhận Cơ hội Thua"}
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            variant={isWon ? "primary" : "danger"}
            disabled={submitting}
            onClick={() => void handleConfirm()}
          >
            {submitting
              ? "Đang lưu..."
              : isWon
                ? "Chốt Thắng Cơ Hội"
                : "Xác Nhận Thua"}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5 text-xs">
        {/* Deal Info summary */}
        <div
          className={`rounded-lg border p-3 ${
            isWon
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-rose-200 bg-rose-50/60"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground text-sm">{deal.title}</p>
              <p className="text-[11px] text-muted font-mono">{deal.code}</p>
            </div>
            <span className="font-semibold text-sm tabular-nums text-foreground">
              {formatVnd(deal.value)}
            </span>
          </div>
        </div>

        {/* Reason category */}
        <div>
          <label className="block font-medium text-foreground mb-1">
            Lý do {isWon ? "thắng" : "thua"} chính *
          </label>
          <Select
            className="w-full text-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {reasonsList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {/* Won: Actual value */}
        {isWon ? (
          <div>
            <label className="block font-medium text-foreground mb-1">
              Giá trị chốt thực tế (VNĐ)
            </label>
            <Input
              type="number"
              min={0}
              className="w-full text-xs"
              placeholder="Giá trị chốt thực tế..."
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-muted">
              Mặc định theo giá trị dự kiến ({formatVnd(deal.value)}). Có thể điều chỉnh nếu có phát sinh/chiết khấu.
            </p>
          </div>
        ) : (
          /* Lost: Competitor name */
          <div>
            <label className="block font-medium text-foreground mb-1">
              Đối thủ cạnh tranh (nếu có)
            </label>
            <Input
              className="w-full text-xs"
              placeholder="Tên công ty / đơn vị đối thủ (ví dụ: Viettel, Dahua, bên thứ ba...)"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
            />
          </div>
        )}

        {/* Notes / Lessons learned */}
        <div>
          <label className="block font-medium text-foreground mb-1">
            Ghi chú chi tiết / Bài học kinh nghiệm
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-border bg-white p-2 text-xs outline-none placeholder:text-muted focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
            placeholder={
              isWon
                ? "Ghi chú về điểm mấu chốt giúp chốt sales thành công..."
                : "Ghi chú về lý do khách từ chối, điểm cần cải thiện cho các deal sau..."
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
