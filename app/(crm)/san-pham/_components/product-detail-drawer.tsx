"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, Tags } from "lucide-react";
import { apiFetch, toQuery } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";

const STATUS_MAP = {
  active: { label: "Đang bán", color: "green" },
  inactive: { label: "Ngưng", color: "gray" },
} as const;

export function ProductDetailDrawer() {
  const list = useListPage();
  const { getById, getStock } = useProducts();
  const product = list.viewId ? getById(list.viewId) : null;

  if (!product) {
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

  const stock = getStock(product.id);
  const status = STATUS_MAP[product.status];
  const trackedInInventory = product.itemType === "goods";
  const lowStock = trackedInInventory && stock <= product.minStock;
  const stockRatio = product.minStock > 0 ? Math.round((stock / product.minStock) * 100) : 100;

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={product.name}
      description={`${product.sku} · ${product.category}`}
      width="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              list.setViewId(null);
              list.setEditId(product.id);
            }}
          >
            Sửa
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10"><PackageCheck className="h-5 w-5" /></div>
                <div className="min-w-0"><p className="truncate font-semibold">{product.name}</p><p className="mt-0.5 font-mono text-xs text-white/70">{product.sku}</p></div>
              </div>
              <Badge tone={product.status === "active" ? "success" : "neutral"}>{status.label}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border bg-white">
            <div className="p-3"><p className="text-[11px] text-muted">Đơn giá</p><p className="mt-1 font-semibold tabular-nums">{formatVnd(product.unitPrice)}</p></div>
            <div className="p-3"><p className="text-[11px] text-muted">Loại</p><p className="mt-1 truncate font-medium">{trackedInInventory ? "Hàng hóa" : "Dịch vụ"}</p></div>
            <div className="p-3"><p className="text-[11px] text-muted">VAT</p><p className="mt-1 font-semibold">{product.vatPercent}%</p></div>
          </div>
        </section>

        {trackedInInventory ? <section className="rounded-lg border border-border p-3">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-medium"><Boxes className="h-4 w-4 text-blue-600" />Tình trạng kho</div><StatusDot color={lowStock ? "red" : "green"} label={lowStock ? "Cần nhập thêm" : "Đủ hàng"} /></div>
          <div className="flex items-end justify-between"><div><p className={lowStock ? "text-2xl font-semibold text-danger" : "text-2xl font-semibold"}>{stock} <span className="text-sm font-normal text-muted">{product.unit}</span></p><p className="mt-1 text-xs text-muted">Định mức tối thiểu: {product.minStock} {product.unit}</p></div><Badge tone={lowStock ? "danger" : "info"}>{lowStock ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}{stockRatio}% định mức</Badge></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted-bg"><div className={lowStock ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-blue-600"} style={{ width: `${Math.min(stockRatio, 100)}%` }} /></div>
        </section> : null}

        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-lg border border-border p-3"><div className="flex items-center gap-2 text-xs text-muted"><Tags className="h-3.5 w-3.5" />Thông tin hàng hóa</div><dl className="mt-3 space-y-2"><div className="flex justify-between gap-2"><dt className="text-muted">SKU</dt><dd className="font-mono text-xs">{product.sku}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Đơn vị</dt><dd>{product.unit}</dd></div></dl></section>
          <section className="rounded-lg border border-border p-3"><div className="flex items-center gap-2 text-xs text-muted"><CircleDollarSign className="h-3.5 w-3.5" />Giá bán</div><dl className="mt-3 space-y-2"><div className="flex justify-between gap-2"><dt className="text-muted">Chưa VAT</dt><dd className="font-medium">{formatVnd(product.unitPrice)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Bao gồm VAT</dt><dd className="font-medium">{formatVnd(product.unitPrice * (1 + product.vatPercent / 100))}</dd></div></dl></section>
        </div>

        {product.description ? <section className="rounded-lg border border-border bg-muted-bg/50 p-3"><p className="text-xs font-medium">Mô tả & ghi chú kỹ thuật</p><p className="mt-1.5 leading-relaxed text-muted">{product.description}</p></section> : null}
        {trackedInInventory ? <ProductSuppliers productId={product.id} /> : null}
      </div>
    </Drawer>
  );
}

type ProductSupplier = { id: string; supplierId: string; supplierCode: string; supplierName: string; supplierSku?: string; purchasePrice: number | string; leadTimeDays?: number | null; isPreferred: boolean };
function ProductSuppliers({ productId }: { productId: string }) {
  const [rows, setRows] = useState<ProductSupplier[]>([]); const [suppliers, setSuppliers] = useState<{ id: string; code: string; name: string }[]>([]);
  const [supplierId, setSupplierId] = useState(""); const [price, setPrice] = useState(""); const [saving, setSaving] = useState(false);
  const reload = async () => { const [links, options] = await Promise.all([apiFetch<ProductSupplier[]>(`/api/v1/products/${productId}/suppliers`), apiFetch<{ id: string; code: string; name: string }[]>(`/api/v1/suppliers${toQuery({ pageSize: 100, status: "active" })}`)]); setRows(links.data ?? []); setSuppliers(options.data ?? []); };
  useEffect(() => { void reload().catch(() => { setRows([]); }); }, [productId]);
  async function add() { if (!supplierId) return; setSaving(true); try { await apiFetch(`/api/v1/products/${productId}/suppliers`, { method: "POST", body: JSON.stringify({ supplierId, purchasePrice: Number(price) || 0, isPreferred: rows.length === 0 }) }); setSupplierId(""); setPrice(""); await reload(); } finally { setSaving(false); } }
  return <section className="rounded-lg border border-border p-3"><p className="text-xs font-medium">Nhà cung cấp</p><div className="mt-2 space-y-1 text-xs">{rows.length ? rows.map((row) => <div className="flex justify-between gap-2" key={row.id}><span>{row.supplierCode} — {row.supplierName}{row.isPreferred ? " · Ưu tiên" : ""}</span><span>{formatVnd(Number(row.purchasePrice))}</span></div>) : <p className="text-muted">Chưa liên kết nhà cung cấp.</p>}</div><div className="mt-3 flex gap-2"><Select className="min-w-0 flex-1" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Thêm nhà cung cấp</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} — {supplier.name}</option>)}</Select><Input className="w-28" type="number" min="0" placeholder="Giá mua" value={price} onChange={(event) => setPrice(event.target.value)} /><Button variant="outline" disabled={saving || !supplierId} onClick={() => void add()}>{saving ? "..." : "Thêm"}</Button></div></section>;
}
