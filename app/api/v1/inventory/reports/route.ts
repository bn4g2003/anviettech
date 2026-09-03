import { NextRequest } from "next/server";
import { ApiError, errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { query } from "@/lib/db";

const KINDS = new Set(["stock", "moves", "projects", "warranty"]);

function reportDate(value: string | null, label: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new ApiError(422, `${label} không hợp lệ`);
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("inventory", "view");
    const kind = request.nextUrl.searchParams.get("kind") ?? "stock";
    if (!KINDS.has(kind)) throw new ApiError(422, "Loại báo cáo không hợp lệ");
    const from = reportDate(request.nextUrl.searchParams.get("from"), "Từ ngày");
    const to = reportDate(request.nextUrl.searchParams.get("to"), "Đến ngày");
    if (from && to && from > to) throw new ApiError(422, "Từ ngày phải trước hoặc bằng đến ngày");
    const period = [from, to];
    if (kind === "stock") return ok((await query(`SELECT p.sku,p.name,p.item_type AS "itemType",w.code AS "warehouseCode",b.qty,p.min_stock AS "minStock",COALESCE(SUM(CASE WHEN (m.type='in' OR (m.type='transfer' AND m.warehouse_to_id=w.id)) THEN l.qty ELSE 0 END),0) AS "receivedQty",COALESCE(SUM(CASE WHEN (m.type='out' OR (m.type='transfer' AND m.warehouse_from_id=w.id)) THEN l.qty ELSE 0 END),0) AS "issuedQty" FROM inventory_balances b JOIN products p ON p.id=b.product_id AND p.deleted_at IS NULL JOIN warehouses w ON w.id=b.warehouse_id AND w.deleted_at IS NULL LEFT JOIN stock_move_lines l ON l.product_id=b.product_id LEFT JOIN stock_moves m ON m.id=l.stock_move_id AND m.status='posted' AND m.deleted_at IS NULL AND ($1::date IS NULL OR m.posted_at >= $1::date) AND ($2::date IS NULL OR m.posted_at < $2::date + INTERVAL '1 day') GROUP BY p.sku,p.name,p.item_type,w.code,b.qty,p.min_stock ORDER BY p.name`, period)).rows);
    if (kind === "moves") return ok((await query(`SELECT m.code,m.type,m.reason,m.status,m.created_at AS "createdAt",s.name AS "supplierName",c.name AS "customerName",p.name AS "projectName" FROM stock_moves m LEFT JOIN suppliers s ON s.id=m.supplier_id LEFT JOIN customers c ON c.id=m.customer_id LEFT JOIN projects p ON p.id=m.project_id WHERE m.deleted_at IS NULL AND ($1::date IS NULL OR m.created_at >= $1::date) AND ($2::date IS NULL OR m.created_at < $2::date + INTERVAL '1 day') ORDER BY m.created_at DESC`, period)).rows);
    if (kind === "projects") return ok((await query(`SELECT m.code,m.created_at AS "issuedAt",p.code AS "projectCode",p.name AS "projectName",c.name AS "customerName",l.product_name AS "productName",l.qty FROM stock_moves m JOIN projects p ON p.id=m.project_id JOIN customers c ON c.id=p.customer_id JOIN stock_move_lines l ON l.stock_move_id=m.id WHERE m.reason='installation_issue' AND m.status='posted' AND m.deleted_at IS NULL AND ($1::date IS NULL OR m.created_at >= $1::date) AND ($2::date IS NULL OR m.created_at < $2::date + INTERVAL '1 day') ORDER BY m.created_at DESC`, period)).rows);
    return ok((await query(`SELECT sn.serial,sn.status,sn.warranty_until AS "warrantyUntil",p.sku,p.name AS "productName",w.code AS "warehouseCode",c.name AS "customerName" FROM serial_numbers sn JOIN products p ON p.id=sn.product_id LEFT JOIN warehouses w ON w.id=sn.warehouse_id LEFT JOIN customers c ON c.id=sn.customer_id WHERE sn.deleted_at IS NULL AND sn.status IN ('warranty','damaged') AND ($1::date IS NULL OR sn.updated_at >= $1::date) AND ($2::date IS NULL OR sn.updated_at < $2::date + INTERVAL '1 day') ORDER BY sn.updated_at DESC`, period)).rows);
  } catch (error) { return errorResponse(error); }
}
