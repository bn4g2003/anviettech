import type { Quote, QuoteInput, QuoteLine } from "@/features/quotes/types";
import { productsService } from "@/features/products/services/products-service";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";
import { calcLineTotal, sumAmounts } from "@/features/shared/utils/money";

function nextCode(rows: Quote[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `BG-${String(max + 1).padStart(4, "0")}`;
}

function buildLines(
  lines: QuoteInput["lines"],
): { lines: QuoteLine[]; subtotal: number; total: number } {
  const built: QuoteLine[] = lines.map((l) => {
    const product = productsService.getById(l.productId);
    const productName = product?.name ?? "Sản phẩm";
    const unitPrice = l.unitPrice ?? product?.unitPrice ?? 0;
    const vatPercent = l.vatPercent ?? product?.vatPercent ?? 0;
    return {
      id: createId("ql"),
      productId: l.productId,
      productName,
      qty: l.qty,
      unitPrice,
      discountPercent: l.discountPercent ?? 0,
      vatPercent,
      lineTotal: calcLineTotal(l.qty, unitPrice, l.discountPercent ?? 0, vatPercent),
    };
  });
  const subtotal = sumAmounts(built.map((l) => l.qty * l.unitPrice));
  const total = sumAmounts(built.map((l) => l.lineTotal));
  return { lines: built, subtotal, total };
}

export const quotesService = {
  list(): Quote[] {
    return crmRepository.listQuotes();
  },

  getById(id: string): Quote | undefined {
    return crmRepository.listQuotes().find((q) => q.id === id);
  },

  byCustomer(customerId: string): Quote[] {
    return crmRepository.listQuotes().filter((q) => q.customerId === customerId);
  },

  search(query: string, filters?: { status?: string; customerId?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listQuotes().filter((row) => {
      if (filters?.status && row.status !== filters.status) return false;
      if (filters?.customerId && row.customerId !== filters.customerId) return false;
      if (!q) return true;
      return row.code.toLowerCase().includes(q);
    });
  },

  create(input: QuoteInput): Quote {
    const rows = crmRepository.listQuotes();
    const now = nowIso();
    const { lines, subtotal, total } = buildLines(input.lines);
    const row: Quote = {
      customerId: input.customerId,
      dealId: input.dealId,
      status: input.status,
      validUntil: input.validUntil,
      owner: input.owner,
      terms: input.terms,
      id: createId("quote"),
      code: input.code ?? nextCode(rows),
      lines,
      subtotal,
      total,
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveQuotes([row, ...rows]);
    return row;
  },

  update(id: string, patch: Partial<QuoteInput>): Quote {
    const rows = crmRepository.listQuotes();
    const idx = rows.findIndex((q) => q.id === id);
    if (idx < 0) throw new Error("Không tìm thấy báo giá");
    const current = rows[idx];
    const built = patch.lines ? buildLines(patch.lines) : null;
    const next: Quote = {
      ...current,
      customerId: patch.customerId ?? current.customerId,
      dealId: patch.dealId ?? current.dealId,
      status: patch.status ?? current.status,
      validUntil: patch.validUntil ?? current.validUntil,
      owner: patch.owner ?? current.owner,
      terms: patch.terms ?? current.terms,
      lines: built?.lines ?? current.lines,
      subtotal: built?.subtotal ?? current.subtotal,
      total: built?.total ?? current.total,
      updatedAt: nowIso(),
    };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveQuotes(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveQuotes(crmRepository.listQuotes().filter((q) => q.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveQuotes(crmRepository.listQuotes().filter((q) => !set.has(q.id)));
  },
};
