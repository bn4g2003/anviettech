import type { PoolClient } from "pg";
import { createHash } from "node:crypto";
import { query, transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { code } from "@/features/crm/services/crm-service";
import {
  assertContactBelongsToCustomer,
  assertCustomerExists,
  assertDealBelongsToCustomer,
  assertLinkedEntitiesConsistent,
  DOCUMENT_ENTITY_TYPES,
  resolveDocumentEntityOwner,
} from "@/features/crm/services/relation-guards";
import { assertDealStageTransition, assertTaskStatusTransition } from "@/features/crm/workflows/state-machines";
import { hasScopeAll, type CurrentUser } from "@/features/auth/services/permission-utils";

async function audit(client: PoolClient | typeof query, actorId: string, module: string, action: string, entityType: string, entityId: string, after?: unknown, before?: unknown) {
  const q = typeof client === "function" ? client : client.query.bind(client);
  await q("INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,before_data,after_data) VALUES($1,$2,$3,$4,$5,$6,$7)", [
    actorId, module, action, entityType, entityId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null,
  ]);
}

function lineTotal(qty: number, unitPrice: number, discountPercent: number, vatPercent: number) {
  const base = qty * unitPrice * (1 - discountPercent / 100);
  return Math.round((base * (1 + vatPercent / 100)) * 100) / 100;
}

// —— Leads ——
export async function createLead(input: {
  name: string; companyName?: string; email?: string; phone?: string; source?: string;
  ownerId?: string; campaignId?: string; notes?: string;
}, actorId: string) {
  const result = await query(
    `INSERT INTO leads(code,name,company_name,email,phone,source,owner_id,campaign_id,notes,created_by,updated_by)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
     RETURNING id, code, name, company_name AS "companyName", email, phone, source, status, owner_id AS "ownerId", campaign_id AS "campaignId", notes`,
    [code("TN"), input.name, input.companyName ?? null, input.email || null, input.phone ?? null, input.source ?? null, input.ownerId ?? actorId, input.campaignId ?? null, input.notes ?? null, actorId],
  );
  return result.rows[0];
}

export async function getLead(id: string) {
  const result = await query(`SELECT id, code, name, company_name AS "companyName", email, phone, source, status, owner_id AS "ownerId", campaign_id AS "campaignId", notes, lost_reason AS "lostReason", converted_customer_id AS "convertedCustomerId", converted_at AS "convertedAt", created_at AS "createdAt", updated_at AS "updatedAt" FROM leads WHERE id=$1 AND deleted_at IS NULL`, [id]);
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy lead");
  return result.rows[0];
}

export async function updateLead(id: string, input: Partial<{ name: string; companyName: string; email: string; phone: string; source: string; ownerId: string; campaignId: string; notes: string }>, actorId: string) {
  const current = await getLead(id);
  if (current.status === "converted") throw new ApiError(409, "Không thể sửa lead đã chuyển đổi");
  if (input.ownerId && input.ownerId !== current.ownerId) {
    await audit(query, actorId, "leads", "reassign", "lead", id, { from: current.ownerId, to: input.ownerId });
  }
  const result = await query(
    `UPDATE leads SET name=COALESCE($1,name), company_name=COALESCE($2,company_name), email=COALESCE($3,email), phone=COALESCE($4,phone),
     source=COALESCE($5,source), owner_id=COALESCE($6,owner_id), campaign_id=COALESCE($7,campaign_id), notes=COALESCE($8,notes),
     updated_at=now(), updated_by=$9 WHERE id=$10 AND deleted_at IS NULL
     RETURNING id, code, name, company_name AS "companyName", email, phone, source, status, owner_id AS "ownerId", campaign_id AS "campaignId", notes`,
    [input.name ?? null, input.companyName ?? null, input.email ?? null, input.phone ?? null, input.source ?? null, input.ownerId ?? null, input.campaignId ?? null, input.notes ?? null, actorId, id],
  );
  return result.rows[0];
}

export async function qualifyLead(id: string, actorId: string) {
  const current = await getLead(id);
  if (!["new", "contacted"].includes(current.status as string) && current.status !== "qualified") {
    if (current.status === "converted" || current.status === "lost") throw new ApiError(409, "Lead không thể đánh dấu đủ điều kiện");
  }
  await query("UPDATE leads SET status='qualified', updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await audit(query, actorId, "leads", "qualify", "lead", id, { status: "qualified" });
  return getLead(id);
}

export async function disqualifyLead(id: string, reason: string, actorId: string) {
  const current = await getLead(id);
  if (current.status === "converted") throw new ApiError(409, "Lead đã chuyển đổi");
  await query("UPDATE leads SET status='lost', lost_reason=$1, updated_at=now(), updated_by=$2 WHERE id=$3", [reason, actorId, id]);
  await audit(query, actorId, "leads", "disqualify", "lead", id, { status: "lost", reason });
  return getLead(id);
}

export async function softDeleteLead(id: string, actorId: string) {
  const current = await getLead(id);
  if (current.status === "converted") throw new ApiError(409, "Không thể xóa lead đã chuyển đổi");
  await query("UPDATE leads SET deleted_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
}

// —— Customers ——
export async function getCustomer(id: string) {
  const result = await query(
    `SELECT id, code, name, type, status, email, phone, address, source, owner_id AS "ownerId", campaign_id AS "campaignId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM customers WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy khách hàng");
  return result.rows[0];
}

export async function updateCustomer(id: string, input: Partial<{ name: string; type: string; email: string; phone: string; address: string; source: string; ownerId: string; notes: string; status: string; campaignId: string }>, actorId: string) {
  const current = await getCustomer(id);
  if (input.ownerId && input.ownerId !== current.ownerId) {
    await audit(query, actorId, "customers", "reassign", "customer", id, { from: current.ownerId, to: input.ownerId });
  }
  const result = await query(
    `UPDATE customers SET name=COALESCE($1,name), type=COALESCE($2,type), email=COALESCE($3,email), phone=COALESCE($4,phone),
     address=COALESCE($5,address), source=COALESCE($6,source), owner_id=COALESCE($7,owner_id), notes=COALESCE($8,notes),
     status=COALESCE($9,status), campaign_id=COALESCE($10,campaign_id), updated_at=now(), updated_by=$11
     WHERE id=$12 AND deleted_at IS NULL
     RETURNING id, code, name, type, status, email, phone, address, source, owner_id AS "ownerId", campaign_id AS "campaignId", notes`,
    [input.name ?? null, input.type ?? null, input.email ?? null, input.phone ?? null, input.address ?? null, input.source ?? null, input.ownerId ?? null, input.notes ?? null, input.status ?? null, input.campaignId ?? null, actorId, id],
  );
  return result.rows[0];
}

export async function softDeleteCustomer(id: string, actorId: string) {
  await getCustomer(id);
  const refs = await query<{ n: string }>(
    `SELECT (
      (SELECT count(*) FROM quotes WHERE customer_id=$1 AND deleted_at IS NULL) +
      (SELECT count(*) FROM orders WHERE customer_id=$1 AND deleted_at IS NULL) +
      (SELECT count(*) FROM contracts WHERE customer_id=$1 AND deleted_at IS NULL) +
      (SELECT count(*) FROM invoices WHERE customer_id=$1 AND deleted_at IS NULL)
    )::text n`, [id],
  );
  if (Number(refs.rows[0].n) > 0) throw new ApiError(409, "Không thể xóa khách hàng đã có chứng từ. Hãy vô hiệu hóa.");
  await query("UPDATE customers SET deleted_at=now(), status='inactive', updated_by=$1 WHERE id=$2", [actorId, id]);
}

export async function getCustomerWorkspace(id: string) {
  const customer = await getCustomer(id);
  const [contacts, activities, tasks, deals, quotes, orders, contracts, invoices, documents, audits] = await Promise.all([
    query(`SELECT id, full_name AS "fullName", job_title AS "jobTitle", email, phone, is_primary AS "isPrimary", notes FROM contacts WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY is_primary DESC, full_name`, [id]),
    query(`SELECT id, type, subject, content, occurred_at AS "occurredAt", owner_id AS "ownerId" FROM activities WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY occurred_at DESC LIMIT 50`, [id]),
    query(`SELECT id, title, type, status, due_at AS "dueAt", owner_id AS "ownerId" FROM tasks WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY due_at NULLS LAST`, [id]),
    query(`SELECT id, code, title, stage, value, owner_id AS "ownerId" FROM deals WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY updated_at DESC`, [id]),
    query(`SELECT id, code, status, total, valid_until AS "validUntil" FROM quotes WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [id]),
    query(`SELECT id, code, status, total FROM orders WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [id]),
    query(`SELECT id, code, status, value FROM contracts WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [id]),
    query(`SELECT id, code, status, amount, paid_amount AS "paidAmount", due_date AS "dueDate" FROM invoices WHERE customer_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [id]),
    query(`SELECT id, original_name AS "originalName", storage_key AS "storageKey", mime_type AS "mimeType", size_bytes AS "sizeBytes", created_at AS "createdAt" FROM documents WHERE entity_type='customer' AND entity_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [id]),
    query(`SELECT id, actor_id AS "actorId", module, action, entity_type AS "entityType", entity_id AS "entityId", created_at AS "createdAt", after_data AS "afterData" FROM audit_logs WHERE (entity_type='customer' AND entity_id=$1) OR entity_id IN (SELECT id FROM deals WHERE customer_id=$1) ORDER BY created_at DESC LIMIT 50`, [id]),
  ]);
  const debt = invoices.rows.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paidAmount)), 0);
  return {
    customer,
    contacts: contacts.rows,
    activities: activities.rows,
    tasks: tasks.rows,
    deals: deals.rows,
    quotes: quotes.rows,
    orders: orders.rows,
    contracts: contracts.rows,
    invoices: invoices.rows,
    documents: documents.rows,
    audits: audits.rows,
    debt,
  };
}

// —— Contacts ——
export async function getContact(id: string) {
  const result = await query<{
    id: string; customerId: string; fullName: string; jobTitle: string | null;
    email: string | null; phone: string | null; isPrimary: boolean; notes: string | null;
    customerOwnerId: string | null;
  }>(
    `SELECT ct.id, ct.customer_id AS "customerId", ct.full_name AS "fullName", ct.job_title AS "jobTitle",
      ct.email, ct.phone, ct.is_primary AS "isPrimary", ct.notes,
      c.owner_id AS "customerOwnerId"
     FROM contacts ct
     JOIN customers c ON c.id=ct.customer_id AND c.deleted_at IS NULL
     WHERE ct.id=$1 AND ct.deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy liên hệ");
  return result.rows[0];
}

export async function createContact(input: { customerId: string; fullName: string; jobTitle?: string; email?: string; phone?: string; isPrimary?: boolean; notes?: string }, actorId: string) {
  await assertCustomerExists(input.customerId);
  return transaction(async (client) => {
    if (input.isPrimary) {
      await client.query("UPDATE contacts SET is_primary=false WHERE customer_id=$1 AND deleted_at IS NULL", [input.customerId]);
    }
    const result = await client.query(
      `INSERT INTO contacts(customer_id,full_name,job_title,email,phone,is_primary,notes,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)
       RETURNING id, customer_id AS "customerId", full_name AS "fullName", job_title AS "jobTitle", email, phone, is_primary AS "isPrimary", notes`,
      [input.customerId, input.fullName, input.jobTitle ?? null, input.email || null, input.phone ?? null, input.isPrimary ?? false, input.notes ?? null, actorId],
    );
    return result.rows[0];
  });
}

export async function updateContact(id: string, input: Partial<{ fullName: string; jobTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }>, actorId: string) {
  return transaction(async (client) => {
    const current = await client.query<{ customer_id: string }>("SELECT customer_id FROM contacts WHERE id=$1 AND deleted_at IS NULL", [id]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy liên hệ");
    if (input.isPrimary) {
      await client.query("UPDATE contacts SET is_primary=false WHERE customer_id=$1 AND deleted_at IS NULL", [current.rows[0].customer_id]);
    }
    const result = await client.query(
      `UPDATE contacts SET full_name=COALESCE($1,full_name), job_title=COALESCE($2,job_title), email=COALESCE($3,email), phone=COALESCE($4,phone),
       is_primary=COALESCE($5,is_primary), notes=COALESCE($6,notes), updated_at=now(), updated_by=$7
       WHERE id=$8 RETURNING id, customer_id AS "customerId", full_name AS "fullName", job_title AS "jobTitle", email, phone, is_primary AS "isPrimary", notes`,
      [input.fullName ?? null, input.jobTitle ?? null, input.email ?? null, input.phone ?? null, input.isPrimary ?? null, input.notes ?? null, actorId, id],
    );
    return result.rows[0];
  });
}

export async function deleteContact(id: string, actorId: string) {
  const result = await query("UPDATE contacts SET deleted_at=now(), updated_by=$1 WHERE id=$2 AND deleted_at IS NULL", [actorId, id]);
  if (!result.rowCount) throw new ApiError(404, "Không tìm thấy liên hệ");
}

// —— Activities ——
export async function createActivity(input: { type: string; subject: string; content?: string; customerId?: string; leadId?: string; dealId?: string; occurredAt?: string }, actorId: string) {
  await assertLinkedEntitiesConsistent({
    customerId: input.customerId,
    leadId: input.leadId,
    dealId: input.dealId,
  });
  const result = await query(
    `INSERT INTO activities(type,subject,content,occurred_at,owner_id,customer_id,lead_id,deal_id,created_by,updated_by)
     VALUES($1,$2,$3,COALESCE($4::timestamptz,now()),$5,$6,$7,$8,$5,$5)
     RETURNING id, type, subject, content, occurred_at AS "occurredAt", owner_id AS "ownerId", customer_id AS "customerId", lead_id AS "leadId", deal_id AS "dealId"`,
    [input.type, input.subject, input.content ?? null, input.occurredAt ?? null, actorId, input.customerId ?? null, input.leadId ?? null, input.dealId ?? null],
  );
  return result.rows[0];
}

// —— Tasks ——
export async function getTask(id: string) {
  const result = await query<{
    id: string; title: string; type: string; status: string; dueAt: string | null;
    ownerId: string | null; customerId: string | null; leadId: string | null; dealId: string | null;
    notes: string | null; completedAt: string | null; completedBy: string | null;
    createdAt: string; updatedAt: string;
  }>(
    `SELECT id, title, type, status, due_at AS "dueAt", owner_id AS "ownerId", customer_id AS "customerId",
      lead_id AS "leadId", deal_id AS "dealId", notes, completed_at AS "completedAt", completed_by AS "completedBy",
      created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tasks WHERE id=$1 AND deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy công việc");
  return result.rows[0];
}

export async function createTask(input: { title: string; type: string; dueAt?: string; ownerId?: string; customerId?: string; leadId?: string; dealId?: string; notes?: string }, actorId: string) {
  await assertLinkedEntitiesConsistent({
    customerId: input.customerId,
    leadId: input.leadId,
    dealId: input.dealId,
  });
  const result = await query(
    `INSERT INTO tasks(title,type,due_at,owner_id,customer_id,lead_id,deal_id,notes,created_by,updated_by)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
     RETURNING id, title, type, status, due_at AS "dueAt", owner_id AS "ownerId", customer_id AS "customerId", lead_id AS "leadId", deal_id AS "dealId", notes,
       completed_at AS "completedAt", completed_by AS "completedBy"`,
    [input.title, input.type, input.dueAt ?? null, input.ownerId ?? actorId, input.customerId ?? null, input.leadId ?? null, input.dealId ?? null, input.notes ?? null, actorId],
  );
  return result.rows[0];
}

export async function updateTask(
  id: string,
  input: Partial<{ title: string; type: string; status: string; dueAt: string; ownerId: string; notes: string }>,
  actorId: string,
  options?: { actor?: CurrentUser },
) {
  const current = await getTask(id);
  if (input.status && input.status !== current.status) {
    const canReopen = options?.actor ? hasScopeAll(options.actor, "tasks", "update") : false;
    assertTaskStatusTransition(current.status, input.status, canReopen);
    if (input.status === "cancelled" && !(input.notes ?? current.notes)?.trim()) {
      throw new ApiError(422, "Cần ghi chú lý do khi hủy công việc", { notes: "Bắt buộc" });
    }
  }
  if (input.ownerId && input.ownerId !== current.ownerId) {
    await audit(query, actorId, "tasks", "reassign", "task", id, { from: current.ownerId, to: input.ownerId });
  }

  const nextStatus = input.status ?? current.status;
  const completedAt = nextStatus === "done" ? (current.completedAt ?? new Date().toISOString()) : nextStatus === "open" ? null : current.completedAt;
  const completedBy = nextStatus === "done" ? (current.completedBy ?? actorId) : nextStatus === "open" ? null : current.completedBy;

  const result = await query(
    `UPDATE tasks SET title=COALESCE($1,title), type=COALESCE($2,type), status=COALESCE($3,status), due_at=COALESCE($4::timestamptz,due_at),
     owner_id=COALESCE($5,owner_id), notes=COALESCE($6,notes),
     completed_at=$7::timestamptz, completed_by=$8,
     updated_at=now(), updated_by=$9
     WHERE id=$10 AND deleted_at IS NULL
     RETURNING id, title, type, status, due_at AS "dueAt", owner_id AS "ownerId", customer_id AS "customerId", deal_id AS "dealId", notes,
       completed_at AS "completedAt", completed_by AS "completedBy"`,
    [
      input.title ?? null,
      input.type ?? null,
      input.status ?? null,
      input.dueAt ?? null,
      input.ownerId ?? null,
      input.notes ?? null,
      completedAt,
      completedBy,
      actorId,
      id,
    ],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy công việc");
  return result.rows[0];
}

export async function softDeleteTask(id: string, actorId: string) {
  const result = await query("UPDATE tasks SET deleted_at=now(), updated_by=$1 WHERE id=$2 AND deleted_at IS NULL", [actorId, id]);
  if (!result.rowCount) throw new ApiError(404, "Không tìm thấy công việc");
}

// —— Deals ——
export async function createDeal(input: { title: string; customerId: string; contactId?: string; value?: number; probability?: number; expectedCloseDate?: string; ownerId?: string; notes?: string; productIds?: string[] }, actorId: string) {
  await assertCustomerExists(input.customerId);
  if (input.contactId) await assertContactBelongsToCustomer(input.contactId, input.customerId);
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO deals(code,title,customer_id,contact_id,value,probability,expected_close_date,owner_id,notes,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
       RETURNING id, code, title, customer_id AS "customerId", stage, value, probability, expected_close_date AS "expectedCloseDate", owner_id AS "ownerId", notes`,
      [code("CH"), input.title, input.customerId, input.contactId ?? null, input.value ?? 0, input.probability ?? 10, input.expectedCloseDate ?? null, input.ownerId ?? actorId, input.notes ?? null, actorId],
    );
    for (const productId of input.productIds ?? []) {
      await client.query("INSERT INTO deal_products(deal_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [result.rows[0].id, productId]);
    }
    return result.rows[0];
  });
}

export async function getDeal(id: string) {
  const result = await query(
    `SELECT id, code, title, customer_id AS "customerId", contact_id AS "contactId", stage, value, probability, expected_close_date AS "expectedCloseDate", owner_id AS "ownerId", notes, closed_reason AS "closedReason", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM deals WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy cơ hội");
  return result.rows[0];
}

export async function updateDeal(id: string, input: Partial<{ title: string; value: number; probability: number; expectedCloseDate: string; ownerId: string; notes: string; contactId: string }>, actorId: string) {
  const current = await getDeal(id);
  if (input.contactId) await assertContactBelongsToCustomer(input.contactId, current.customerId as string);
  if (input.ownerId && input.ownerId !== current.ownerId) {
    await audit(query, actorId, "deals", "reassign", "deal", id, { from: current.ownerId, to: input.ownerId });
  }
  const result = await query(
    `UPDATE deals SET title=COALESCE($1,title), value=COALESCE($2,value), probability=COALESCE($3,probability),
     expected_close_date=COALESCE($4::date,expected_close_date), owner_id=COALESCE($5,owner_id), notes=COALESCE($6,notes),
     contact_id=COALESCE($7,contact_id), updated_at=now(), updated_by=$8
     WHERE id=$9 AND deleted_at IS NULL
     RETURNING id, code, title, customer_id AS "customerId", stage, value, probability, expected_close_date AS "expectedCloseDate", owner_id AS "ownerId", notes`,
    [input.title ?? null, input.value ?? null, input.probability ?? null, input.expectedCloseDate ?? null, input.ownerId ?? null, input.notes ?? null, input.contactId ?? null, actorId, id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy cơ hội");
  return result.rows[0];
}

export async function changeDealStage(id: string, stage: string, reason: string | undefined, actorId: string) {
  const current = await getDeal(id);
  assertDealStageTransition(current.stage as string, stage);
  if ((stage === "won" || stage === "lost") && !reason?.trim()) throw new ApiError(422, "Cần nhập lý do khi thắng/thua", { closedReason: "Bắt buộc" });
  const probability = stage === "won" ? 100 : stage === "lost" ? 0 : null;
  await query(
    "UPDATE deals SET stage=$1, closed_reason=$2, probability=COALESCE($3,probability), updated_at=now(), updated_by=$4 WHERE id=$5",
    [stage, reason ?? null, probability, actorId, id],
  );
  await audit(query, actorId, "deals", "stage", "deal", id, { from: current.stage, to: stage, reason });
  return getDeal(id);
}

export async function softDeleteDeal(id: string, actorId: string) {
  const result = await query("UPDATE deals SET deleted_at=now(), updated_by=$1 WHERE id=$2 AND deleted_at IS NULL", [actorId, id]);
  if (!result.rowCount) throw new ApiError(404, "Không tìm thấy cơ hội");
}

// —— Products ——
export async function createProduct(input: { sku: string; name: string; category?: string; unit: string; unitPrice: number; costPrice?: number; vatPercent?: number; minStock?: number; description?: string; itemType?: "goods" | "service" }, actorId: string) {
  try {
    const result = await query(
      `INSERT INTO products(sku,name,category,unit,unit_price,cost_price,vat_percent,min_stock,item_type,description,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
       RETURNING id, sku, name, category, unit, unit_price AS "unitPrice", cost_price AS "costPrice", vat_percent AS "vatPercent", min_stock AS "minStock", item_type AS "itemType", status, description`,
      [input.sku, input.name, input.category ?? null, input.unit, input.unitPrice, input.costPrice ?? 0, input.vatPercent ?? 0, input.itemType === "service" ? 0 : input.minStock ?? 0, input.itemType ?? "goods", input.description ?? null, actorId],
    );
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new ApiError(409, "SKU đã tồn tại");
    throw error;
  }
}

export async function updateProduct(id: string, input: Partial<{ sku: string; name: string; category: string; unit: string; unitPrice: number; costPrice: number; vatPercent: number; minStock: number; status: string; description: string; itemType: "goods" | "service" }>, actorId: string) {
  const minStock = input.itemType === "service" ? 0 : input.minStock ?? null;
  const result = await query(
    `UPDATE products SET sku=COALESCE($1,sku), name=COALESCE($2,name), category=COALESCE($3,category), unit=COALESCE($4,unit),
     unit_price=COALESCE($5,unit_price), cost_price=COALESCE($6,cost_price), vat_percent=COALESCE($7,vat_percent), min_stock=COALESCE($8,min_stock),
     status=COALESCE($9,status), description=COALESCE($10,description), item_type=COALESCE($11,item_type),
     updated_at=now(), updated_by=$12
     WHERE id=$13 AND deleted_at IS NULL
     RETURNING id, sku, name, category, unit, unit_price AS "unitPrice", cost_price AS "costPrice", vat_percent AS "vatPercent", min_stock AS "minStock", item_type AS "itemType", status, description`,
    [input.sku ?? null, input.name ?? null, input.category ?? null, input.unit ?? null, input.unitPrice ?? null, input.costPrice ?? null, input.vatPercent ?? null, minStock, input.status ?? null, input.description ?? null, input.itemType ?? null, actorId, id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy sản phẩm");
  return result.rows[0];
}

export async function softDeleteProduct(id: string, actorId: string) {
  const result = await query("UPDATE products SET deleted_at=now(), status='inactive', updated_by=$1 WHERE id=$2 AND deleted_at IS NULL", [actorId, id]);
  if (!result.rowCount) throw new ApiError(404, "Không tìm thấy sản phẩm");
}

// —— Quotes ——
type QuoteLineInput = { productId: string; qty: number; unitPrice: number; discountPercent?: number; vatPercent?: number };

async function resolveProductLines(client: PoolClient, lines: QuoteLineInput[]) {
  if (!lines.length) throw new ApiError(422, "Báo giá cần ít nhất một dòng sản phẩm");
  const resolved = [];
  for (const line of lines) {
    const product = await client.query<{ name: string; status: string; unit_price: string; vat_percent: string }>(
      "SELECT name, status, unit_price, vat_percent FROM products WHERE id=$1 AND deleted_at IS NULL", [line.productId],
    );
    if (!product.rows[0] || product.rows[0].status !== "active") throw new ApiError(422, "Sản phẩm không hợp lệ hoặc không active");
    const vat = line.vatPercent ?? Number(product.rows[0].vat_percent);
    const discount = line.discountPercent ?? 0;
    const total = lineTotal(line.qty, line.unitPrice, discount, vat);
    resolved.push({ ...line, productName: product.rows[0].name, discountPercent: discount, vatPercent: vat, lineTotal: total });
  }
  return resolved;
}

export async function createQuote(input: { customerId: string; dealId?: string; validUntil?: string; ownerId?: string; terms?: string; lines: QuoteLineInput[] }, actorId: string) {
  await assertCustomerExists(input.customerId);
  if (input.dealId) await assertDealBelongsToCustomer(input.dealId, input.customerId);
  return transaction(async (client) => {
    const lines = await resolveProductLines(client, input.lines);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 - l.discountPercent / 100), 0);
    const total = lines.reduce((s, l) => s + l.lineTotal, 0);
    const quote = await client.query(
      `INSERT INTO quotes(code,customer_id,deal_id,valid_until,owner_id,terms,subtotal,total,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       RETURNING id, code, customer_id AS "customerId", deal_id AS "dealId", status, valid_until AS "validUntil", owner_id AS "ownerId", terms, subtotal, total`,
      [code("BG"), input.customerId, input.dealId ?? null, input.validUntil ?? null, input.ownerId ?? actorId, input.terms ?? null, Math.round(subtotal * 100) / 100, Math.round(total * 100) / 100, actorId],
    );
    for (const line of lines) {
      await client.query(
        "INSERT INTO quote_lines(quote_id,product_id,product_name,qty,unit_price,discount_percent,vat_percent,line_total) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [quote.rows[0].id, line.productId, line.productName, line.qty, line.unitPrice, line.discountPercent, line.vatPercent, line.lineTotal],
      );
    }
    return quote.rows[0];
  });
}

export async function getQuote(id: string) {
  const quote = await query<{
    id: string; code: string; customerId: string; dealId: string | null; status: string;
    validUntil: string | null; ownerId: string | null; terms: string | null; subtotal: string; total: string;
    approvedAt: string | null; createdAt: string; updatedAt: string;
  }>(
    `SELECT id, code, customer_id AS "customerId", deal_id AS "dealId", status, valid_until AS "validUntil", owner_id AS "ownerId", terms, subtotal, total, approved_at AS "approvedAt", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM quotes WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!quote.rows[0]) throw new ApiError(404, "Không tìm thấy báo giá");
  const lines = await query(
    `SELECT id, product_id AS "productId", product_name AS "productName", qty, unit_price AS "unitPrice", discount_percent AS "discountPercent", vat_percent AS "vatPercent", line_total AS "lineTotal"
     FROM quote_lines WHERE quote_id=$1`, [id],
  );
  return { ...quote.rows[0], lines: lines.rows };
}

export async function updateQuote(id: string, input: { validUntil?: string; terms?: string; dealId?: string; lines?: QuoteLineInput[] }, actorId: string) {
  return transaction(async (client) => {
    const current = await client.query<{ status: string; customer_id: string }>("SELECT status, customer_id FROM quotes WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy báo giá");
    if (current.rows[0].status !== "draft") throw new ApiError(409, "Chỉ sửa báo giá nháp");
    if (input.dealId) await assertDealBelongsToCustomer(input.dealId, current.rows[0].customer_id);
    if (input.lines) {
      const lines = await resolveProductLines(client, input.lines);
      const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 - l.discountPercent / 100), 0);
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);
      await client.query("DELETE FROM quote_lines WHERE quote_id=$1", [id]);
      for (const line of lines) {
        await client.query(
          "INSERT INTO quote_lines(quote_id,product_id,product_name,qty,unit_price,discount_percent,vat_percent,line_total) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [id, line.productId, line.productName, line.qty, line.unitPrice, line.discountPercent, line.vatPercent, line.lineTotal],
        );
      }
      await client.query("UPDATE quotes SET subtotal=$1, total=$2, updated_at=now(), updated_by=$3 WHERE id=$4", [Math.round(subtotal * 100) / 100, Math.round(total * 100) / 100, actorId, id]);
    }
    await client.query(
      "UPDATE quotes SET valid_until=COALESCE($1::date,valid_until), terms=COALESCE($2,terms), deal_id=COALESCE($3,deal_id), updated_at=now(), updated_by=$4 WHERE id=$5",
      [input.validUntil ?? null, input.terms ?? null, input.dealId ?? null, actorId, id],
    );
    return getQuote(id);
  });
}

export async function sendQuote(id: string, actorId: string) {
  const quote = await getQuote(id);
  if (quote.status !== "draft") throw new ApiError(409, "Chỉ gửi báo giá nháp");
  await query("UPDATE quotes SET status='sent', updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await audit(query, actorId, "quotes", "send", "quote", id, { status: "sent" });
  return getQuote(id);
}

export async function rejectQuote(id: string, actorId: string) {
  const quote = await getQuote(id);
  if (quote.status !== "sent") throw new ApiError(409, "Chỉ từ chối báo giá đã gửi");
  await query("UPDATE quotes SET status='rejected', updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await audit(query, actorId, "quotes", "reject", "quote", id, { status: "rejected" });
  return getQuote(id);
}

export async function softDeleteQuote(id: string, actorId: string) {
  const quote = await getQuote(id);
  if (!["draft", "rejected", "expired"].includes(quote.status as string)) throw new ApiError(409, "Không thể xóa báo giá đã duyệt/gửi");
  await query("UPDATE quotes SET deleted_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
}

// —— Orders ——
export async function getOrder(id: string) {
  const order = await query<{
    id: string; code: string; customerId: string; contractId: string | null; quoteId: string | null;
    status: string; ownerId: string | null; total: string; createdAt: string; updatedAt: string;
  }>(
    `SELECT id, code, customer_id AS "customerId", contract_id AS "contractId", quote_id AS "quoteId", status, owner_id AS "ownerId", total, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM orders WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!order.rows[0]) throw new ApiError(404, "Không tìm thấy đơn hàng");
  const lines = await query(
    `SELECT id, product_id AS "productId", product_name AS "productName", qty, unit_price AS "unitPrice", line_total AS "lineTotal" FROM order_lines WHERE order_id=$1`, [id],
  );
  return { ...order.rows[0], lines: lines.rows };
}

export async function updateDraftOrder(id: string, input: { lines: { productId: string; qty: number; unitPrice: number }[] }, actorId: string) {
  return transaction(async (client) => {
    const current = await client.query<{ status: string }>("SELECT status FROM orders WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (current.rows[0].status !== "draft") throw new ApiError(409, "Chỉ sửa đơn nháp");
    if (!input.lines.length) throw new ApiError(422, "Đơn cần ít nhất một dòng");
    await client.query("DELETE FROM order_lines WHERE order_id=$1", [id]);
    let total = 0;
    for (const line of input.lines) {
      const product = await client.query<{ name: string; costPrice: string; businessType: string | null }>("SELECT name,cost_price AS \"costPrice\",business_type AS \"businessType\" FROM products WHERE id=$1 AND deleted_at IS NULL", [line.productId]);
      if (!product.rows[0]) throw new ApiError(422, "Sản phẩm không tồn tại");
      const lineTotalValue = Math.round(line.qty * line.unitPrice * 100) / 100;
      total += lineTotalValue;
      await client.query(
        "INSERT INTO order_lines(order_id,product_id,product_name,qty,unit_price,line_total,cost_price,business_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, line.productId, product.rows[0].name, line.qty, line.unitPrice, lineTotalValue, product.rows[0].costPrice ?? 0, product.rows[0].businessType ?? "new_construction"],
      );
    }
    await client.query("UPDATE orders SET total=$1, updated_at=now(), updated_by=$2 WHERE id=$3", [total, actorId, id]);
    return getOrder(id);
  });
}

// —— Contracts ——
export async function getContract(id: string) {
  const result = await query(
    `SELECT id, code, customer_id AS "customerId", quote_id AS "quoteId", deal_id AS "dealId", status, value, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", terms, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM contracts WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy hợp đồng");
  return result.rows[0];
}

// —— Suppliers ——
type SupplierInput = {
  name: string; contactName?: string; phone?: string; email?: string; address?: string;
  status?: "active" | "inactive"; notes?: string; ownerId?: string;
};

export async function getSupplier(id: string) {
  const result = await query(
    `SELECT id, code, name, contact_name AS "contactName", phone, email, address, status, notes,
      owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM suppliers WHERE id=$1 AND deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy nhà cung cấp");
  return result.rows[0];
}

export async function createSupplier(input: SupplierInput, actorId: string) {
  try {
    const result = await query(
      `INSERT INTO suppliers(code,name,contact_name,phone,email,address,status,notes,owner_id,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
       RETURNING id, code, name, contact_name AS "contactName", phone, email, address, status, notes,
         owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [code("NCC"), input.name, input.contactName || null, input.phone || null, input.email || null,
        input.address || null, input.status ?? "active", input.notes || null, input.ownerId ?? actorId, actorId],
    );
    await audit(query, actorId, "suppliers", "create", "supplier", result.rows[0].id, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Mã nhà cung cấp đã tồn tại");
    throw error;
  }
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>, actorId: string) {
  const current = await getSupplier(id);
  const result = await query(
    `UPDATE suppliers SET name=COALESCE($1,name), contact_name=COALESCE($2,contact_name), phone=COALESCE($3,phone),
      email=COALESCE($4,email), address=COALESCE($5,address), status=COALESCE($6,status), notes=COALESCE($7,notes),
      owner_id=COALESCE($8,owner_id), updated_at=now(), updated_by=$9
     WHERE id=$10 AND deleted_at IS NULL
     RETURNING id, code, name, contact_name AS "contactName", phone, email, address, status, notes,
       owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.name ?? null, input.contactName ?? null, input.phone ?? null, input.email ?? null, input.address ?? null,
      input.status ?? null, input.notes ?? null, input.ownerId ?? null, actorId, id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy nhà cung cấp");
  await audit(query, actorId, "suppliers", "update", "supplier", id, result.rows[0], current);
  return result.rows[0];
}

export async function softDeleteSupplier(id: string, actorId: string) {
  await getSupplier(id);
  await query("UPDATE suppliers SET deleted_at=now(), status='inactive', updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await audit(query, actorId, "suppliers", "delete", "supplier", id, { deleted: true });
}

// —— Projects / construction sites ——
type ProjectInput = {
  name: string; customerId: string; address?: string; status?: "planning" | "active" | "completed" | "cancelled";
  startDate?: string; endDate?: string; ownerId?: string; notes?: string;
};

async function assertActiveCustomer(customerId: string) {
  const customer = await query<{ id: string }>("SELECT id FROM customers WHERE id=$1 AND deleted_at IS NULL AND status='active'", [customerId]);
  if (!customer.rows[0]) throw new ApiError(422, "Khách hàng không tồn tại hoặc đã ngừng hoạt động");
}

export async function getProject(id: string) {
  const result = await query(
    `SELECT id, code, name, customer_id AS "customerId", address, status, start_date AS "startDate", end_date AS "endDate",
      owner_id AS "ownerId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM projects WHERE id=$1 AND deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy công trình");
  return result.rows[0];
}

export async function createProject(input: ProjectInput, actorId: string) {
  await assertActiveCustomer(input.customerId);
  try {
    const result = await query(
      `INSERT INTO projects(code,name,customer_id,address,status,start_date,end_date,owner_id,notes,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
       RETURNING id, code, name, customer_id AS "customerId", address, status, start_date AS "startDate", end_date AS "endDate",
         owner_id AS "ownerId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [code("CT"), input.name, input.customerId, input.address || null, input.status ?? "planning", input.startDate || null,
        input.endDate || null, input.ownerId ?? actorId, input.notes || null, actorId],
    );
    await audit(query, actorId, "projects", "create", "project", result.rows[0].id, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === "23514") throw new ApiError(422, "Khoảng ngày công trình không hợp lệ");
    throw error;
  }
}

export async function updateProject(id: string, input: Partial<ProjectInput>, actorId: string) {
  const current = await getProject(id);
  if (input.customerId && input.customerId !== current.customerId) await assertActiveCustomer(input.customerId);
  const result = await query(
    `UPDATE projects SET name=COALESCE($1,name), customer_id=COALESCE($2,customer_id), address=COALESCE($3,address),
      status=COALESCE($4,status), start_date=COALESCE($5,start_date), end_date=COALESCE($6,end_date),
      owner_id=COALESCE($7,owner_id), notes=COALESCE($8,notes), updated_at=now(), updated_by=$9
     WHERE id=$10 AND deleted_at IS NULL
     RETURNING id, code, name, customer_id AS "customerId", address, status, start_date AS "startDate", end_date AS "endDate",
       owner_id AS "ownerId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.name ?? null, input.customerId ?? null, input.address ?? null, input.status ?? null, input.startDate || null,
      input.endDate || null, input.ownerId ?? null, input.notes ?? null, actorId, id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy công trình");
  await audit(query, actorId, "projects", "update", "project", id, result.rows[0], current);
  return result.rows[0];
}

export async function softDeleteProject(id: string, actorId: string) {
  await getProject(id);
  await query("UPDATE projects SET deleted_at=now(), updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await audit(query, actorId, "projects", "delete", "project", id, { deleted: true });
}

// —— Warehouses ——
type WarehouseInput = { code: string; name: string; address?: string; isDefault?: boolean };

export async function getWarehouse(id: string) {
  const result = await query(
    `SELECT id, code, name, address, is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM warehouses WHERE id=$1 AND deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy kho");
  return result.rows[0];
}

export async function createWarehouse(input: WarehouseInput, actorId: string) {
  return transaction(async (client) => {
    const defaults = await client.query<{ id: string }>("SELECT id FROM warehouses WHERE is_default=true AND deleted_at IS NULL FOR UPDATE");
    const isDefault = input.isDefault ?? defaults.rowCount === 0;
    if (isDefault) await client.query("UPDATE warehouses SET is_default=false, updated_at=now() WHERE is_default=true AND deleted_at IS NULL");
    try {
      const result = await client.query(
        `INSERT INTO warehouses(code,name,address,is_default)
         VALUES($1,$2,$3,$4)
         RETURNING id, code, name, address, is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [input.code, input.name, input.address || null, isDefault],
      );
      await audit(client, actorId, "inventory", "create_warehouse", "warehouse", result.rows[0].id, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Mã kho đã tồn tại");
      throw error;
    }
  });
}

export async function updateWarehouse(id: string, input: Partial<WarehouseInput>, actorId: string) {
  return transaction(async (client) => {
    const currentResult = await client.query<{ id: string; isDefault: boolean }>(
      `SELECT id, is_default AS "isDefault" FROM warehouses WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, [id],
    );
    const current = currentResult.rows[0];
    if (!current) throw new ApiError(404, "Không tìm thấy kho");
    if (input.isDefault === false && current.isDefault) {
      throw new ApiError(422, "Kho mặc định phải được chuyển sang một kho khác trước");
    }
    if (input.isDefault) await client.query("UPDATE warehouses SET is_default=false, updated_at=now() WHERE id<>$1 AND is_default=true AND deleted_at IS NULL", [id]);
    try {
      const result = await client.query(
        `UPDATE warehouses SET code=COALESCE($1,code), name=COALESCE($2,name), address=COALESCE($3,address),
          is_default=COALESCE($4,is_default), updated_at=now()
         WHERE id=$5 AND deleted_at IS NULL
         RETURNING id, code, name, address, is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [input.code ?? null, input.name ?? null, input.address ?? null, input.isDefault ?? null, id],
      );
      await audit(client, actorId, "inventory", "update_warehouse", "warehouse", id, result.rows[0], current);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Mã kho đã tồn tại");
      throw error;
    }
  });
}

export async function softDeleteWarehouse(id: string, actorId: string) {
  const warehouse = await getWarehouse(id);
  if (warehouse.isDefault) throw new ApiError(409, "Không thể xóa kho mặc định; hãy chọn kho mặc định khác trước");
  const balances = await query<{ total: string }>("SELECT count(*)::text AS total FROM inventory_balances WHERE warehouse_id=$1 AND qty<>0", [id]);
  if (Number(balances.rows[0].total) > 0) throw new ApiError(409, "Không thể xóa kho vẫn còn tồn hàng");
  await query("UPDATE warehouses SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL", [id]);
  await audit(query, actorId, "inventory", "delete_warehouse", "warehouse", id, { deleted: true });
}

type ContractInput = {
  customerId: string; quoteId?: string; dealId?: string; status?: string; value: number;
  startDate?: string; endDate?: string; ownerId?: string; terms?: string;
};

async function assertContractQuote(client: { query: typeof query }, quoteId: string, customerId: string) {
  const quote = await client.query<{ customer_id: string; status: string }>(
    "SELECT customer_id, status FROM quotes WHERE id=$1 AND deleted_at IS NULL", [quoteId],
  );
  if (!quote.rows[0]) throw new ApiError(422, "Báo giá không tồn tại");
  if (quote.rows[0].status !== "approved") throw new ApiError(422, "Chỉ có thể liên kết báo giá đã duyệt");
  if (quote.rows[0].customer_id !== customerId) throw new ApiError(422, "Báo giá không thuộc khách hàng đã chọn");
  const linked = await client.query("SELECT 1 FROM contracts WHERE quote_id=$1 AND deleted_at IS NULL", [quoteId]);
  if (linked.rows[0]) throw new ApiError(409, "Báo giá này đã có hợp đồng");
}

export async function createContract(input: ContractInput, actorId: string) {
  await assertCustomerExists(input.customerId);
  if (input.dealId) await assertDealBelongsToCustomer(input.dealId, input.customerId);
  return transaction(async (client) => {
    if (input.quoteId) await assertContractQuote(client, input.quoteId, input.customerId);
    const result = await client.query(
      `INSERT INTO contracts(code,customer_id,quote_id,deal_id,status,value,start_date,end_date,owner_id,terms,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
       RETURNING id, code, customer_id AS "customerId", quote_id AS "quoteId", deal_id AS "dealId", status, value, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", terms, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [code("HD"), input.customerId, input.quoteId ?? null, input.dealId ?? null, input.status ?? "draft", input.value, input.startDate || null, input.endDate || null, input.ownerId ?? actorId, input.terms || null, actorId],
    );
    await audit(client, actorId, "contracts", "create", "contract", result.rows[0].id, result.rows[0]);
    return result.rows[0];
  });
}

export async function updateContract(id: string, input: Partial<ContractInput>, actorId: string) {
  const current = await getContract(id);
  if (input.customerId && input.customerId !== current.customerId) {
    throw new ApiError(422, "Không thể đổi khách hàng của hợp đồng");
  }
  if (input.quoteId && input.quoteId !== current.quoteId) {
    throw new ApiError(422, "Không thể đổi báo giá liên kết của hợp đồng");
  }
  const result = await query(
    `UPDATE contracts SET status=COALESCE($1,status), value=COALESCE($2,value), start_date=COALESCE($3,start_date),
     end_date=COALESCE($4,end_date), owner_id=COALESCE($5,owner_id), terms=COALESCE($6,terms), updated_at=now(), updated_by=$7
     WHERE id=$8 AND deleted_at IS NULL
     RETURNING id, code, customer_id AS "customerId", quote_id AS "quoteId", deal_id AS "dealId", status, value, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId", terms, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.status ?? null, input.value ?? null, input.startDate || null, input.endDate || null, input.ownerId ?? null, input.terms || null, actorId, id],
  );
  await audit(query, actorId, "contracts", "update", "contract", id, result.rows[0], current);
  return result.rows[0];
}

// —— Campaigns ——
export async function getCampaign(id: string) {
  const result = await query<{
    id: string; code: string; name: string; channel: string; status: string;
    budget: string; spent: string; startDate: string | null; endDate: string | null; ownerId: string | null;
  }>(
    `SELECT id, code, name, channel, status, budget, spent, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId"
     FROM campaigns WHERE id=$1 AND deleted_at IS NULL`,
    [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy chiến dịch");
  return result.rows[0];
}

export async function createCampaign(input: { name: string; channel: string; budget?: number; startDate?: string; endDate?: string; ownerId?: string; status?: string }, actorId: string) {
  const result = await query(
    `INSERT INTO campaigns(code,name,channel,status,budget,start_date,end_date,owner_id,created_by,updated_by)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
     RETURNING id, code, name, channel, status, budget, spent, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId"`,
    [code("KM"), input.name, input.channel, input.status ?? "draft", input.budget ?? 0, input.startDate ?? null, input.endDate ?? null, input.ownerId ?? actorId, actorId],
  );
  return result.rows[0];
}

export async function updateCampaign(id: string, input: Partial<{ name: string; channel: string; budget: number; spent: number; startDate: string; endDate: string; status: string; ownerId: string }>, actorId: string) {
  const result = await query(
    `UPDATE campaigns SET name=COALESCE($1,name), channel=COALESCE($2,channel), budget=COALESCE($3,budget), spent=COALESCE($4,spent),
     start_date=COALESCE($5::date,start_date), end_date=COALESCE($6::date,end_date), status=COALESCE($7,status), owner_id=COALESCE($8,owner_id),
     updated_at=now(), updated_by=$9
     WHERE id=$10 AND deleted_at IS NULL
     RETURNING id, code, name, channel, status, budget, spent, start_date AS "startDate", end_date AS "endDate", owner_id AS "ownerId"`,
    [input.name ?? null, input.channel ?? null, input.budget ?? null, input.spent ?? null, input.startDate ?? null, input.endDate ?? null, input.status ?? null, input.ownerId ?? null, actorId, id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy chiến dịch");
  return result.rows[0];
}

export async function getCampaignStats(id: string) {
  const campaign = await getCampaign(id);
  const stats = await query<{ leads: string; converted: string; revenue: string }>(
    `SELECT
      (SELECT count(*)::text FROM leads WHERE campaign_id=$1 AND deleted_at IS NULL) leads,
      (SELECT count(*)::text FROM leads WHERE campaign_id=$1 AND status='converted' AND deleted_at IS NULL) converted,
      (SELECT COALESCE(sum(i.paid_amount),0)::text FROM invoices i
        JOIN customers c ON c.id=i.customer_id
        WHERE c.campaign_id=$1 AND i.deleted_at IS NULL) revenue`,
    [id],
  );
  return { ...campaign, leadsCount: Number(stats.rows[0].leads), convertedCount: Number(stats.rows[0].converted), revenue: Number(stats.rows[0].revenue) };
}

// —— Inventory ——
export async function listBalances() {
  const result = await query(
    `SELECT b.warehouse_id AS "warehouseId", w.code AS "warehouseCode", w.name AS "warehouseName",
      b.product_id AS "productId", p.sku, p.name AS "productName", p.min_stock AS "minStock", b.qty,
      (b.qty < p.min_stock) AS "belowMin"
     FROM inventory_balances b
     JOIN warehouses w ON w.id=b.warehouse_id AND w.deleted_at IS NULL
     JOIN products p ON p.id=b.product_id AND p.deleted_at IS NULL
     ORDER BY p.name`,
  );
  return result.rows;
}

type ProductSupplierInput = { supplierId: string; supplierSku?: string; purchasePrice?: number; leadTimeDays?: number; minOrderQty?: number; isPreferred?: boolean; status?: string; note?: string };
export async function listProductSuppliers(productId: string) {
  return (await query(`SELECT ps.id, ps.supplier_id AS "supplierId", s.code AS "supplierCode", s.name AS "supplierName", ps.supplier_sku AS "supplierSku", ps.purchase_price AS "purchasePrice", ps.lead_time_days AS "leadTimeDays", ps.min_order_qty AS "minOrderQty", ps.is_preferred AS "isPreferred", ps.status, ps.note FROM product_suppliers ps JOIN suppliers s ON s.id=ps.supplier_id AND s.deleted_at IS NULL WHERE ps.product_id=$1 AND ps.deleted_at IS NULL ORDER BY ps.is_preferred DESC, s.name`, [productId])).rows;
}
export async function createProductSupplier(productId: string, input: ProductSupplierInput, actorId: string) {
  return transaction(async (client) => {
    const [product, supplier] = await Promise.all([
      client.query("SELECT id FROM products WHERE id=$1 AND deleted_at IS NULL", [productId]),
      client.query("SELECT id FROM suppliers WHERE id=$1 AND deleted_at IS NULL", [input.supplierId]),
    ]);
    if (!product.rows[0]) throw new ApiError(404, "Không tìm thấy sản phẩm");
    if (!supplier.rows[0]) throw new ApiError(422, "Nhà cung cấp không tồn tại hoặc đã ngưng sử dụng");
    if (input.isPreferred) await client.query("UPDATE product_suppliers SET is_preferred=false,updated_at=now(),updated_by=$1 WHERE product_id=$2 AND deleted_at IS NULL", [actorId, productId]);
    try {
      const result = await client.query(`INSERT INTO product_suppliers(product_id,supplier_id,supplier_sku,purchase_price,lead_time_days,min_order_qty,is_preferred,status,note,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`, [productId, input.supplierId, input.supplierSku || null, input.purchasePrice ?? 0, input.leadTimeDays ?? null, input.minOrderQty ?? 1, input.isPreferred ?? false, input.status ?? "active", input.note || null, actorId]);
      await audit(client, actorId, "products", "add_supplier", "product_supplier", result.rows[0].id, { productId, supplierId: input.supplierId });
      return result.rows[0];
    } catch (error) { if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Nhà cung cấp đã được liên kết với sản phẩm"); throw error; }
  });
}
export async function updateProductSupplier(productId: string, id: string, input: Partial<ProductSupplierInput>, actorId: string) {
  return transaction(async (client) => {
    const current = await client.query<{ id: string }>("SELECT id FROM product_suppliers WHERE id=$1 AND product_id=$2 AND deleted_at IS NULL FOR UPDATE", [id, productId]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy liên kết nhà cung cấp");
    if (input.isPreferred) await client.query("UPDATE product_suppliers SET is_preferred=false,updated_at=now(),updated_by=$1 WHERE product_id=$2 AND deleted_at IS NULL", [actorId, productId]);
    await client.query(`UPDATE product_suppliers SET supplier_sku=COALESCE($1,supplier_sku),purchase_price=COALESCE($2,purchase_price),lead_time_days=COALESCE($3,lead_time_days),min_order_qty=COALESCE($4,min_order_qty),is_preferred=COALESCE($5,is_preferred),status=COALESCE($6,status),note=COALESCE($7,note),updated_at=now(),updated_by=$8 WHERE id=$9`, [input.supplierSku || null, input.purchasePrice ?? null, input.leadTimeDays ?? null, input.minOrderQty ?? null, input.isPreferred ?? null, input.status ?? null, input.note ?? null, actorId, id]);
    await audit(client, actorId, "products", "update_supplier", "product_supplier", id, input); return { id };
  });
}
export async function createStockMove(input: {
  type: "in" | "out" | "transfer";
  reason: "purchase_receipt" | "customer_return" | "warranty_receipt" | "installation_issue" | "sales_issue" | "supplier_return" | "transfer";
  requestId?: string;
  warehouseFromId?: string; warehouseToId?: string; note?: string;
  supplierId?: string; customerId?: string; projectId?: string;
  lines: { productId: string; qty: number }[];
  post?: boolean;
}, actorId: string) {
  if (!input.lines.length) throw new ApiError(422, "Phiếu kho cần ít nhất một dòng");
  if (input.type === "in" && !input.warehouseToId) throw new ApiError(422, "Chọn kho nhập");
  if (input.type === "out" && !input.warehouseFromId) throw new ApiError(422, "Chọn kho xuất");
  if (input.type === "transfer" && (!input.warehouseFromId || !input.warehouseToId)) throw new ApiError(422, "Chọn kho nguồn và đích");
  if (input.type === "transfer" && input.warehouseFromId === input.warehouseToId) {
    throw new ApiError(422, "Kho nguồn và kho đích phải khác nhau");
  }

  const expectedType = input.reason === "transfer" ? "transfer" : input.reason.endsWith("receipt") || input.reason === "customer_return" ? "in" : "out";
  if (input.type !== expectedType) throw new ApiError(422, "Loại phiếu không khớp nghiệp vụ");
  if (["purchase_receipt", "supplier_return"].includes(input.reason) && !input.supplierId) throw new ApiError(422, "Chọn nhà cung cấp");
  if (["customer_return", "warranty_receipt", "sales_issue"].includes(input.reason) && !input.customerId) throw new ApiError(422, "Chọn khách hàng");
  if (input.reason === "installation_issue" && !input.projectId) throw new ApiError(422, "Chọn công trình");

  const moveId = await transaction(async (client) => {
    const warehouseIds = [...new Set([input.warehouseFromId, input.warehouseToId].filter((id): id is string => !!id))];
    const warehouses = await client.query<{ id: string }>(
      "SELECT id FROM warehouses WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL",
      [warehouseIds],
    );
    if (warehouses.rowCount !== warehouseIds.length) throw new ApiError(422, "Kho không tồn tại hoặc đã ngừng hoạt động");
    const references = [
      ["suppliers", input.supplierId, "Nhà cung cấp"],
      ["customers", input.customerId, "Khách hàng"],
      ["projects", input.projectId, "Công trình"],
    ] as const;
    for (const [table, id, label] of references) {
      if (!id) continue;
      const row = await client.query(`SELECT id FROM ${table} WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (!row.rows[0]) throw new ApiError(422, `${label} không tồn tại hoặc đã ngừng hoạt động`);
    }
    const requestHash = input.requestId
      ? createHash("sha256").update(JSON.stringify({
        type: input.type,
        reason: input.reason,
        warehouseFromId: input.warehouseFromId ?? null,
        warehouseToId: input.warehouseToId ?? null,
        supplierId: input.supplierId ?? null,
        customerId: input.customerId ?? null,
        projectId: input.projectId ?? null,
        note: input.note ?? null,
        post: input.post ?? false,
        lines: input.lines,
      })).digest("hex")
      : null;
    const move = await client.query<{ id: string }>(
      `INSERT INTO stock_moves(code,type,reason,status,warehouse_from_id,warehouse_to_id,supplier_id,customer_id,project_id,owner_id,note,request_id,request_hash,created_by,updated_by)
       VALUES($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10,$11,$12,$9,$9)
       ON CONFLICT (owner_id, request_id) WHERE request_id IS NOT NULL AND deleted_at IS NULL DO NOTHING
       RETURNING id`,
      [code(input.type === "in" ? "PN" : input.type === "out" ? "PX" : "CK"), input.type, input.reason, input.warehouseFromId ?? null, input.warehouseToId ?? null, input.supplierId ?? null, input.customerId ?? null, input.projectId ?? null, actorId, input.note ?? null, input.requestId ?? null, requestHash],
    );
    if (!move.rows[0]) {
      const existing = await client.query<{ id: string; request_hash: string | null }>(
        "SELECT id, request_hash FROM stock_moves WHERE owner_id=$1 AND request_id=$2 AND deleted_at IS NULL",
        [actorId, input.requestId],
      );
      if (!existing.rows[0]) throw new ApiError(409, "Yêu cầu tạo phiếu đang được xử lý");
      if (existing.rows[0].request_hash !== requestHash) {
        throw new ApiError(422, "Mã yêu cầu đã được dùng với dữ liệu khác");
      }
      return existing.rows[0].id;
    }
    for (const line of input.lines) {
      const product = await client.query<{ name: string; item_type: "goods" | "service" }>("SELECT name, item_type FROM products WHERE id=$1 AND deleted_at IS NULL", [line.productId]);
      if (!product.rows[0]) throw new ApiError(422, "Sản phẩm không tồn tại");
      if (product.rows[0].item_type === "service") throw new ApiError(422, "Dịch vụ không thể đưa vào phiếu kho");
      await client.query("INSERT INTO stock_move_lines(stock_move_id,product_id,product_name,qty) VALUES($1,$2,$3,$4)", [move.rows[0].id, line.productId, product.rows[0].name, line.qty]);
    }
    if (input.post) {
      await postStockMoveTx(client, move.rows[0].id, actorId);
    }
    return move.rows[0].id;
  });
  return getStockMove(moveId);
}

export async function getStockMove(id: string) {
  const move = await query<{
    id: string; code: string; type: string; reason: string | null; status: string; orderId: string | null;
    warehouseFromId: string | null; warehouseToId: string | null; ownerId: string | null;
    supplierId: string | null; customerId: string | null; projectId: string | null; note: string | null; postedAt: string | null; createdAt: string;
  }>(
    `SELECT id, code, type, reason, status, order_id AS "orderId", warehouse_from_id AS "warehouseFromId", warehouse_to_id AS "warehouseToId", supplier_id AS "supplierId", customer_id AS "customerId", project_id AS "projectId", owner_id AS "ownerId", note, posted_at AS "postedAt", created_at AS "createdAt"
     FROM stock_moves WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!move.rows[0]) throw new ApiError(404, "Không tìm thấy phiếu kho");
  const lines = await query(`SELECT id, product_id AS "productId", product_name AS "productName", qty FROM stock_move_lines WHERE stock_move_id=$1`, [id]);
  return { ...move.rows[0], lines: lines.rows };
}

async function ensureBalance(client: PoolClient, warehouseId: string, productId: string) {
  await client.query(
    "INSERT INTO inventory_balances(warehouse_id,product_id,qty) VALUES($1,$2,0) ON CONFLICT DO NOTHING",
    [warehouseId, productId],
  );
}

async function postStockMoveTx(client: PoolClient, id: string, actorId: string) {
  const move = await client.query<{ id: string; type: string; status: string; warehouse_from_id: string | null; warehouse_to_id: string | null }>(
    "SELECT * FROM stock_moves WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id],
  );
  const row = move.rows[0];
  if (!row) throw new ApiError(404, "Không tìm thấy phiếu kho");
  if (row.status === "posted") throw new ApiError(409, "Phiếu đã được ghi sổ");
  if (row.status !== "draft") throw new ApiError(409, "Chỉ ghi sổ phiếu nháp");
  const lines = await client.query<{ product_id: string; product_name: string; qty: string }>("SELECT product_id, product_name, qty FROM stock_move_lines WHERE stock_move_id=$1", [id]);
  if (!lines.rows.length) throw new ApiError(422, "Phiếu không có dòng");

  for (const line of lines.rows) {
    const qty = Number(line.qty);
    if (row.type === "in" || row.type === "transfer") {
      if (!row.warehouse_to_id) throw new ApiError(422, "Thiếu kho đích");
      await ensureBalance(client, row.warehouse_to_id, line.product_id);
      await client.query("SELECT qty FROM inventory_balances WHERE warehouse_id=$1 AND product_id=$2 FOR UPDATE", [row.warehouse_to_id, line.product_id]);
      await client.query("UPDATE inventory_balances SET qty=qty+$1, updated_at=now() WHERE warehouse_id=$2 AND product_id=$3", [qty, row.warehouse_to_id, line.product_id]);
    }
    if (row.type === "out" || row.type === "transfer") {
      if (!row.warehouse_from_id) throw new ApiError(422, "Thiếu kho nguồn");
      await ensureBalance(client, row.warehouse_from_id, line.product_id);
      const stock = await client.query<{ qty: string }>("SELECT qty FROM inventory_balances WHERE warehouse_id=$1 AND product_id=$2 FOR UPDATE", [row.warehouse_from_id, line.product_id]);
      if (Number(stock.rows[0]?.qty ?? 0) < qty) throw new ApiError(409, `Không đủ tồn: ${line.product_name}`);
      await client.query("UPDATE inventory_balances SET qty=qty-$1, updated_at=now() WHERE warehouse_id=$2 AND product_id=$3", [qty, row.warehouse_from_id, line.product_id]);
    }
  }
  await client.query("UPDATE stock_moves SET status='posted', posted_at=now(), updated_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
  await client.query("INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'inventory','post','stock_move',$2,$3)", [actorId, id, JSON.stringify({ status: "posted" })]);
}

export async function postStockMove(id: string, actorId: string) {
  await transaction(async (client) => postStockMoveTx(client, id, actorId));
  return getStockMove(id);
}

export async function deleteDraftStockMove(id: string, actorId: string) {
  const move = await getStockMove(id);
  if (move.status !== "draft") throw new ApiError(409, "Chỉ xóa phiếu nháp");
  await query("UPDATE stock_moves SET deleted_at=now(), updated_by=$1 WHERE id=$2", [actorId, id]);
}

// —— Serials and stock counts ——
type SerialInput = { productId: string; serial: string; warehouseId?: string; customerId?: string; projectId?: string; status?: string; warrantyUntil?: string; note?: string };
export async function getSerialNumber(id: string) {
  const result = await query(`SELECT id, product_id AS "productId", serial, warehouse_id AS "warehouseId", customer_id AS "customerId", project_id AS "projectId", status, warranty_until AS "warrantyUntil", note, created_at AS "createdAt", updated_at AS "updatedAt" FROM serial_numbers WHERE id=$1 AND deleted_at IS NULL`, [id]);
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy serial");
  return result.rows[0];
}
export async function createSerialNumber(input: SerialInput, actorId: string) {
  try {
    const result = await query(`INSERT INTO serial_numbers(product_id,serial,warehouse_id,customer_id,project_id,status,warranty_until,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, product_id AS "productId", serial, warehouse_id AS "warehouseId", customer_id AS "customerId", project_id AS "projectId", status, warranty_until AS "warrantyUntil", note`, [input.productId, input.serial, input.warehouseId ?? null, input.customerId ?? null, input.projectId ?? null, input.status ?? "in_stock", input.warrantyUntil || null, input.note || null]);
    await audit(query, actorId, "inventory", "create_serial", "serial_number", result.rows[0].id, result.rows[0]); return result.rows[0];
  } catch (error) { if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Serial đã tồn tại"); throw error; }
}
export async function updateSerialNumber(id: string, input: Partial<SerialInput>, actorId: string) {
  const result = await query(`UPDATE serial_numbers SET warehouse_id=COALESCE($1,warehouse_id), customer_id=COALESCE($2,customer_id), project_id=COALESCE($3,project_id), status=COALESCE($4,status), warranty_until=COALESCE($5,warranty_until), note=COALESCE($6,note), updated_at=now() WHERE id=$7 AND deleted_at IS NULL RETURNING id, product_id AS "productId", serial, warehouse_id AS "warehouseId", customer_id AS "customerId", project_id AS "projectId", status, warranty_until AS "warrantyUntil", note`, [input.warehouseId ?? null, input.customerId ?? null, input.projectId ?? null, input.status ?? null, input.warrantyUntil || null, input.note ?? null, id]);
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy serial"); await audit(query, actorId, "inventory", "update_serial", "serial_number", id, result.rows[0]); return result.rows[0];
}
export async function createInventoryCount(input: { warehouseId: string; countedAt?: string; note?: string; lines: { productId: string; countedQty: number }[] }, actorId: string) {
  return transaction(async (client) => {
    const warehouse = await client.query("SELECT id FROM warehouses WHERE id=$1 AND deleted_at IS NULL", [input.warehouseId]);
    if (!warehouse.rows[0]) throw new ApiError(422, "Kho không tồn tại hoặc đã ngưng sử dụng");
    const productIds = [...new Set(input.lines.map((line) => line.productId))];
    const products = await client.query<{ id: string }>("SELECT id FROM products WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL", [productIds]);
    if (products.rows.length !== productIds.length) throw new ApiError(422, "Có sản phẩm không tồn tại hoặc đã ngưng sử dụng");
    const header = await client.query<{ id: string }>(`INSERT INTO inventory_counts(code,warehouse_id,counted_at,note,owner_id) VALUES($1,$2,COALESCE($3::timestamptz,now()),$4,$5) RETURNING id`, [code("KK"), input.warehouseId, input.countedAt ?? null, input.note ?? null, actorId]);
    for (const line of input.lines) {
      const expected = await client.query<{ qty: string }>("SELECT qty FROM inventory_balances WHERE warehouse_id=$1 AND product_id=$2", [input.warehouseId, line.productId]);
      await client.query("INSERT INTO inventory_count_lines(inventory_count_id,product_id,expected_qty,counted_qty) VALUES($1,$2,$3,$4)", [header.rows[0].id, line.productId, expected.rows[0]?.qty ?? 0, line.countedQty]);
    }
    await audit(client, actorId, "inventory", "create_count", "inventory_count", header.rows[0].id, { warehouseId: input.warehouseId });
    return header.rows[0];
  });
}
export async function getInventoryCount(id: string) {
  const header = await query<{ id: string; code: string; warehouseId: string; status: string; countedAt: string; note: string | null; ownerId: string | null; postedAt: string | null }>(
    `SELECT id,code,warehouse_id AS "warehouseId",status,counted_at AS "countedAt",note,owner_id AS "ownerId",posted_at AS "postedAt"
     FROM inventory_counts WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!header.rows[0]) throw new ApiError(404, "Không tìm thấy phiếu kiểm kê");
  const lines = await query<{ id: string; productId: string; sku: string; productName: string; expectedQty: string; countedQty: string }>(
    `SELECT l.id,l.product_id AS "productId",p.sku,p.name AS "productName",l.expected_qty AS "expectedQty",l.counted_qty AS "countedQty"
     FROM inventory_count_lines l JOIN products p ON p.id=l.product_id
     WHERE l.inventory_count_id=$1 ORDER BY p.name`, [id],
  );
  return { ...header.rows[0], lines: lines.rows };
}
export async function postInventoryCount(id: string, actorId: string) {
  return transaction(async (client) => {
    const count = await client.query<{ warehouse_id: string; status: string }>("SELECT warehouse_id,status FROM inventory_counts WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!count.rows[0]) throw new ApiError(404, "Không tìm thấy phiếu kiểm kê"); if (count.rows[0].status !== "draft") throw new ApiError(409, "Chỉ ghi sổ phiếu kiểm kê nháp");
    const lines = await client.query<{ product_id: string; counted_qty: string }>("SELECT product_id,counted_qty FROM inventory_count_lines WHERE inventory_count_id=$1", [id]);
    for (const line of lines.rows) await client.query("INSERT INTO inventory_balances(warehouse_id,product_id,qty) VALUES($1,$2,$3) ON CONFLICT(warehouse_id,product_id) DO UPDATE SET qty=EXCLUDED.qty,updated_at=now()", [count.rows[0].warehouse_id, line.product_id, line.counted_qty]);
    await client.query("UPDATE inventory_counts SET status='posted',posted_at=now(),updated_at=now() WHERE id=$1", [id]);
    await audit(client, actorId, "inventory", "post_count", "inventory_count", id, { status: "posted" }); return { id, status: "posted" };
  });
}

export async function createOperatingExpense(input: { category: string; amount: number; expenseDate: string; note?: string }, actorId: string) {
  const result = await query(`INSERT INTO operating_expenses(code,expense_category,category,amount,expense_date,period_date,description,notes,created_by) VALUES($1,$2,$2,$3,$4,$4,$5,$5,$6) RETURNING id, COALESCE(code,'') AS code, COALESCE(category,expense_category) AS category, amount, COALESCE(period_date,expense_date) AS "expenseDate", COALESCE(notes,description) AS note, created_at AS "createdAt"`, [code("CP"), input.category, input.amount, input.expenseDate, input.note || null, actorId]);
  await audit(query, actorId, "finance", "create_expense", "operating_expense", result.rows[0].id, result.rows[0]); return result.rows[0];
}

export async function createRevenueEntry(input: { occurredAt: string; customerId: string; projectId?: string; productId: string; employeeId?: string; invoiceId?: string; documentCode?: string; businessType: string; qty: number; unitPrice: number; vatPercent: number; costAmount: number; paymentStatus: string; paidAmount: number; note?: string }, actorId: string) {
  return transaction(async (client) => {
    const [customer, product, project, employee, invoice] = await Promise.all([
      client.query("SELECT id FROM customers WHERE id=$1 AND deleted_at IS NULL AND status='active'", [input.customerId]),
      client.query("SELECT id FROM products WHERE id=$1 AND deleted_at IS NULL AND status='active'", [input.productId]),
      input.projectId ? client.query("SELECT id FROM projects WHERE id=$1 AND customer_id=$2 AND deleted_at IS NULL", [input.projectId, input.customerId]) : Promise.resolve({ rows: [{ id: null }] }),
      input.employeeId ? client.query("SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL AND status='active'", [input.employeeId]) : Promise.resolve({ rows: [{ id: actorId }] }),
      input.invoiceId ? client.query<{ customer_id: string; amount: string; paid_amount: string; status: string }>("SELECT customer_id,amount,paid_amount,status FROM invoices WHERE id=$1 AND deleted_at IS NULL", [input.invoiceId]) : Promise.resolve({ rows: [] as Array<{ customer_id: string; amount: string; paid_amount: string; status: string }> }),
    ]);
    if (!customer.rows[0]) throw new ApiError(422, "Khách hàng không hợp lệ");
    if (!product.rows[0]) throw new ApiError(422, "Hàng hóa/dịch vụ không hợp lệ");
    if (!project.rows[0]) throw new ApiError(422, "Công trình không thuộc khách hàng đã chọn");
    if (!employee.rows[0]) throw new ApiError(422, "Nhân viên không hợp lệ hoặc đã ngưng hoạt động");
    if (input.invoiceId && !invoice.rows[0]) throw new ApiError(422, "Hóa đơn không hợp lệ");
    if (invoice.rows[0]?.customer_id !== undefined && invoice.rows[0].customer_id !== input.customerId) throw new ApiError(422, "Hóa đơn không thuộc khách hàng đã chọn");
    if (invoice.rows[0]?.status === "cancelled") throw new ApiError(422, "Không thể liên kết hóa đơn đã hủy");
    const subtotal = Math.round(input.qty * input.unitPrice * 100) / 100;
    const vatAmount = Math.round(subtotal * input.vatPercent) / 100;
    const totalAmount = subtotal + vatAmount;
    if (input.paidAmount > totalAmount) throw new ApiError(422, "Số đã thanh toán không vượt tổng thu");
    const invoiceAmount = invoice.rows[0] ? Number(invoice.rows[0].amount) : 0;
    const paidRatio = invoice.rows[0] ? (invoiceAmount > 0 ? Number(invoice.rows[0].paid_amount) / invoiceAmount : 0) : null;
    const paidAmount = paidRatio === null ? input.paidAmount : Math.min(totalAmount, Math.round(totalAmount * paidRatio * 100) / 100);
    const paymentStatus = paidAmount === 0 ? "unpaid" : paidAmount >= totalAmount ? "paid" : "partial";
    const row = await client.query(`INSERT INTO revenue_entries(code,occurred_at,customer_id,project_id,product_id,employee_id,invoice_id,document_code,business_type,qty,unit_price,vat_percent,subtotal,vat_amount,total_amount,cost_amount,payment_status,paid_amount,note,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20) RETURNING id,code`, [code("DT"), input.occurredAt, input.customerId, input.projectId ?? null, input.productId, input.employeeId ?? actorId, input.invoiceId ?? null, input.documentCode || null, input.businessType, input.qty, input.unitPrice, input.vatPercent, subtotal, vatAmount, totalAmount, input.costAmount, paymentStatus, paidAmount, input.note || null, actorId]);
    await audit(client, actorId, "finance", "create_revenue_entry", "revenue_entry", row.rows[0].id, { totalAmount });
    return row.rows[0];
  });
}

export async function createRevenueReduction(input: { occurredAt: string; customerId?: string; revenueEntryId?: string; type: string; amount: number; note?: string }, actorId: string) {
  return transaction(async (client) => {
    let customerId = input.customerId;
    if (input.revenueEntryId) {
      const entry = await client.query<{ customer_id: string }>("SELECT customer_id FROM revenue_entries WHERE id=$1 AND deleted_at IS NULL", [input.revenueEntryId]);
      if (!entry.rows[0]) throw new ApiError(422, "Chi tiết doanh thu không hợp lệ");
      if (customerId && customerId !== entry.rows[0].customer_id) throw new ApiError(422, "Khách hàng không khớp với chi tiết doanh thu");
      customerId = entry.rows[0].customer_id;
    }
    if (!customerId) throw new ApiError(422, "Chọn khách hàng cho khoản giảm trừ");
    const customer = await client.query("SELECT id FROM customers WHERE id=$1 AND deleted_at IS NULL", [customerId]);
    if (!customer.rows[0]) throw new ApiError(422, "Khách hàng không hợp lệ");
    const row = await client.query("INSERT INTO revenue_reductions(code,occurred_at,customer_id,revenue_entry_id,type,amount,note,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id,code", [code("GDT"), input.occurredAt, customerId, input.revenueEntryId ?? null, input.type, input.amount, input.note || null, actorId]);
    await audit(client, actorId, "finance", "create_revenue_reduction", "revenue_reduction", row.rows[0].id, { amount: input.amount, type: input.type });
    return row.rows[0];
  });
}

export async function updateRevenueEntryPayment(id: string, paidAmount: number, actorId: string) {
  return transaction(async (client) => {
    const entry = await client.query<{ total_amount: string }>("SELECT total_amount FROM revenue_entries WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!entry.rows[0]) throw new ApiError(404, "Không tìm thấy chi tiết doanh thu");
    const total = Number(entry.rows[0].total_amount);
    if (paidAmount > total) throw new ApiError(422, "Số đã thanh toán không vượt tổng thu");
    const paymentStatus = paidAmount === 0 ? "unpaid" : paidAmount === total ? "paid" : "partial";
    await client.query("UPDATE revenue_entries SET paid_amount=$1,payment_status=$2,updated_at=now(),updated_by=$3 WHERE id=$4", [paidAmount, paymentStatus, actorId, id]);
    await audit(client, actorId, "finance", "update_revenue_payment", "revenue_entry", id, { paidAmount, paymentStatus });
    return { id, paidAmount, paymentStatus };
  });
}

export async function getRevenueEntryPaymentTarget(id: string) {
  const result = await query<{ id: string; ownerId: string | null }>("SELECT id,employee_id AS \"ownerId\" FROM revenue_entries WHERE id=$1 AND deleted_at IS NULL", [id]);
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy chi tiết doanh thu");
  return result.rows[0];
}

// —— Finance ——
export async function getInvoice(id: string) {
  const result = await query<{
    id: string; code: string; customerId: string; orderId: string | null; contractId: string | null;
    status: string; amount: string; paidAmount: string; dueDate: string | null; ownerId: string | null; createdAt: string;
  }>(
    `SELECT id, code, customer_id AS "customerId", order_id AS "orderId", contract_id AS "contractId", status, amount, paid_amount AS "paidAmount", due_date AS "dueDate", owner_id AS "ownerId", created_at AS "createdAt"
     FROM invoices WHERE id=$1 AND deleted_at IS NULL`, [id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Không tìm thấy hóa đơn");
  const payments = await query(
    `SELECT id, code, amount, method, paid_at AS "paidAt", note FROM payments WHERE invoice_id=$1 AND deleted_at IS NULL ORDER BY paid_at DESC`, [id],
  );
  return { ...result.rows[0], payments: payments.rows, remaining: Number(result.rows[0].amount) - Number(result.rows[0].paidAmount) };
}

// —— Documents ——
export async function listDocuments(entityType: string, entityId: string) {
  if (!DOCUMENT_ENTITY_TYPES.includes(entityType)) throw new ApiError(422, "Loại tài liệu không được hỗ trợ");
  await resolveDocumentEntityOwner(entityType, entityId);
  const result = await query(
    `SELECT id, entity_type AS "entityType", entity_id AS "entityId", original_name AS "originalName", storage_key AS "storageKey", mime_type AS "mimeType", size_bytes AS "sizeBytes", uploaded_by AS "uploadedBy", created_at AS "createdAt"
     FROM documents WHERE entity_type=$1 AND entity_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [entityType, entityId],
  );
  return result.rows;
}

export async function createDocument(input: { entityType: string; entityId: string; originalName: string; storageKey: string; mimeType: string; sizeBytes: number }, actorId: string) {
  await resolveDocumentEntityOwner(input.entityType, input.entityId);
  const result = await query(
    `INSERT INTO documents(entity_type,entity_id,original_name,storage_key,mime_type,size_bytes,uploaded_by)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, entity_type AS "entityType", entity_id AS "entityId", original_name AS "originalName", storage_key AS "storageKey", mime_type AS "mimeType", size_bytes AS "sizeBytes", created_at AS "createdAt"`,
    [input.entityType, input.entityId, input.originalName, input.storageKey, input.mimeType, input.sizeBytes, actorId],
  );
  return result.rows[0];
}

// —— Analytics ——
export async function getAnalyticsDashboard() {
  const [pipeline, revenue, receivables, overdueTasks, topCustomers, topProducts, lowStock] = await Promise.all([
    query<{ stage: string; count: string; value: string }>(`SELECT stage, count(*)::text count, COALESCE(sum(value),0)::text value FROM deals WHERE deleted_at IS NULL GROUP BY stage ORDER BY stage`),
    query<{ total: string }>(`SELECT COALESCE(sum(paid_amount),0)::text total FROM invoices WHERE deleted_at IS NULL AND status IN ('partial','paid')`),
    query<{ total: string }>(`SELECT COALESCE(sum(amount - paid_amount),0)::text total FROM invoices WHERE deleted_at IS NULL AND status IN ('unpaid','partial')`),
    query<{ count: string }>(`SELECT count(*)::text count FROM tasks WHERE deleted_at IS NULL AND status='open' AND due_at < now()`),
    query<{ id: string; name: string; revenue: string }>(`SELECT c.id, c.name, COALESCE(sum(i.paid_amount),0)::text revenue FROM customers c LEFT JOIN invoices i ON i.customer_id=c.id AND i.deleted_at IS NULL WHERE c.deleted_at IS NULL GROUP BY c.id ORDER BY sum(i.paid_amount) DESC NULLS LAST LIMIT 10`),
    query<{ id: string; name: string; qty: string; revenue: string }>(`SELECT p.id, p.name, COALESCE(sum(ol.qty),0)::text qty, COALESCE(sum(ol.line_total),0)::text revenue FROM products p LEFT JOIN order_lines ol ON ol.product_id=p.id LEFT JOIN orders o ON o.id=ol.order_id AND o.status IN ('confirmed','fulfilled') AND o.deleted_at IS NULL WHERE p.deleted_at IS NULL GROUP BY p.id ORDER BY sum(ol.line_total) DESC NULLS LAST LIMIT 10`),
    query<{ productId: string; name: string; sku: string; qty: string; minStock: string }>(`SELECT p.id AS "productId", p.name, p.sku, COALESCE(sum(b.qty),0)::text qty, p.min_stock::text AS "minStock" FROM products p LEFT JOIN inventory_balances b ON b.product_id=p.id WHERE p.deleted_at IS NULL GROUP BY p.id HAVING COALESCE(sum(b.qty),0) < p.min_stock ORDER BY p.name`),
  ]);
  return {
    pipelineByStage: pipeline.rows.map((r) => ({ stage: r.stage, count: Number(r.count), value: Number(r.value) })),
    revenuePaid: Number(revenue.rows[0].total),
    receivables: Number(receivables.rows[0].total),
    overdueTasks: Number(overdueTasks.rows[0].count),
    topCustomers: topCustomers.rows.map((r) => ({ id: r.id, name: r.name, revenue: Number(r.revenue) })),
    topProducts: topProducts.rows.map((r) => ({ id: r.id, name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) })),
    lowStock: lowStock.rows.map((r) => ({ productId: r.productId, name: r.name, sku: r.sku, qty: Number(r.qty), minStock: Number(r.minStock) })),
  };
}

export async function getFinancialMatrixAnalytics(selectedYear?: number) {
  const year = selectedYear || 2025;

  const revRes = await query<{ m: number; business_type: string; total: string }>(
    `SELECT m,business_type,COALESCE(sum(total),0)::text AS total FROM (
       SELECT EXTRACT(MONTH FROM created_at)::int AS m,COALESCE(business_type,'new_construction') AS business_type,total FROM orders WHERE deleted_at IS NULL AND status IN ('confirmed','fulfilled') AND EXTRACT(YEAR FROM created_at)=$1
       UNION ALL SELECT EXTRACT(MONTH FROM occurred_at)::int,business_type,total_amount FROM revenue_entries WHERE deleted_at IS NULL AND EXTRACT(YEAR FROM occurred_at)=$1
     ) revenue GROUP BY m,business_type`,
    [year]
  );
  const reductionRes = await query<{ m: number; business_type: string; total: string }>(
    `SELECT EXTRACT(MONTH FROM rr.occurred_at)::int AS m,COALESCE(re.business_type,'retail') AS business_type,COALESCE(sum(rr.amount),0)::text AS total FROM revenue_reductions rr LEFT JOIN revenue_entries re ON re.id=rr.revenue_entry_id WHERE rr.deleted_at IS NULL AND EXTRACT(YEAR FROM rr.occurred_at)=$1 GROUP BY m,business_type`, [year],
  );

  const cogsRes = await query<{ m: number; btype: string; cogs: string }>(
    `SELECT m,btype,COALESCE(sum(cogs),0)::text AS cogs FROM (
       SELECT EXTRACT(MONTH FROM o.created_at)::int AS m, COALESCE(ol.business_type,o.business_type,'new_construction') AS btype, (ol.qty * ol.cost_price) AS cogs
       FROM orders o LEFT JOIN order_lines ol ON ol.order_id=o.id
       WHERE o.deleted_at IS NULL AND o.status IN ('confirmed','fulfilled') AND EXTRACT(YEAR FROM o.created_at)=$1
       UNION ALL SELECT EXTRACT(MONTH FROM occurred_at)::int,business_type,cost_amount FROM revenue_entries WHERE deleted_at IS NULL AND EXTRACT(YEAR FROM occurred_at)=$1
     ) costs GROUP BY m,btype`,
    [year]
  );

  const expRes = await query<{ m: number; cat: string; amount: string }>(
    `SELECT EXTRACT(MONTH FROM COALESCE(period_date, expense_date))::int as m, 
            COALESCE(category, expense_category, 'other') as cat, 
            COALESCE(sum(amount),0)::text as amount 
     FROM operating_expenses 
     WHERE deleted_at IS NULL AND EXTRACT(YEAR FROM COALESCE(period_date, expense_date)) = $1 
     GROUP BY m, cat`,
    [year]
  );

  const revMap: Record<string, number[]> = {
    new_construction: Array(12).fill(0),
    repair: Array(12).fill(0),
    warranty: Array(12).fill(0),
    retail: Array(12).fill(0),
  };

  const cogsMap: Record<string, number[]> = {
    new_construction: Array(12).fill(0),
    repair: Array(12).fill(0),
    warranty: Array(12).fill(0),
    retail: Array(12).fill(0),
  };

  const expMap: Record<string, number[]> = {
    salary: Array(12).fill(0),
    insurance: Array(12).fill(0),
    office_rent: Array(12).fill(0),
    tax: Array(12).fill(0),
    management: Array(12).fill(0),
    admin: Array(12).fill(0),
    tech_dept: Array(12).fill(0),
    other: Array(12).fill(0),
  };

  for (const r of revRes.rows) {
    const mIdx = r.m - 1;
    if (mIdx >= 0 && mIdx < 12) {
      const btype = r.business_type || "retail";
      if (revMap[btype]) revMap[btype][mIdx] += Number(r.total);
      else revMap["retail"][mIdx] += Number(r.total);
    }
  }

  for (const r of reductionRes.rows) {
    const mIdx = r.m - 1;
    if (mIdx >= 0 && mIdx < 12) {
      const btype = r.business_type || "retail";
      if (revMap[btype]) revMap[btype][mIdx] -= Number(r.total);
      else revMap.retail[mIdx] -= Number(r.total);
    }
  }

  for (const r of cogsRes.rows) {
    const mIdx = r.m - 1;
    if (mIdx >= 0 && mIdx < 12) {
      const btype = r.btype || "retail";
      if (cogsMap[btype]) cogsMap[btype][mIdx] += Number(r.cogs);
      else cogsMap["retail"][mIdx] += Number(r.cogs);
    }
  }

  for (const r of expRes.rows) {
    const mIdx = r.m - 1;
    if (mIdx >= 0 && mIdx < 12) {
      const cat = r.cat || "other";
      const key = cat === "admin" || cat === "management" ? "management" : cat;
      if (expMap[key]) expMap[key][mIdx] += Number(r.amount);
      else expMap["other"][mIdx] += Number(r.amount);
    }
  }

  const calcRow = (
    id: string,
    codeStr: string,
    name: string,
    months: number[],
    options: { isHeader?: boolean; isSummary?: boolean; indent?: boolean } = {}
  ) => {
    const quarters = [
      months[0] + months[1] + months[2],
      months[3] + months[4] + months[5],
      months[6] + months[7] + months[8],
      months[9] + months[10] + months[11],
    ];
    const ytd = quarters.reduce((a, b) => a + b, 0);
    return { id, code: codeStr, name, months, quarters, ytd, ...options };
  };

  const rev1_1 = calcRow("r1_1", "1.1", "- Thi công công trình mới", revMap.new_construction, { indent: true });
  const rev1_2 = calcRow("r1_2", "1.2", "- Sửa chữa", revMap.repair, { indent: true });
  const rev1_3 = calcRow("r1_3", "1.3", "- Bảo hành", revMap.warranty, { indent: true });
  const rev1_4 = calcRow("r1_4", "1.4", "- Bán buôn, bán lẻ", revMap.retail, { indent: true });

  const totalRevMonths = Array(12)
    .fill(0)
    .map((_, i) => revMap.new_construction[i] + revMap.repair[i] + revMap.warranty[i] + revMap.retail[i]);
  const sec1 = calcRow("r1", "1", "1.Doanh thu hoạt động (TT)", totalRevMonths, { isHeader: true });

  const cogs2_1 = calcRow("r2_1", "2.1", "- Thi công công trình mới", cogsMap.new_construction, { indent: true });
  const cogs2_2 = calcRow("r2_2", "2.2", "- Sửa chữa", cogsMap.repair, { indent: true });
  const cogs2_3 = calcRow("r2_3", "2.3", "- Bảo hành", cogsMap.warranty, { indent: true });
  const cogs2_4 = calcRow("r2_4", "2.4", "- Bán tại cửa hàng, bán lẻ", cogsMap.retail, { indent: true });

  const totalCogsMonths = Array(12)
    .fill(0)
    .map((_, i) => cogsMap.new_construction[i] + cogsMap.repair[i] + cogsMap.warranty[i] + cogsMap.retail[i]);
  const sec2 = calcRow("r2", "2", "2. Giá vốn hàng bán", totalCogsMonths, { isHeader: true });

  const gp3_1 = calcRow("r3_1", "3.1", "- Thi công công trình mới", Array(12).fill(0).map((_, i) => revMap.new_construction[i] - cogsMap.new_construction[i]), { indent: true });
  const gp3_2 = calcRow("r3_2", "3.2", "- Sửa chữa", Array(12).fill(0).map((_, i) => revMap.repair[i] - cogsMap.repair[i]), { indent: true });
  const gp3_3 = calcRow("r3_3", "3.3", "- Bảo hành", Array(12).fill(0).map((_, i) => revMap.warranty[i] - cogsMap.warranty[i]), { indent: true });
  const gp3_4 = calcRow("r3_4", "3.4", "- Bán tại cửa hàng, bán lẻ", Array(12).fill(0).map((_, i) => revMap.retail[i] - cogsMap.retail[i]), { indent: true });

  const totalGpMonths = Array(12)
    .fill(0)
    .map((_, i) => totalRevMonths[i] - totalCogsMonths[i]);
  const sec3 = calcRow("r3", "3", "3. Lợi nhuận gộp (3)=(1)-(2)", totalGpMonths, { isHeader: true, isSummary: true });

  const exp4_1 = calcRow("r4_1", "4.1", "- Chi phí tiền lương", expMap.salary, { indent: true });
  const exp4_2 = calcRow("r4_2", "4.2", "- Chi trả bảo hiểm", expMap.insurance, { indent: true });
  const exp4_3 = calcRow("r4_3", "4.3", "- Chi phí thuê văn phòng", expMap.office_rent, { indent: true });
  const exp4_4 = calcRow("r4_4", "4.4", "- Chi phí thuế", expMap.tax, { indent: true });
  const exp4_5 = calcRow("r4_5", "4.5", "- Chi phí quản lý DN", expMap.management, { indent: true });
  const exp4_6 = calcRow("r4_6", "4.6", "- Chi phí dùng cho phòng KT", expMap.tech_dept, { indent: true });
  const exp4_7 = calcRow("r4_7", "4.7", "- Chi phí Khác", expMap.other, { indent: true });

  const totalExpMonths = Array(12)
    .fill(0)
    .map(
      (_, i) =>
        expMap.salary[i] +
        expMap.insurance[i] +
        expMap.office_rent[i] +
        expMap.tax[i] +
        expMap.management[i] +
        expMap.tech_dept[i] +
        expMap.other[i]
    );
  const sec4 = calcRow("r4", "4", "4. Chi Phí", totalExpMonths, { isHeader: true });

  const totalProfitMonths = Array(12)
    .fill(0)
    .map((_, i) => totalGpMonths[i] - totalExpMonths[i]);
  const sec5 = calcRow("r5", "5", "5. Lãi (5)= (3)-(4)", totalProfitMonths, { isHeader: true, isSummary: true });

  const rows = [
    sec1, rev1_1, rev1_2, rev1_3, rev1_4,
    sec2, cogs2_1, cogs2_2, cogs2_3, cogs2_4,
    sec3, gp3_1, gp3_2, gp3_3, gp3_4,
    sec4, exp4_1, exp4_2, exp4_3, exp4_4, exp4_5, exp4_6, exp4_7,
    sec5,
  ];

  const monthlyOverview = Array(12)
    .fill(0)
    .map((_, i) => ({
      month: i + 1,
      monthName: `Tháng ${i + 1}`,
      revenue: totalRevMonths[i],
      cogs: totalCogsMonths[i],
      grossProfit: totalGpMonths[i],
      expenses: totalExpMonths[i],
      netProfit: totalProfitMonths[i],
    }));

  const revenueBreakdown = [
    { name: "Thi công công trình mới", value: rev1_1.ytd, color: "#2563eb" },
    { name: "Sửa chữa", value: rev1_2.ytd, color: "#16a34a" },
    { name: "Bảo hành", value: rev1_3.ytd, color: "#ca8a04" },
    { name: "Bán buôn, bán lẻ", value: rev1_4.ytd, color: "#0891b2" },
  ];

  const expenseBreakdown = [
    { name: "Chi phí tiền lương", value: exp4_1.ytd, color: "#2563eb" },
    { name: "Chi trả bảo hiểm", value: exp4_2.ytd, color: "#16a34a" },
    { name: "Chi phí thuê văn phòng", value: exp4_3.ytd, color: "#ca8a04" },
    { name: "Chi phí thuế", value: exp4_4.ytd, color: "#dc2626" },
    { name: "Chi phí quản lý DN", value: exp4_5.ytd, color: "#7c3aed" },
    { name: "Chi phí phòng KT", value: exp4_6.ytd, color: "#0891b2" },
    { name: "Chi phí Khác", value: exp4_7.ytd, color: "#64748b" },
  ];

  return {
    year,
    availableYears: [2025, 2026],
    rows,
    monthlyOverview,
    revenueBreakdown,
    expenseBreakdown,
  };
}

export type FinanceReportFilters = { from?: string; to?: string; customerId?: string; employeeId?: string; projectId?: string };

/** Summary reports are computed by PostgreSQL, so filtering is not limited by list-page size. */
export async function getFinanceReport(filters: FinanceReportFilters) {
  const manualValues: unknown[] = [];
  const orderValues: unknown[] = [];
  const manualWhere = ["re.deleted_at IS NULL"];
  const orderWhere = ["o.deleted_at IS NULL", "o.status IN ('confirmed','fulfilled')"];
  const add = (value: string, manualColumn: string, orderColumn?: string) => {
    manualValues.push(value); manualWhere.push(`${manualColumn}$${manualValues.length}`);
    if (orderColumn) { orderValues.push(value); orderWhere.push(`${orderColumn}$${orderValues.length}`); }
    else orderWhere.push("FALSE");
  };
  if (filters.from) add(filters.from, "re.occurred_at >=", "o.created_at::date >=");
  if (filters.to) add(filters.to, "re.occurred_at <=", "o.created_at::date <=");
  if (filters.customerId) add(filters.customerId, "re.customer_id=", "o.customer_id=");
  if (filters.employeeId) add(filters.employeeId, "re.employee_id=", "o.owner_id=");
  if (filters.projectId) add(filters.projectId, "re.project_id=");

  // Normalise data from manual revenue and confirmed orders into one reporting shape.
  const manualSql = `SELECT re.customer_id AS "customerId", re.employee_id AS "employeeId", re.project_id AS "projectId", re.total_amount AS revenue, re.cost_amount AS cogs, re.paid_amount AS paid FROM revenue_entries re WHERE ${manualWhere.join(" AND ")}`;
  const orderSql = `SELECT o.customer_id AS "customerId", o.owner_id AS "employeeId", NULL::uuid AS "projectId", o.total AS revenue, COALESCE(sum(ol.qty*ol.cost_price),0) AS cogs, LEAST(o.total,COALESCE((SELECT sum(i.paid_amount) FROM invoices i WHERE i.order_id=o.id AND i.deleted_at IS NULL AND i.status <> 'cancelled'),0)) AS paid FROM orders o LEFT JOIN order_lines ol ON ol.order_id=o.id WHERE ${orderWhere.join(" AND ")} AND NOT EXISTS (SELECT 1 FROM invoices i JOIN revenue_entries linked_re ON linked_re.invoice_id=i.id AND linked_re.deleted_at IS NULL WHERE i.order_id=o.id AND i.deleted_at IS NULL) GROUP BY o.id`;
  const allValues = [...manualValues, ...orderValues];
  const offsetOrder = manualValues.length;
  const shiftedOrderSql = orderSql.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + offsetOrder}`);
  const revenue = await query<{ customerId: string; employeeId: string | null; projectId: string | null; revenue: string; cogs: string; paid: string }>(`SELECT * FROM (${manualSql} UNION ALL ${shiftedOrderSql}) report_rows`, allValues);

  const reductions = await query<{ total: string }>(`SELECT COALESCE(sum(rr.amount),0)::text AS total FROM revenue_reductions rr JOIN revenue_entries re ON re.id=rr.revenue_entry_id WHERE rr.deleted_at IS NULL AND ${manualWhere.join(" AND ")}`, manualValues);
  const expenseValues: unknown[] = []; const expenseWhere = ["deleted_at IS NULL"];
  if (filters.from) { expenseValues.push(filters.from); expenseWhere.push(`COALESCE(period_date,expense_date) >= $${expenseValues.length}`); }
  if (filters.to) { expenseValues.push(filters.to); expenseWhere.push(`COALESCE(period_date,expense_date) <= $${expenseValues.length}`); }
  const expenses = await query<{ category: string; total: string }>(`SELECT COALESCE(category,expense_category,'other') AS category,COALESCE(sum(amount),0)::text AS total FROM operating_expenses WHERE ${expenseWhere.join(" AND ")} GROUP BY COALESCE(category,expense_category,'other')`, expenseValues);
  const customerTotals = new Map<string, { revenue: number; cogs: number; paid: number }>();
  for (const row of revenue.rows) { const current = customerTotals.get(row.customerId) ?? { revenue: 0, cogs: 0, paid: 0 }; current.revenue += Number(row.revenue); current.cogs += Number(row.cogs); current.paid += Number(row.paid); customerTotals.set(row.customerId, current); }
  const grossRevenue = revenue.rows.reduce((sum, row) => sum + Number(row.revenue), 0);
  const cogs = revenue.rows.reduce((sum, row) => sum + Number(row.cogs), 0);
  const reductionsTotal = Number(reductions.rows[0]?.total ?? 0);
  const laborCost = expenses.rows.filter((row) => row.category === "salary").reduce((sum, row) => sum + Number(row.total), 0);
  const otherExpenses = expenses.rows.filter((row) => row.category !== "salary").reduce((sum, row) => sum + Number(row.total), 0);
  return { summary: { grossRevenue, reductions: reductionsTotal, netRevenue: grossRevenue - reductionsTotal, cogs, laborCost, otherExpenses, profit: grossRevenue - reductionsTotal - cogs - laborCost - otherExpenses, receivable: Math.max(0, grossRevenue - reductionsTotal - revenue.rows.reduce((sum, row) => sum + Number(row.paid), 0)) }, customers: [...customerTotals.entries()].map(([customerId, value]) => ({ customerId, ...value, receivable: Math.max(0, value.revenue - value.paid) })) };
}

