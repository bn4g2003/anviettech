"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import type { StockMoveType } from "@/features/inventory/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { useToast } from "@/components/ui/toast";
import { StockMoveStatusBadge } from "./stock-move-status";

const TYPE_LABEL: Record<StockMoveType, string> = {
  in: "Phiếu nhập",
  out: "Phiếu xuất",
  transfer: "Điều chuyển",
};

export function StockMoveDetailDrawer() {
  const list = useListPage();
  const { getById, postMove } = useInventory();
  const { toast } = useToast();
  const move = list.viewId ? getById(list.viewId) : null;

  if (!move) {
    return (
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title="Chi tiết"
      >
        <p className="text-sm text-muted">Không tìm thấy</p>
      </Drawer>
    );
  }

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={move.code}
      description={`${TYPE_LABEL[move.type]} · ${relativeTime(move.updatedAt)}`}
      width="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          {move.status === "draft" ? (
            <Button
              variant="primary"
              onClick={() => {
                postMove(move.id);
                toast("Đã ghi sổ phiếu kho", "success");
              }}
            >
              Ghi sổ
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <StockMoveStatusBadge status={move.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Loại</p>
          <p>{TYPE_LABEL[move.type]}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Kho xuất</p>
          <p>{move.warehouseFrom ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Kho nhận</p>
          <p>{move.warehouseTo ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Đơn hàng</p>
          <p className="font-mono text-xs">{move.orderId ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{move.owner.name}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Tạo lúc</p>
          <p>{formatDateTime(move.createdAt)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Ghi chú</p>
          <p>{move.note || "—"}</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-medium">Dòng hàng</p>
      <ul className="space-y-1 text-sm">
        {move.lines.map((l) => (
          <li
            key={l.id}
            className="flex justify-between rounded border border-border px-2 py-1.5"
          >
            <span>{l.productName}</span>
            <span className="font-medium">×{l.qty}</span>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
