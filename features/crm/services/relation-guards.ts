import { query } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ensurePermission } from "@/features/auth/services/permission-utils";
import type { CurrentUser } from "@/features/auth/services/auth-types";

export async function assertContactBelongsToCustomer(contactId: string, customerId: string) {
  const result = await query<{ customer_id: string }>(
    "SELECT customer_id FROM contacts WHERE id=$1 AND deleted_at IS NULL",
    [contactId],
  );
  if (!result.rows[0]) throw new ApiError(422, "Liên hệ không tồn tại");
  if (result.rows[0].customer_id !== customerId) {
    throw new ApiError(422, "Liên hệ không thuộc khách hàng của cơ hội");
  }
}

export async function assertDealBelongsToCustomer(dealId: string, customerId: string) {
  const result = await query<{ customer_id: string }>(
    "SELECT customer_id FROM deals WHERE id=$1 AND deleted_at IS NULL",
    [dealId],
  );
  if (!result.rows[0]) throw new ApiError(422, "Cơ hội không tồn tại");
  if (result.rows[0].customer_id !== customerId) {
    throw new ApiError(422, "Cơ hội không thuộc khách hàng của báo giá");
  }
}

export async function assertCustomerExists(customerId: string) {
  const result = await query<{ id: string; status: string }>(
    "SELECT id, status FROM customers WHERE id=$1 AND deleted_at IS NULL",
    [customerId],
  );
  if (!result.rows[0]) throw new ApiError(422, "Khách hàng không tồn tại");
  return result.rows[0];
}

export async function assertLeadExists(leadId: string) {
  const result = await query<{ id: string; converted_customer_id: string | null }>(
    "SELECT id, converted_customer_id FROM leads WHERE id=$1 AND deleted_at IS NULL",
    [leadId],
  );
  if (!result.rows[0]) throw new ApiError(422, "Lead không tồn tại");
  return result.rows[0];
}

export async function assertDealExists(dealId: string) {
  const result = await query<{ id: string; customer_id: string }>(
    "SELECT id, customer_id FROM deals WHERE id=$1 AND deleted_at IS NULL",
    [dealId],
  );
  if (!result.rows[0]) throw new ApiError(422, "Cơ hội không tồn tại");
  return result.rows[0];
}

/** Ensure customer/lead/deal links point at consistent parents when multiple are set. */
export async function assertLinkedEntitiesConsistent(input: {
  customerId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
}) {
  let customerId = input.customerId ?? null;

  if (input.dealId) {
    const deal = await assertDealExists(input.dealId);
    if (customerId && deal.customer_id !== customerId) {
      throw new ApiError(422, "Cơ hội không thuộc khách hàng đã chọn");
    }
    customerId = customerId ?? deal.customer_id;
  }

  if (input.leadId) {
    const lead = await assertLeadExists(input.leadId);
    if (customerId && lead.converted_customer_id && lead.converted_customer_id !== customerId) {
      throw new ApiError(422, "Lead không thuộc khách hàng đã chọn");
    }
  }

  if (input.customerId) {
    await assertCustomerExists(input.customerId);
  }
}

/** Require read access to each parent record before attaching a task/activity. */
export async function assertActorCanAccessLinkedEntities(
  user: CurrentUser,
  input: { customerId?: string | null; leadId?: string | null; dealId?: string | null },
) {
  const checks = [
    input.customerId ? { table: "customers", module: "customers", id: input.customerId } : null,
    input.leadId ? { table: "leads", module: "leads", id: input.leadId } : null,
    input.dealId ? { table: "deals", module: "deals", id: input.dealId } : null,
  ].filter((item): item is { table: "customers" | "leads" | "deals"; module: "customers" | "leads" | "deals"; id: string } => item !== null);

  for (const item of checks) {
    const result = await query<{ owner_id: string | null }>(
      `SELECT owner_id FROM ${item.table} WHERE id=$1 AND deleted_at IS NULL`,
      [item.id],
    );
    if (!result.rows[0]) throw new ApiError(422, "Bản ghi liên kết không tồn tại");
    ensurePermission(user, item.module, "view", result.rows[0].owner_id);
  }
}

const DOCUMENT_ENTITY_TABLES: Record<string, { table: string; ownerColumn: string }> = {
  customer: { table: "customers", ownerColumn: "owner_id" },
  lead: { table: "leads", ownerColumn: "owner_id" },
  deal: { table: "deals", ownerColumn: "owner_id" },
  quote: { table: "quotes", ownerColumn: "owner_id" },
  order: { table: "orders", ownerColumn: "owner_id" },
  contract: { table: "contracts", ownerColumn: "owner_id" },
  invoice: { table: "invoices", ownerColumn: "owner_id" },
  campaign: { table: "campaigns", ownerColumn: "owner_id" },
};

export const DOCUMENT_ENTITY_TYPES = Object.keys(DOCUMENT_ENTITY_TABLES);

/** Returns entity owner_id; 404 if entity missing; 422 if entity type not allowed. */
export async function resolveDocumentEntityOwner(entityType: string, entityId: string): Promise<string | null> {
  const config = DOCUMENT_ENTITY_TABLES[entityType];
  if (!config) throw new ApiError(422, "Loại tài liệu không được hỗ trợ");
  const result = await query<{ owner_id: string | null }>(
    `SELECT ${config.ownerColumn} AS owner_id FROM ${config.table} WHERE id=$1 AND deleted_at IS NULL`,
    [entityId],
  );
  if (!result.rows[0]) throw new ApiError(404, "Thực thể gắn tài liệu không tồn tại");
  return result.rows[0].owner_id;
}
