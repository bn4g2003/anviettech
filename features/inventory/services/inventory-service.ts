import type { StockLevel, StockMove, StockMoveInput } from "@/features/inventory/types";
import { productsService } from "@/features/products/services/products-service";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";

function nextCode(type: StockMove["type"], rows: StockMove[]): string {
  const prefix = type === "in" ? "PN" : type === "out" ? "PX" : "DC";
  const max = rows
    .filter((r) => r.code.startsWith(prefix))
    .reduce((acc, r) => {
      const n = Number(r.code.replace(/\D/g, ""));
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export const inventoryService = {
  listLevels(): StockLevel[] {
    return crmRepository.listStockLevels();
  },

  getQty(productId: string): number {
    return crmRepository.listStockLevels().find((s) => s.productId === productId)?.qty ?? 0;
  },

  listMoves(): StockMove[] {
    return crmRepository.listStockMoves();
  },

  lowStock() {
    return crmRepository.listStockLevels().filter((s) => {
      const product = productsService.getById(s.productId);
      if (!product || product.minStock <= 0) return false;
      return s.qty < product.minStock;
    });
  },

  createMove(input: StockMoveInput): StockMove {
    const rows = crmRepository.listStockMoves();
    const now = nowIso();
    const lines = input.lines.map((l) => ({
      id: createId("sml"),
      productId: l.productId,
      productName: productsService.getById(l.productId)?.name ?? "SP",
      qty: l.qty,
    }));
    const row: StockMove = {
      ...input,
      id: createId("sm"),
      code: input.code ?? nextCode(input.type, rows),
      lines,
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveStockMoves([row, ...rows]);
    if (row.status === "posted") this.applyMove(row);
    return row;
  },

  postMove(id: string): StockMove {
    const rows = crmRepository.listStockMoves();
    const idx = rows.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error("Không tìm thấy phiếu kho");
    if (rows[idx].status === "posted") return rows[idx];
    const next = { ...rows[idx], status: "posted" as const, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveStockMoves(copy);
    this.applyMove(next);
    return next;
  },

  applyMove(move: StockMove): void {
    const levels = [...crmRepository.listStockLevels()];
    for (const line of move.lines) {
      const idx = levels.findIndex((l) => l.productId === line.productId);
      const current = idx >= 0 ? levels[idx].qty : 0;
      let nextQty = current;
      if (move.type === "in") nextQty = current + line.qty;
      if (move.type === "out") nextQty = Math.max(0, current - line.qty);
      if (idx >= 0) levels[idx] = { productId: line.productId, qty: nextQty };
      else levels.push({ productId: line.productId, qty: nextQty });
    }
    crmRepository.saveStockLevels(levels);
  },

  removeMove(id: string): void {
    crmRepository.saveStockMoves(crmRepository.listStockMoves().filter((m) => m.id !== id));
  },
};
