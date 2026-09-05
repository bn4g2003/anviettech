import type { PoolClient } from "pg";
import { query, transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";

export type ListOptions = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  ownerId?: string;
  customerId?: string;
  dealId?: string;
  sort?: string;
  direction?: "asc" | "desc";
  actorId: string;
  canViewAll: boolean;
  type?: string;
  due?: "overdue" | "today" | "upcoming";
  scope?: "my";
};

type ResourceConfig = {
  module: string;
  table: string;
  select: string;
  search: string[];
  sort: string[];
  ownerColumn?: string | null;
  statusColumn?: string;
  hasDeletedAt?: boolean;
};

const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  customers: {
    module: "customers",
    table: "customers",
    select: `id, code, name, type, status, email, phone, address, source, owner_id AS "ownerId", campaign_id AS "campaignId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code", "email", "phone"],
    sort: ["name", "code", "created_at", "updated_at"],
  },
  leads: {
    module: "leads",
    table: "leads",
    select: `id, code, name, company_name AS "companyName", email, phone, source, status, owner_id AS "ownerId", campaign_id AS "campaignId", notes, lost_reason AS "lostReason", converted_customer_id AS "convertedCustomerId", converted_at AS "convertedAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code", "company_name", "email", "phone"],
    sort: ["name", "code", "created_at", "updated_at"],
  },
  products: {
    module: "products",
    table: "products",
    select: `id, sku, name, category, unit, unit_price AS "unitPrice", cost_price AS "costPrice", vat_percent AS "vatPercent", min_stock AS "minStock", item_type AS "itemType", status, description, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "sku", "category"],
    sort: ["name", "sku", "created_at", "updated_at"],
    ownerColumn: null,
  },
  deals: {
    module: "deals",
    table: "deals",
    select: `id, code, title, customer_id AS "customerId", contact_id AS "contactId", stage, value, probability, expected_close_date AS "expectedCloseDate", owner_id AS "ownerId", notes, closed_reason AS "closedReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["title", "code"],
    sort: ["title", "code", "value", "created_at", "updated_at"],
    statusColumn: "stage",
  },
  tasks: {
    module: "tasks",
    table: "tasks",
    select: `id, title, type, status, due_at AS "dueAt", owner_id AS "ownerId", customer_id AS "customerId", lead_id AS "leadId", deal_id AS "dealId", notes, completed_at AS "completedAt", completed_by AS "completedBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["title"],
    sort: ["title", "due_at", "created_at", "updated_at"],
  },
  campaigns: {
    module: "campaigns",
    table: "campaigns",
    select: `id, code, name, channel, status, budget, spent, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code"],
    sort: ["name", "code", "created_at", "updated_at"],
  },
  quotes: {
    module: "quotes",
    table: "quotes",
    select: `id, code, customer_id AS "customerId", deal_id AS "dealId", status, valid_until AS "validUntil", owner_id AS "ownerId", terms, subtotal, total, approved_at AS "approvedAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code"],
    sort: ["code", "total", "created_at", "updated_at"],
  },
  orders: {
    module: "orders",
    table: "orders",
    select: `id, code, customer_id AS "customerId", contract_id AS "contractId", quote_id AS "quoteId", status, owner_id AS "ownerId", total, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code"],
    sort: ["code", "total", "created_at", "updated_at"],
  },
  contracts: {
    module: "contracts",
    table: "contracts",
    select: `id, code, customer_id AS "customerId", quote_id AS "quoteId", deal_id AS "dealId", status, value, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", terms, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code"],
    sort: ["code", "value", "created_at", "updated_at"],
  },
  invoices: {
    module: "finance",
    table: "invoices",
    select: `id, code, customer_id AS "customerId", order_id AS "orderId", contract_id AS "contractId", status, amount, paid_amount AS "paidAmount", due_date AS "dueDate", owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code"],
    sort: ["code", "amount", "due_date", "created_at", "updated_at"],
  },
  payments: {
    module: "finance",
    table: "payments",
    select: `id, code, invoice_id AS "invoiceId", customer_id AS "customerId", amount, method, paid_at AS "paidAt", owner_id AS "ownerId", note, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code"],
    sort: ["code", "amount", "paid_at", "created_at"],
  },
  contacts: {
    module: "contacts",
    table: "contacts",
    select: `id, customer_id AS "customerId", full_name AS "fullName", job_title AS "jobTitle", email, phone, is_primary AS "isPrimary", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["full_name", "email", "phone"],
    sort: ["full_name", "created_at", "updated_at"],
    ownerColumn: null,
  },
  activities: {
    module: "activities",
    table: "activities",
    select: `id, type, subject, content, occurred_at AS "occurredAt", owner_id AS "ownerId", customer_id AS "customerId", lead_id AS "leadId", deal_id AS "dealId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["subject", "content"],
    sort: ["occurred_at", "created_at"],
  },
  warehouses: {
    module: "inventory",
    table: "warehouses",
    select: `id, code, name, address, is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code"],
    sort: ["name", "code", "created_at"],
    ownerColumn: null,
  },
  suppliers: {
    module: "suppliers",
    table: "suppliers",
    select: `id, code, name, contact_name AS "contactName", phone, email, address, status, notes, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code", "contact_name", "phone", "email"],
    sort: ["name", "code", "created_at", "updated_at"],
  },
  projects: {
    module: "projects",
    table: "projects",
    select: `id, code, name, customer_id AS "customerId", address, status, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["name", "code", "address"],
    sort: ["name", "code", "start_date", "created_at", "updated_at"],
  },
  stock_moves: {
    module: "inventory",
    table: "stock_moves",
    select: `id, code, type, reason, status, order_id AS "orderId", warehouse_from_id AS "warehouseFromId", warehouse_to_id AS "warehouseToId", supplier_id AS "supplierId", customer_id AS "customerId", project_id AS "projectId", owner_id AS "ownerId", note, posted_at AS "postedAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code", "note"],
    sort: ["code", "created_at", "updated_at"],
  },
  serial_numbers: {
    module: "inventory", table: "serial_numbers",
    select: `id, product_id AS "productId", serial, warehouse_id AS "warehouseId", customer_id AS "customerId", project_id AS "projectId", status, warranty_until AS "warrantyUntil", note, created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["serial"], sort: ["serial", "created_at", "updated_at"], ownerColumn: null,
  },
  inventory_counts: {
    module: "inventory", table: "inventory_counts",
    select: `id, code, warehouse_id AS "warehouseId", status, counted_at AS "countedAt", note, owner_id AS "ownerId", posted_at AS "postedAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    search: ["code", "note"], sort: ["counted_at", "created_at", "updated_at"],
  },
  operating_expenses: {
    module: "finance", table: "operating_expenses",
    select: `id, COALESCE(code,'') AS code, COALESCE(category,expense_category) AS category, amount, COALESCE(period_date,expense_date) AS "expenseDate", COALESCE(notes,description) AS note, created_at AS "createdAt"`,
    search: ["code", "description", "notes"], sort: ["expense_date", "period_date", "created_at"], ownerColumn: null,
  },
  revenue_entries: {
    module: "finance", table: "revenue_entries",
    select: `id,code,occurred_at AS "occurredAt",customer_id AS "customerId",project_id AS "projectId",product_id AS "productId",employee_id AS "employeeId",invoice_id AS "invoiceId",document_code AS "documentCode",business_type AS "businessType",qty,unit_price AS "unitPrice",vat_percent AS "vatPercent",subtotal,vat_amount AS "vatAmount",total_amount AS "totalAmount",cost_amount AS "costAmount",payment_status AS "paymentStatus",paid_amount AS "paidAmount",note,created_at AS "createdAt"`,
    search: ["code", "document_code", "note"], sort: ["occurred_at", "total_amount", "created_at"], ownerColumn: null,
  },
  revenue_reductions: {
    module: "finance", table: "revenue_reductions",
    select: `id,code,occurred_at AS "occurredAt",customer_id AS "customerId",revenue_entry_id AS "revenueEntryId",type,amount,note,created_at AS "createdAt"`,
    search: ["code", "note"], sort: ["occurred_at", "amount", "created_at"], ownerColumn: null,
  },
};

export type ResourceName = keyof typeof RESOURCE_CONFIG;

export function getResource(name: string) {
  const config = RESOURCE_CONFIG[name];
  if (!config) throw new ApiError(404, "Phân hệ không tồn tại");
  return config;
}

export function code(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function listResource(name: ResourceName, options: ListOptions) {
  const config = getResource(name);
  const values: unknown[] = [];
  const where: string[] = [];
  if (config.hasDeletedAt !== false) where.push("deleted_at IS NULL");

  const ownerCol = config.ownerColumn === undefined ? "owner_id" : config.ownerColumn;
  if (name === "contacts" && !options.canViewAll) {
    values.push(options.actorId);
    where.push(`EXISTS (SELECT 1 FROM customers c WHERE c.id=${config.table}.customer_id AND c.owner_id=$${values.length} AND c.deleted_at IS NULL)`);
  } else if (ownerCol && !options.canViewAll) {
    values.push(options.actorId);
    where.push(`${ownerCol}=$${values.length}`);
  }
  if (options.scope === "my" && ownerCol) {
    values.push(options.actorId);
    where.push(`${ownerCol}=$${values.length}`);
  }
  if (options.status) {
    const statusCol = config.statusColumn ?? "status";
    values.push(options.status);
    where.push(`${statusCol}=$${values.length}`);
  }
  if (options.type && (name === "tasks" || name === "activities" || name === "stock_moves")) {
    values.push(options.type);
    where.push(`type=$${values.length}`);
  }
  if (options.due && name === "tasks") {
    where.push(`status='open'`);
    if (options.due === "overdue") {
      where.push(`due_at < now()`);
    } else if (options.due === "today") {
      where.push(`due_at::date = CURRENT_DATE`);
    } else if (options.due === "upcoming") {
      where.push(`due_at::date > CURRENT_DATE`);
    }
  }
  if (options.ownerId && options.canViewAll && ownerCol) {
    values.push(options.ownerId);
    where.push(`${ownerCol}=$${values.length}`);
  }
  if (options.customerId && (name === "contacts" || name === "activities" || name === "tasks" || name === "deals" || name === "quotes" || name === "orders" || name === "contracts" || name === "invoices" || name === "payments" || name === "revenue_entries" || name === "revenue_reductions")) {
    values.push(options.customerId);
    where.push(`customer_id=$${values.length}`);
  }
  if (options.dealId && (name === "activities" || name === "tasks")) {
    values.push(options.dealId);
    where.push(`deal_id=$${values.length}`);
  }
  if (options.search) {
    values.push(`%${options.search}%`);
    where.push(`(${config.search.map((field) => `${field} ILIKE $${values.length}`).join(" OR ")})`);
  }

  const filter = where.length ? where.join(" AND ") : "TRUE";
  const sort = config.sort.includes(options.sort as never) ? options.sort! : config.sort.includes("updated_at") ? "updated_at" : config.sort[0];
  const direction = options.direction === "asc" ? "ASC" : "DESC";
  values.push(options.pageSize, (options.page - 1) * options.pageSize);

  const [rows, count] = await Promise.all([
    query(`SELECT ${config.select} FROM ${config.table} WHERE ${filter} ORDER BY ${sort} ${direction} LIMIT $${values.length - 1} OFFSET $${values.length}`, values),
    query<{ total: string }>(`SELECT count(*)::text total FROM ${config.table} WHERE ${filter}`, values.slice(0, -2)),
  ]);
  const total = Number(count.rows[0].total);
  if (name === "quotes" && rows.rows.length) {
    const quoteIds = rows.rows.map((row) => String(row.id));
    const lines = await query<{
      id: string; quoteId: string; productId: string; productName: string; qty: string;
      unitPrice: string; discountPercent: string; vatPercent: string; lineTotal: string;
    }>(
      `SELECT id, quote_id AS "quoteId", product_id AS "productId", product_name AS "productName", qty,
              unit_price AS "unitPrice", discount_percent AS "discountPercent", vat_percent AS "vatPercent", line_total AS "lineTotal"
       FROM quote_lines WHERE quote_id = ANY($1::uuid[])`,
      [quoteIds],
    );
    const linesByQuote = new Map<string, typeof lines.rows>();
    for (const line of lines.rows) linesByQuote.set(line.quoteId, [...(linesByQuote.get(line.quoteId) ?? []), line]);
    return { rows: rows.rows.map((row) => ({ ...row, lines: linesByQuote.get(String(row.id)) ?? [] })), meta: { page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) || 1 } };
  }
  return { rows: rows.rows, meta: { page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) || 1 } };
}

export async function createCustomer(
  input: { name: string; type: string; email?: string; phone?: string; address?: string; source?: string; ownerId?: string; notes?: string; campaignId?: string },
  actorId: string,
) {
  const result = await query(
    `INSERT INTO customers(code,name,type,email,phone,address,source,owner_id,campaign_id,notes,created_by,updated_by)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
     RETURNING id,code,name,type,status,email,phone,address,source,owner_id AS "ownerId",campaign_id AS "campaignId",notes`,
    [code("KH"), input.name, input.type, input.email || null, input.phone ?? null, input.address ?? null, input.source ?? null, input.ownerId ?? actorId, input.campaignId ?? null, input.notes ?? null, actorId],
  );
  return result.rows[0];
}

export async function convertLead(
  leadId: string,
  actorId: string,
  input: { customerName: string; contactName?: string; createDeal: boolean; dealTitle?: string; dealValue?: number },
) {
  return transaction(async (client: PoolClient) => {
    const lead = await client.query<{
      id: string; name: string; company_name: string | null; email: string | null; phone: string | null;
      owner_id: string | null; status: string; campaign_id: string | null;
    }>("SELECT * FROM leads WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [leadId]);
    if (!lead.rows[0]) throw new ApiError(404, "Không tìm thấy lead");
    if (lead.rows[0].status === "converted") throw new ApiError(409, "Lead đã được chuyển đổi");
    const row = lead.rows[0];
    const customer = await client.query<{ id: string }>(
      `INSERT INTO customers(code,name,type,email,phone,source,owner_id,campaign_id,created_by,updated_by)
       VALUES($1,$2,'company',$3,$4,'Lead',$5,$6,$7,$7) RETURNING id`,
      [code("KH"), input.customerName, row.email, row.phone, row.owner_id ?? actorId, row.campaign_id, actorId],
    );
    if (input.contactName || row.name) {
      await client.query(
        "INSERT INTO contacts(customer_id,full_name,email,phone,is_primary,created_by,updated_by) VALUES($1,$2,$3,$4,true,$5,$5)",
        [customer.rows[0].id, input.contactName ?? row.name, row.email, row.phone, actorId],
      );
    }
    let dealId: string | null = null;
    if (input.createDeal) {
      const deal = await client.query<{ id: string }>(
        "INSERT INTO deals(code,title,customer_id,value,owner_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING id",
        [code("CH"), input.dealTitle ?? `Cơ hội từ ${input.customerName}`, customer.rows[0].id, input.dealValue ?? 0, row.owner_id ?? actorId, actorId],
      );
      dealId = deal.rows[0].id;
    }
    await client.query(
      "UPDATE leads SET status='converted',converted_customer_id=$1,converted_at=now(),updated_at=now(),updated_by=$2 WHERE id=$3",
      [customer.rows[0].id, actorId, leadId],
    );
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'leads','convert','lead',$2,$3)",
      [actorId, leadId, JSON.stringify({ customerId: customer.rows[0].id, dealId })],
    );
    return { customerId: customer.rows[0].id, dealId };
  });
}
