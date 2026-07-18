import type { Order, OrderInput, OrderLine } from "@/features/orders/types";
import { productsService } from "@/features/products/services/products-service";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";
import { sumAmounts } from "@/features/shared/utils/money";

function nextCode(rows: Order[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `DH-${String(max + 1).padStart(4, "0")}`;
}

function buildLines(lines: OrderInput["lines"]): { lines: OrderLine[]; total: number } {
  const built: OrderLine[] = lines.map((l) => {
    const product = productsService.getById(l.productId);
    const unitPrice = l.unitPrice ?? product?.unitPrice ?? 0;
    return {
      id: createId("ol"),
      productId: l.productId,
      productName: product?.name ?? "Sản phẩm",
      qty: l.qty,
      unitPrice,
      lineTotal: l.qty * unitPrice,
    };
  });
  return { lines: built, total: sumAmounts(built.map((l) => l.lineTotal)) };
}

export const ordersService = {
  list(): Order[] {
    return crmRepository.listOrders();
  },

  getById(id: string): Order | undefined {
    return crmRepository.listOrders().find((o) => o.id === id);
  },

  search(query: string, filters?: { status?: string; customerId?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listOrders().filter((o) => {
      if (filters?.status && o.status !== filters.status) return false;
      if (filters?.customerId && o.customerId !== filters.customerId) return false;
      if (!q) return true;
      return o.code.toLowerCase().includes(q);
    });
  },

  create(input: OrderInput): Order {
    const rows = crmRepository.listOrders();
    const now = nowIso();
    const { lines, total } = buildLines(input.lines);
    const row: Order = {
      customerId: input.customerId,
      contractId: input.contractId,
      quoteId: input.quoteId,
      status: input.status,
      owner: input.owner,
      id: createId("ord"),
      code: input.code ?? nextCode(rows),
      lines,
      total,
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveOrders([row, ...rows]);
    return row;
  },

  update(id: string, patch: Partial<OrderInput>): Order {
    const rows = crmRepository.listOrders();
    const idx = rows.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error("Không tìm thấy đơn hàng");
    const current = rows[idx];
    const built = patch.lines ? buildLines(patch.lines) : null;
    const next: Order = {
      ...current,
      customerId: patch.customerId ?? current.customerId,
      contractId: patch.contractId ?? current.contractId,
      quoteId: patch.quoteId ?? current.quoteId,
      status: patch.status ?? current.status,
      owner: patch.owner ?? current.owner,
      lines: built?.lines ?? current.lines,
      total: built?.total ?? current.total,
      updatedAt: nowIso(),
    };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveOrders(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveOrders(crmRepository.listOrders().filter((o) => o.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveOrders(crmRepository.listOrders().filter((o) => !set.has(o.id)));
  },
};
