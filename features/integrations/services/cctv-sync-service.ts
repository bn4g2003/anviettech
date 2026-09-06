import { query, transaction } from "@/lib/db";
import { isCctvConfigured, queryCctv } from "@/lib/cctv-db";
import { code } from "@/features/crm/services/crm-service";
import { ApiError } from "@/lib/api";

export type CustomerContactToSync = {
  name: string;
  phone: string;
  note?: string;
  isPrimary: boolean;
};

export type CustomerToCreate = {
  cctvId: string;
  name: string;
  phone: string;
  contactName: string;
  address: string;
  addressNote?: string;
  lat?: number | null;
  lng?: number | null;
  notes: string;
  type: "company" | "individual";
  contacts: CustomerContactToSync[];
};

export type CustomerToUpdate = {
  id: string;
  cctvId: string;
  currentName: string;
  phone: string;
  address: string;
  addressNote?: string;
  lat?: number | null;
  lng?: number | null;
  notes: string;
  contacts: CustomerContactToSync[];
};

export type WorkOrderMaterialToSync = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type WorkOrderToSync = {
  cctvId: string;
  code: string;
  cctvCustomerId: string;
  customerName: string;
  businessType: "new_construction" | "repair" | "warranty";
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  costAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMethod?: string | null;
  paymentNote?: string | null;
  debtDueDate?: string | null;
  confirmedAt?: string | null;
  description: string;
  completionNote?: string;
  occurredAt: string;
  materials: WorkOrderMaterialToSync[];
};

export type SyncPreviewData = {
  customers: {
    toCreate: CustomerToCreate[];
    toUpdate: CustomerToUpdate[];
  };
  workOrders: WorkOrderToSync[];
  summary: {
    newCustomersCount: number;
    updateCustomersCount: number;
    newOrdersCount: number;
    totalRevenue: number;
    totalPaid: number;
    totalDebt: number;
  };
  scannedAt: string;
};

export type SyncResult = {
  success: boolean;
  customersCreated: number;
  customersUpdated: number;
  ordersSynced: number;
  invoicesSynced: number;
  paymentsSynced: number;
  durationMs: number;
  completedAt: string;
};

let isSyncInProgress = false;

export function detectCustomerType(name: string): "company" | "individual" {
  const companyRegex = /công\s*ty|tnhh|cổ\s*phần|cp\b|doanh\s*nghiệp|tập\s*đoàn/i;
  return companyRegex.test(name) ? "company" : "individual";
}

export function mapBusinessType(workOrderType: string): "new_construction" | "repair" | "warranty" {
  switch (workOrderType) {
    case "installation":
    case "add_on":
      return "new_construction";
    case "warranty":
      return "warranty";
    case "maintenance":
    case "maintenance_repair":
    case "relocation":
    default:
      return "repair";
  }
}

export async function getLastSuccessfulSyncTime(): Promise<Date> {
  const res = await query<{ completed_at: Date }>(
    `SELECT completed_at FROM cctv_sync_logs
     WHERE status = 'success' AND completed_at IS NOT NULL
     ORDER BY completed_at DESC LIMIT 1`,
  );
  if (res.rows.length > 0 && res.rows[0].completed_at) {
    return new Date(res.rows[0].completed_at);
  }
  const defaultPast = new Date();
  defaultPast.setFullYear(defaultPast.getFullYear() - 2);
  return defaultPast;
}

/**
 * GIAI ĐOẠN 1: QUÉT NHANH & XEM TRƯỚC (PREVIEW)
 * Sử dụng Batch Query tối ưu: không giới hạn 200 bản ghi, đọc toàn bộ dữ liệu thực tế.
 */
export async function previewCctvSync(): Promise<SyncPreviewData> {
  if (!isCctvConfigured()) {
    throw new ApiError(
      400,
      "Chưa cấu hình CCTV_DATABASE_URL trong file .env của CRM. Vui lòng kiểm tra lại kết nối.",
    );
  }

  const since = await getLastSuccessfulSyncTime();

  // 1. Quét phiếu việc hoàn thành / tài chính từ CCTV
  const cctvOrders = await queryCctv<{
    id: string;
    code: string;
    customer_id: string;
    type: string;
    status: string;
    description: string;
    labor_cost: string;
    material_cost: string;
    vat_rate: string;
    completion_note?: string;
    accepted_at?: Date;
    created_at: Date;
    updated_at: Date;
    total_amount?: string;
    paid_amount?: string;
    debt_amount?: string;
    payment_status?: string;
    payment_method?: string;
    debt_due_date?: Date;
    payment_note?: string;
    confirmed_at?: Date;
  }>(
    `SELECT
       wo.id, wo.code, wo.customer_id, wo.type, wo.status, wo.description,
       wo.labor_cost, wo.material_cost, wo.vat_rate, wo.completion_note, wo.accepted_at,
       wo.created_at, wo.updated_at,
       p.total_amount, p.paid_amount, p.debt_amount, p.status AS payment_status,
       p.method AS payment_method, p.debt_due_date, p.note AS payment_note, p.confirmed_at
     FROM work_orders wo
     LEFT JOIN payments p ON p.work_order_id = wo.id
     WHERE wo.status IN ('completed', 'awaiting_payment', 'paid', 'debt')
       AND wo.updated_at > $1
     ORDER BY wo.updated_at ASC`,
    [since],
  );

  const orderIds = cctvOrders.rows.map((r) => r.id);
  const referencedCustomerIds = [...new Set(cctvOrders.rows.map((r) => r.customer_id))];

  // 2. Quét khách hàng từ CCTV (kể cả khách được cập nhật gần đây và khách thuộc các phiếu việc trên)
  let cctvCustomersRows: Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
    address_note?: string;
    lat?: string | number | null;
    lng?: string | number | null;
    created_at: Date;
    updated_at: Date;
  }> = [];

  if (referencedCustomerIds.length > 0) {
    const custRes = await queryCctv<{
      id: string;
      name: string;
      phone: string;
      address: string;
      address_note?: string;
      lat?: string | number | null;
      lng?: string | number | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT c.id, c.name, c.phone, c.address, c.address_note, c.lat, c.lng, c.created_at, c.updated_at
       FROM customers c
       WHERE c.updated_at > $1 OR c.id = ANY($2::uuid[])
       ORDER BY c.updated_at ASC`,
      [since, referencedCustomerIds],
    );
    cctvCustomersRows = custRes.rows;
  } else {
    const custRes = await queryCctv<{
      id: string;
      name: string;
      phone: string;
      address: string;
      address_note?: string;
      lat?: string | number | null;
      lng?: string | number | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT c.id, c.name, c.phone, c.address, c.address_note, c.lat, c.lng, c.created_at, c.updated_at
       FROM customers c
       WHERE c.updated_at > $1
       ORDER BY c.updated_at ASC`,
      [since],
    );
    cctvCustomersRows = custRes.rows;
  }

  const allCctvCustomerIds = cctvCustomersRows.map((r) => r.id);

  // 3. Quét toàn bộ danh bạ người liên hệ (contacts) của khách hàng từ CCTV trong 1 query
  const contactsByCustomerId = new Map<string, CustomerContactToSync[]>();
  if (allCctvCustomerIds.length > 0) {
    const contactsRes = await queryCctv<{
      customer_id: string;
      name: string;
      phone: string;
      note?: string;
      is_primary: boolean;
    }>(
      `SELECT customer_id, name, phone, note, is_primary
       FROM customer_contacts
       WHERE customer_id = ANY($1::uuid[])
       ORDER BY is_primary DESC, created_at ASC`,
      [allCctvCustomerIds],
    );
    for (const row of contactsRes.rows) {
      const list = contactsByCustomerId.get(row.customer_id) || [];
      list.push({
        name: (row.name || "").trim(),
        phone: (row.phone || "").trim(),
        note: row.note?.trim() || undefined,
        isPrimary: Boolean(row.is_primary),
      });
      contactsByCustomerId.set(row.customer_id, list);
    }
  }

  // 4. Quét linh kiện / vật tư (materials) của các phiếu việc từ CCTV trong 1 query
  const materialsByOrderId = new Map<string, WorkOrderMaterialToSync[]>();
  if (orderIds.length > 0) {
    const matRes = await queryCctv<{
      work_order_id: string;
      name: string;
      quantity: string | number;
      unit_price: string | number;
      line_total: string | number;
    }>(
      `SELECT work_order_id, name, quantity, unit_price, line_total
       FROM work_order_materials
       WHERE work_order_id = ANY($1::uuid[])`,
      [orderIds],
    );
    for (const m of matRes.rows) {
      const list = materialsByOrderId.get(m.work_order_id) || [];
      list.push({
        name: m.name.trim(),
        quantity: Number(m.quantity || 1),
        unitPrice: Number(m.unit_price || 0),
        lineTotal: Number(m.line_total || 0),
      });
      materialsByOrderId.set(m.work_order_id, list);
    }
  }

  // 5. Đối chiếu toàn bộ khách hàng với CRM trong 1 query duy nhất
  const phones = cctvCustomersRows
    .map((r) => (r.phone || "").trim())
    .filter(Boolean);

  let existingCrmCustomers: Array<{
    id: string;
    code: string;
    name: string;
    phone: string;
    address: string;
    notes: string;
    cctv_customer_id: string | null;
  }> = [];

  if (allCctvCustomerIds.length > 0 || phones.length > 0) {
    const res = await query<{
      id: string;
      code: string;
      name: string;
      phone: string;
      address: string;
      notes: string;
      cctv_customer_id: string | null;
    }>(
      `SELECT id, code, name, phone, address, notes, cctv_customer_id
       FROM customers
       WHERE (cctv_customer_id IS NOT NULL AND cctv_customer_id = ANY($1::uuid[]))
          OR (phone IS NOT NULL AND phone <> '' AND phone = ANY($2::text[]))`,
      [allCctvCustomerIds, phones],
    );
    existingCrmCustomers = res.rows;
  }

  const crmByCctvId = new Map<string, (typeof existingCrmCustomers)[0]>();
  const crmByPhone = new Map<string, (typeof existingCrmCustomers)[0]>();

  for (const c of existingCrmCustomers) {
    if (c.cctv_customer_id) crmByCctvId.set(c.cctv_customer_id, c);
    if (c.phone) crmByPhone.set(c.phone.trim(), c);
  }

  const toCreate: CustomerToCreate[] = [];
  const toUpdate: CustomerToUpdate[] = [];
  const customerNameMap = new Map<string, string>(); // cctvId -> Customer Name

  for (const c of cctvCustomersRows) {
    const rawContacts = contactsByCustomerId.get(c.id) || [];
    const primaryContact = rawContacts.find((ct) => ct.isPrimary) || rawContacts[0];
    const primaryPhone = (primaryContact?.phone || c.phone || "").trim();
    const primaryContactName = (primaryContact?.name || c.name || "").trim();
    const customerName = (c.name || "Khách hàng CCTV").trim();
    const address = (c.address || "").trim();
    const addressNote = c.address_note?.trim();
    const lat = c.lat ? Number(c.lat) : null;
    const lng = c.lng ? Number(c.lng) : null;

    customerNameMap.set(c.id, customerName);

    const existing = crmByCctvId.get(c.id) || (primaryPhone ? crmByPhone.get(primaryPhone) : undefined);

    if (existing) {
      toUpdate.push({
        id: existing.id,
        cctvId: c.id,
        currentName: existing.name,
        phone: primaryPhone,
        address,
        addressNote,
        lat,
        lng,
        notes: addressNote ? `Chỉ dẫn địa chỉ: ${addressNote}` : "",
        contacts: rawContacts,
      });
    } else {
      toCreate.push({
        cctvId: c.id,
        name: customerName,
        phone: primaryPhone,
        contactName: primaryContactName,
        address,
        addressNote,
        lat,
        lng,
        notes: addressNote ? `Chỉ dẫn địa chỉ: ${addressNote}` : "",
        type: detectCustomerType(customerName),
        contacts: rawContacts,
      });
    }
  }

  // 6. Đối chiếu phiếu việc đã có trong CRM chưa
  const existingOrderIdsSet = new Set<string>();
  if (orderIds.length > 0) {
    const invCheck = await query<{ cctv_work_order_id: string }>(
      `SELECT cctv_work_order_id FROM invoices
       WHERE cctv_work_order_id IS NOT NULL AND cctv_work_order_id = ANY($1::uuid[])`,
      [orderIds],
    );
    for (const r of invCheck.rows) {
      if (r.cctv_work_order_id) existingOrderIdsSet.add(r.cctv_work_order_id);
    }
  }

  const workOrders: WorkOrderToSync[] = [];

  for (const wo of cctvOrders.rows) {
    if (existingOrderIdsSet.has(wo.id)) continue;

    const businessType = mapBusinessType(wo.type);
    const laborCost = Number(wo.labor_cost || 0);
    const materialCost = Number(wo.material_cost || 0);
    const subtotal = laborCost + materialCost;
    const vatRate = Number(wo.vat_rate || 0);
    const vatAmount = Math.round(subtotal * (vatRate / 100));
    const totalAmount = wo.total_amount ? Number(wo.total_amount) : subtotal + vatAmount;
    const paidAmount = Number(wo.paid_amount || 0);
    const debtAmount = wo.debt_amount ? Number(wo.debt_amount) : Math.max(0, totalAmount - paidAmount);

    let pStatus: "unpaid" | "partial" | "paid" = "unpaid";
    if (wo.payment_status === "paid" || (totalAmount > 0 && paidAmount >= totalAmount)) {
      pStatus = "paid";
    } else if (paidAmount > 0) {
      pStatus = "partial";
    }

    const occurredAt = wo.accepted_at
      ? new Date(wo.accepted_at).toISOString().split("T")[0]
      : new Date(wo.updated_at).toISOString().split("T")[0];

    const customerName =
      customerNameMap.get(wo.customer_id) ||
      crmByCctvId.get(wo.customer_id)?.name ||
      "Khách hàng CCTV";

    const materials = materialsByOrderId.get(wo.id) || [];

    workOrders.push({
      cctvId: wo.id,
      code: wo.code,
      cctvCustomerId: wo.customer_id,
      customerName,
      businessType,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      costAmount: materialCost,
      paidAmount,
      debtAmount,
      paymentStatus: pStatus,
      paymentMethod: wo.payment_method || null,
      paymentNote: wo.payment_note || null,
      debtDueDate: wo.debt_due_date ? new Date(wo.debt_due_date).toISOString().split("T")[0] : null,
      confirmedAt: wo.confirmed_at ? new Date(wo.confirmed_at).toISOString() : null,
      description: wo.description,
      completionNote: wo.completion_note,
      occurredAt,
      materials,
    });
  }

  const totalRev = workOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = workOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDebt = workOrders.reduce((sum, o) => sum + o.debtAmount, 0);

  return {
    customers: {
      toCreate,
      toUpdate,
    },
    workOrders,
    summary: {
      newCustomersCount: toCreate.length,
      updateCustomersCount: toUpdate.length,
      newOrdersCount: workOrders.length,
      totalRevenue: totalRev,
      totalPaid,
      totalDebt,
    },
    scannedAt: new Date().toISOString(),
  };
}

/**
 * GIAI ĐOẠN 2: GHI VÀO CRM KHI NGƯỜI DÙNG PHÊ DUYỆT (COMMIT)
 * Đồng bộ toàn diện: Khách hàng + Danh bạ Liên hệ + Đơn hàng + Hóa đơn + Thanh toán + Công nợ + P&L
 */
export async function commitCctvSync(previewData: SyncPreviewData, actorId: string): Promise<SyncResult> {
  if (isSyncInProgress) {
    throw new ApiError(409, "Tiến trình đồng bộ đang chạy, vui lòng thử lại sau vài giây.");
  }

  isSyncInProgress = true;
  const startTime = Date.now();

  const logRes = await query<{ id: string }>(
    `INSERT INTO cctv_sync_logs (triggered_by, started_at, status)
     VALUES ($1, now(), 'running') RETURNING id`,
    [actorId],
  );
  const logId = logRes.rows[0]?.id;

  let customersCreated = 0;
  let customersUpdated = 0;
  let ordersSynced = 0;
  let invoicesSynced = 0;
  let paymentsSynced = 0;

  try {
    // Đảm bảo sản phẩm dịch vụ kỹ thuật mặc định có sẵn
    const serviceProd = await query<{ id: string }>(
      `SELECT id FROM products WHERE sku = 'DV-CCTV' LIMIT 1`,
    );
    let defaultProductId = serviceProd.rows[0]?.id;
    if (!defaultProductId) {
      const prodInsert = await query<{ id: string }>(
        `INSERT INTO products (sku, name, category, unit, unit_price, status, created_by, updated_by)
         VALUES ('DV-CCTV', 'Dịch vụ kỹ thuật & lắp đặt CCTV', 'Dịch vụ', 'lần', 0, 'active', $1, $1)
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [actorId],
      );
      defaultProductId = prodInsert.rows[0].id;
    }

    await transaction(async (client) => {
      // 1. Cập nhật khách hàng hiện có (chống đè thông tin đã sửa trên CRM)
      for (const u of previewData.customers.toUpdate) {
        const noteParts: string[] = [];
        if (u.notes) noteParts.push(u.notes);
        if (u.lat && u.lng) noteParts.push(`Tọa độ GPS: ${u.lat}, ${u.lng}`);
        const extraNote = noteParts.length > 0 ? noteParts.join("\n") : null;

        await client.query(
          `UPDATE customers
           SET
             cctv_customer_id = COALESCE(cctv_customer_id, $1),
             cctv_synced_at = now(),
             phone = CASE WHEN (phone IS NULL OR phone = '') THEN $2 ELSE phone END,
             address = CASE WHEN (address IS NULL OR address = '') THEN $3 ELSE address END,
             notes = CASE WHEN (notes IS NULL OR notes = '') THEN $4 ELSE notes END,
             updated_at = now()
           WHERE id = $5`,
          [u.cctvId, u.phone || null, u.address || null, extraNote, u.id],
        );

        // Bổ sung liên hệ chưa có
        for (const ct of u.contacts) {
          if (!ct.phone && !ct.name) continue;
          await client.query(
            `INSERT INTO contacts (customer_id, full_name, phone, is_primary, notes, created_by, updated_by)
             SELECT $1, $2, $3, $4, $5, $6, $6
             WHERE NOT EXISTS (
               SELECT 1 FROM contacts WHERE customer_id = $1 AND (phone = $3 OR full_name = $2)
             )`,
            [u.id, ct.name || "Liên hệ", ct.phone || null, ct.isPrimary, ct.note || null, actorId],
          );
        }

        customersUpdated++;
      }

      // 2. Thêm mới khách hàng
      const newCustomerMap = new Map<string, string>(); // cctvId -> new crmId

      for (const c of previewData.customers.toCreate) {
        const newCode = code("KH");
        const noteParts: string[] = [];
        if (c.notes) noteParts.push(c.notes);
        if (c.lat && c.lng) noteParts.push(`Tọa độ GPS: ${c.lat}, ${c.lng}`);
        const finalNotes = noteParts.length > 0 ? noteParts.join("\n") : null;

        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO customers (
             code, name, type, phone, address, notes, source,
             cctv_customer_id, cctv_synced_at, owner_id, created_by, updated_by
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'CCTV Sync', $7, now(), $8, $8, $8)
           RETURNING id`,
          [newCode, c.name, c.type, c.phone || null, c.address || null, finalNotes, c.cctvId, actorId],
        );
        const newCustomerId = insertRes.rows[0].id;
        newCustomerMap.set(c.cctvId, newCustomerId);

        // Lưu toàn bộ liên hệ
        if (c.contacts && c.contacts.length > 0) {
          for (const ct of c.contacts) {
            await client.query(
              `INSERT INTO contacts (customer_id, full_name, phone, is_primary, notes, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6)`,
              [newCustomerId, ct.name || c.name, ct.phone || null, ct.isPrimary, ct.note || null, actorId],
            );
          }
        } else if (c.contactName || c.phone) {
          await client.query(
            `INSERT INTO contacts (customer_id, full_name, phone, is_primary, created_by, updated_by)
             VALUES ($1, $2, $3, true, $4, $4)`,
            [newCustomerId, c.contactName || c.name, c.phone || null, actorId],
          );
        }

        customersCreated++;
      }

      // Tra cứu nhanh tất cả customerId cho phiếu việc
      const allCctvCustomerIds = previewData.workOrders.map((w) => w.cctvCustomerId);
      const crmCustomerLookup = await client.query<{ id: string; cctv_customer_id: string }>(
        `SELECT id, cctv_customer_id FROM customers
         WHERE cctv_customer_id IS NOT NULL AND cctv_customer_id = ANY($1::uuid[])`,
        [allCctvCustomerIds],
      );
      const crmCustMap = new Map<string, string>();
      for (const r of crmCustomerLookup.rows) {
        crmCustMap.set(r.cctv_customer_id, r.id);
      }

      // 3. Ghi nhận phiếu việc vào orders, invoices, payments, revenue_entries, tasks
      for (const wo of previewData.workOrders) {
        const crmCustomerId = crmCustMap.get(wo.cctvCustomerId) || newCustomerMap.get(wo.cctvCustomerId);
        if (!crmCustomerId) continue;

        // A. Đơn hàng (orders)
        const orderCode = `DH-${wo.code}`;
        const orderRes = await client.query<{ id: string }>(
          `INSERT INTO orders (
             code, customer_id, status, total, business_type, business_line,
             cctv_work_order_id, owner_id, created_by, updated_by
           ) VALUES (
             $1, $2, 'completed', $3, $4, $4, $5, $6, $6, $6
           )
           ON CONFLICT (cctv_work_order_id) DO UPDATE
             SET total = EXCLUDED.total,
                 business_type = EXCLUDED.business_type,
                 business_line = EXCLUDED.business_line,
                 updated_at = now()
           RETURNING id`,
          [orderCode, crmCustomerId, wo.totalAmount, wo.businessType, wo.cctvId, actorId],
        );
        const orderId = orderRes.rows[0]?.id;

        // B. Chi tiết dòng đơn hàng (order_lines)
        if (orderId) {
          // Xóa dòng cũ nếu có để ghi lại chính xác
          await client.query(`DELETE FROM order_lines WHERE order_id = $1`, [orderId]);

          if (wo.materials && wo.materials.length > 0) {
            for (const m of wo.materials) {
              await client.query(
                `INSERT INTO order_lines (
                   order_id, product_id, product_name, qty, unit_price, line_total, cost_price, business_type
                 ) VALUES ($1, $2, $3, $4, $5, $6, $5, $7)`,
                [orderId, defaultProductId, m.name, m.quantity, m.unitPrice, m.lineTotal, wo.businessType],
              );
            }
          } else {
            await client.query(
              `INSERT INTO order_lines (
                 order_id, product_id, product_name, qty, unit_price, line_total, cost_price, business_type
               ) VALUES ($1, $2, $3, 1, $4, $4, $5, $6)`,
              [
                orderId,
                defaultProductId,
                `Dịch vụ ${wo.code}: ${wo.description || "Thi công kỹ thuật"}`,
                wo.subtotal,
                wo.costAmount,
                wo.businessType,
              ],
            );
          }
          ordersSynced++;
        }

        // C. Hóa đơn (invoices)
        const invoiceCode = `HD-${wo.code}`;
        const dueDate = wo.debtDueDate || null;

        const invRes = await client.query<{ id: string }>(
          `INSERT INTO invoices (
             code, customer_id, order_id, status, amount, paid_amount, cogs_amount,
             due_date, business_type, business_line, cctv_work_order_id, owner_id, created_by, updated_by
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $11, $11
           )
           ON CONFLICT (cctv_work_order_id) DO UPDATE
             SET amount = EXCLUDED.amount,
                 paid_amount = EXCLUDED.paid_amount,
                 cogs_amount = EXCLUDED.cogs_amount,
                 status = EXCLUDED.status,
                 due_date = EXCLUDED.due_date,
                 updated_at = now()
           RETURNING id`,
          [
            invoiceCode,
            crmCustomerId,
            orderId,
            wo.paymentStatus,
            wo.totalAmount,
            wo.paidAmount,
            wo.costAmount,
            dueDate,
            wo.businessType,
            wo.cctvId,
            actorId,
          ],
        );
        const invoiceId = invRes.rows[0]?.id;
        if (invoiceId) invoicesSynced++;

        // D. Phiếu thu / Thanh toán (payments)
        if (invoiceId && wo.paidAmount > 0) {
          const paymentCode = `TT-${wo.code}`;
          const paymentMethod = wo.paymentMethod === "bank_transfer" ? "transfer" : "cash";
          const paidAt = wo.confirmedAt || wo.occurredAt;
          const paymentNote = wo.paymentNote || `Thanh toán phiếu CCTV ${wo.code}`;

          await client.query(
            `INSERT INTO payments (
               code, invoice_id, customer_id, amount, method, paid_at,
               note, cctv_work_order_id, owner_id, created_by, updated_by
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9
             )
             ON CONFLICT (cctv_work_order_id) DO UPDATE
               SET amount = EXCLUDED.amount,
                   method = EXCLUDED.method,
                   paid_at = EXCLUDED.paid_at,
                   note = EXCLUDED.note,
                   updated_at = now()`,
            [
              paymentCode,
              invoiceId,
              crmCustomerId,
              wo.paidAmount,
              paymentMethod,
              paidAt,
              paymentNote,
              wo.cctvId,
              actorId,
            ],
          );
          paymentsSynced++;
        }

        // E. Doanh thu P&L nội bộ (revenue_entries)
        if (wo.totalAmount > 0) {
          const revCode = code("DT");
          await client.query(
            `INSERT INTO revenue_entries (
               code, occurred_at, customer_id, product_id, invoice_id, document_code,
               business_type, qty, unit_price, vat_percent, subtotal,
               vat_amount, total_amount, cost_amount, payment_status,
               paid_amount, note, cctv_work_order_id, created_by, updated_by
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $8, $10, $11, $12, $13, $14, $15, $16, $17, $17
             )
             ON CONFLICT (cctv_work_order_id) DO UPDATE
               SET invoice_id = EXCLUDED.invoice_id,
                   total_amount = EXCLUDED.total_amount,
                   paid_amount = EXCLUDED.paid_amount,
                   payment_status = EXCLUDED.payment_status,
                   updated_at = now()`,
            [
              revCode,
              wo.occurredAt,
              crmCustomerId,
              defaultProductId,
              invoiceId || null,
              wo.code,
              wo.businessType,
              wo.subtotal,
              wo.vatRate,
              wo.vatAmount,
              wo.totalAmount,
              wo.costAmount,
              wo.paymentStatus,
              wo.paidAmount,
              `Phiếu CCTV: ${wo.code} - ${wo.completionNote || wo.description || ""}`.trim(),
              wo.cctvId,
              actorId,
            ],
          );
        }

        // F. Lịch sử công việc kỹ thuật (tasks)
        const taskTitle = `[CCTV ${wo.code}] ${wo.description ? wo.description.slice(0, 100) : "Dịch vụ hiện trường"}`;
        const taskNotes = `${wo.description || ""}${wo.completionNote ? `\nNghiệm thu: ${wo.completionNote}` : ""}`.trim();

        await client.query(
          `INSERT INTO tasks (
             title, type, status, customer_id, notes, completed_at,
             cctv_work_order_id, created_by, updated_by
           ) VALUES ($1, 'service', 'completed', $2, $3, $4, $5, $6, $6)
           ON CONFLICT (cctv_work_order_id) DO UPDATE
             SET notes = EXCLUDED.notes, completed_at = EXCLUDED.completed_at, updated_at = now()`,
          [taskTitle, crmCustomerId, taskNotes || null, wo.occurredAt, wo.cctvId, actorId],
        );
      }
    });

    const durationMs = Date.now() - startTime;

    if (logId) {
      await query(
        `UPDATE cctv_sync_logs
         SET status = 'success', completed_at = now(),
             customers_count = $1, orders_count = $2
         WHERE id = $3`,
        [customersCreated + customersUpdated, ordersSynced, logId],
      );
    }

    return {
      success: true,
      customersCreated,
      customersUpdated,
      ordersSynced,
      invoicesSynced,
      paymentsSynced,
      durationMs,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (logId) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await query(
        `UPDATE cctv_sync_logs
         SET status = 'failed', completed_at = now(), error_message = $1
         WHERE id = $2`,
        [errMsg, logId],
      );
    }
    throw err;
  } finally {
    isSyncInProgress = false;
  }
}
