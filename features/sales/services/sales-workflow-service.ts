import type { PoolClient } from "pg";
import { transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { code } from "@/features/crm/services/crm-service";

export async function approveQuote(quoteId: string, actorId: string) {
  return transaction(async (client: PoolClient) => {
    const quote = await client.query<{
      id: string; customer_id: string; deal_id: string | null; owner_id: string | null; total: string; status: string; terms: string | null;
    }>("SELECT * FROM quotes WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [quoteId]);
    const row = quote.rows[0];
    if (!row) throw new ApiError(404, "Không tìm thấy báo giá");
    if (row.status !== "sent") throw new ApiError(409, "Chỉ duyệt báo giá đã gửi");

    await client.query("UPDATE quotes SET status='approved', approved_at=now(), updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, quoteId]);

    const contract = await client.query<{ id: string }>(
      `INSERT INTO contracts(code,customer_id,quote_id,deal_id,status,value,owner_id,terms,created_by,updated_by)
       VALUES($1,$2,$3,$4,'active',$5,$6,$7,$8,$8)
       ON CONFLICT(quote_id) DO UPDATE SET updated_at=now() RETURNING id`,
      [code("HD"), row.customer_id, quoteId, row.deal_id, row.total, row.owner_id ?? actorId, row.terms, actorId],
    );

    const order = await client.query<{ id: string }>(
      `INSERT INTO orders(code,customer_id,contract_id,quote_id,status,owner_id,total,created_by,updated_by)
       VALUES($1,$2,$3,$4,'draft',$5,$6,$7,$7)
       ON CONFLICT(quote_id) DO UPDATE SET updated_at=now() RETURNING id`,
      [code("DH"), row.customer_id, contract.rows[0].id, quoteId, row.owner_id ?? actorId, row.total, actorId],
    );

    await client.query("DELETE FROM order_lines WHERE order_id=$1", [order.rows[0].id]);
    await client.query(
      `INSERT INTO order_lines(order_id,product_id,product_name,qty,unit_price,line_total,cost_price,business_type)
       SELECT $1, q.product_id, q.product_name, q.qty, q.unit_price, q.line_total,
              COALESCE(p.cost_price, 0), COALESCE(p.business_type, 'new_construction')
       FROM quote_lines q
       JOIN products p ON p.id=q.product_id AND p.deleted_at IS NULL
       WHERE q.quote_id=$2`,
      [order.rows[0].id, quoteId],
    );

    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'quotes','approve','quote',$2,$3)",
      [actorId, quoteId, JSON.stringify({ contractId: contract.rows[0].id, orderId: order.rows[0].id })],
    );
    return { contractId: contract.rows[0].id, orderId: order.rows[0].id };
  });
}

export async function confirmOrder(orderId: string, actorId: string, warehouseId: string) {
  return transaction(async (client: PoolClient) => {
    const warehouse = await client.query("SELECT id FROM warehouses WHERE id=$1 AND deleted_at IS NULL", [warehouseId]);
    if (!warehouse.rows[0]) throw new ApiError(422, "Kho không tồn tại");

    const order = await client.query<{
      id: string; customer_id: string; contract_id: string | null; total: string; owner_id: string | null; status: string;
    }>("SELECT * FROM orders WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [orderId]);
    const row = order.rows[0];
    if (!row) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (row.status !== "draft") throw new ApiError(409, "Chỉ xác nhận đơn nháp");

    const lines = await client.query<{ product_id: string; product_name: string; qty: string }>(
      "SELECT product_id, product_name, qty FROM order_lines WHERE order_id=$1", [orderId],
    );
    if (!lines.rows.length) throw new ApiError(422, "Đơn không có dòng sản phẩm");

    for (const line of lines.rows) {
      await client.query(
        "INSERT INTO inventory_balances(warehouse_id,product_id,qty) VALUES($1,$2,0) ON CONFLICT DO NOTHING",
        [warehouseId, line.product_id],
      );
      const stock = await client.query<{ qty: string }>(
        "SELECT qty FROM inventory_balances WHERE warehouse_id=$1 AND product_id=$2 FOR UPDATE",
        [warehouseId, line.product_id],
      );
      if (!stock.rows[0] || Number(stock.rows[0].qty) < Number(line.qty)) {
        throw new ApiError(409, `Không đủ tồn kho: ${line.product_name}`);
      }
    }

    const move = await client.query<{ id: string }>(
      `INSERT INTO stock_moves(code,type,status,order_id,warehouse_from_id,owner_id,posted_at,created_by,updated_by)
       VALUES($1,'out','posted',$2,$3,$4,now(),$5,$5) RETURNING id`,
      [code("PX"), orderId, warehouseId, row.owner_id ?? actorId, actorId],
    );

    for (const line of lines.rows) {
      await client.query(
        "INSERT INTO stock_move_lines(stock_move_id,product_id,product_name,qty) VALUES($1,$2,$3,$4)",
        [move.rows[0].id, line.product_id, line.product_name, line.qty],
      );
      await client.query(
        "UPDATE inventory_balances SET qty=qty-$1, updated_at=now() WHERE warehouse_id=$2 AND product_id=$3",
        [line.qty, warehouseId, line.product_id],
      );
    }

    const invoice = await client.query<{ id: string }>(
      `INSERT INTO invoices(code,customer_id,order_id,contract_id,status,amount,due_date,owner_id,created_by,updated_by)
       VALUES($1,$2,$3,$4,'unpaid',$5,current_date + 30,$6,$7,$7) RETURNING id`,
      [code("HDON"), row.customer_id, orderId, row.contract_id, row.total, row.owner_id ?? actorId, actorId],
    );

    await client.query("UPDATE orders SET status='confirmed', updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, orderId]);
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'orders','confirm','order',$2,$3)",
      [actorId, orderId, JSON.stringify({ stockMoveId: move.rows[0].id, invoiceId: invoice.rows[0].id, warehouseId })],
    );
    return { stockMoveId: move.rows[0].id, invoiceId: invoice.rows[0].id };
  });
}

const PAYMENT_METHODS = new Set(["cash", "transfer", "card", "other"]);

export async function recordPayment(
  input: { invoiceId: string; amount: number; method: string; paidAt: string; note?: string },
  actorId: string,
) {
  if (!PAYMENT_METHODS.has(input.method)) throw new ApiError(422, "Phương thức thanh toán không hợp lệ");

  return transaction(async (client: PoolClient) => {
    const invoice = await client.query<{
      id: string; customer_id: string; amount: string; paid_amount: string; status: string; owner_id: string | null;
    }>("SELECT * FROM invoices WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [input.invoiceId]);
    const row = invoice.rows[0];
    if (!row) throw new ApiError(404, "Không tìm thấy hóa đơn");
    if (row.status === "cancelled") throw new ApiError(409, "Không thể thu hóa đơn đã hủy");

    const next = Math.round((Number(row.paid_amount) + input.amount) * 100) / 100;
    const amount = Math.round(Number(row.amount) * 100) / 100;
    if (next > amount) throw new ApiError(422, "Số tiền thu vượt quá giá trị hóa đơn");

    const status = next >= amount ? "paid" : "partial";
    const payment = await client.query<{ id: string }>(
      `INSERT INTO payments(code,invoice_id,customer_id,amount,method,paid_at,owner_id,note,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING id`,
      [code("PT"), row.id, row.customer_id, input.amount, input.method, input.paidAt, row.owner_id ?? actorId, input.note ?? null, actorId],
    );
    await client.query("UPDATE invoices SET paid_amount=$1, status=$2, updated_at=now(), updated_by=$3 WHERE id=$4", [next, status, actorId, row.id]);
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'finance','payment','invoice',$2,$3)",
      [actorId, row.id, JSON.stringify({ paymentId: payment.rows[0].id, status, paidAmount: next })],
    );
    return { paymentId: payment.rows[0].id, status };
  });
}
