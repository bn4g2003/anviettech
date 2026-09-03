import { z } from "zod";

const dbUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID không hợp lệ");
const optionalDbUuid = dbUuid.optional().nullable().or(z.literal("")).transform((v) => (v ? v : undefined));

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  ownerId: optionalDbUuid,
  customerId: optionalDbUuid,
  dealId: optionalDbUuid,
  sort: z.string().trim().max(40).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  type: z.string().trim().max(40).optional(),
  stage: z.string().trim().max(40).optional(),
  due: z.enum(["overdue", "today", "upcoming"]).optional(),
  scope: z.enum(["my"]).optional(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(255),
  type: z.enum(["company", "individual"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  address: z.string().max(1000).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  ownerId: optionalDbUuid,
  campaignId: optionalDbUuid,
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2).max(255),
  companyName: z.string().trim().max(255).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  ownerId: optionalDbUuid,
  campaignId: optionalDbUuid,
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const leadConvertSchema = z.object({
  customerName: z.string().trim().min(2).max(255),
  contactName: z.string().trim().max(255).optional(),
  createDeal: z.boolean(),
  dealTitle: z.string().trim().max(255).optional(),
  dealValue: z.coerce.number().min(0).optional(),
}).refine((value) => !value.createDeal || !!value.dealTitle, { message: "Nhập tên cơ hội", path: ["dealTitle"] });

export const leadSchema = leadConvertSchema;

export const disqualifySchema = z.object({ reason: z.string().trim().min(2).max(1000) });

export const contactSchema = z.object({
  customerId: dbUuid,
  fullName: z.string().trim().min(2).max(255),
  jobTitle: z.string().max(160).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const activitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "note"]),
  subject: z.string().trim().min(2).max(255),
  content: z.string().max(5000).optional(),
  customerId: optionalDbUuid,
  leadId: optionalDbUuid,
  dealId: optionalDbUuid,
  occurredAt: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2).max(255),
  type: z.enum(["call", "email", "meeting", "todo", "followup"]),
  dueAt: z.string().optional(),
  ownerId: optionalDbUuid,
  customerId: optionalDbUuid,
  leadId: optionalDbUuid,
  dealId: optionalDbUuid,
  notes: z.string().max(5000).optional(),
  status: z.enum(["open", "done", "cancelled"]).optional(),
});

export const dealSchema = z.object({
  title: z.string().trim().min(2).max(255),
  customerId: dbUuid,
  contactId: optionalDbUuid,
  value: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  ownerId: optionalDbUuid,
  notes: z.string().max(5000).optional(),
  productIds: z.array(dbUuid).optional(),
});

export const dealStageSchema = z.object({
  stage: z.enum(["new", "demo", "negotiation", "ready", "won", "lost"]),
  reason: z.string().trim().max(1000).optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(255),
  category: z.string().max(120).optional(),
  unit: z.string().trim().min(1).max(32),
  unitPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0).optional(),
  vatPercent: z.coerce.number().min(0).max(100).optional(),
  minStock: z.coerce.number().min(0).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  itemType: z.enum(["goods", "service"]).optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(255),
  contactName: z.string().trim().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  ownerId: optionalDbUuid,
});

const projectFieldsSchema = z.object({
  name: z.string().trim().min(2).max(255),
  customerId: dbUuid,
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["planning", "active", "completed", "cancelled"]).optional(),
  startDate: z.string().date().optional().or(z.literal("")),
  endDate: z.string().date().optional().or(z.literal("")),
  ownerId: optionalDbUuid,
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const projectSchema = projectFieldsSchema.refine(
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
  { message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu", path: ["endDate"] },
);

export const projectUpdateSchema = projectFieldsSchema.partial().refine(
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
  { message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu", path: ["endDate"] },
);

export const warehouseSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const quoteLineSchema = z.object({
  productId: dbUuid,
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  vatPercent: z.coerce.number().min(0).max(100).optional(),
});

export const quoteSchema = z.object({
  customerId: dbUuid,
  dealId: optionalDbUuid,
  validUntil: z.string().optional(),
  ownerId: optionalDbUuid,
  terms: z.string().max(5000).optional(),
  lines: z.array(quoteLineSchema).min(1),
});

export const contractSchema = z.object({
  customerId: dbUuid,
  quoteId: optionalDbUuid,
  dealId: optionalDbUuid,
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
  value: z.coerce.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: optionalDbUuid,
  terms: z.string().max(5000).optional().or(z.literal("")),
});

export const orderUpdateSchema = z.object({
  lines: z.array(z.object({
    productId: dbUuid,
    qty: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0),
  })).min(1),
});

export const confirmOrderSchema = z.object({ warehouseId: dbUuid });

export const paymentSchema = z.object({
  invoiceId: dbUuid,
  amount: z.coerce.number().positive(),
  method: z.enum(["cash", "transfer", "card", "other"]),
  paidAt: z.string().min(1),
  note: z.string().max(2000).optional(),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(2).max(255),
  channel: z.string().trim().min(1).max(32),
  budget: z.coerce.number().min(0).optional(),
  spent: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: optionalDbUuid,
  status: z.enum(["draft", "running", "paused", "completed"]).optional(),
});

export const stockMoveSchema = z.object({
  type: z.enum(["in", "out", "transfer"]),
  reason: z.enum(["purchase_receipt", "customer_return", "warranty_receipt", "installation_issue", "sales_issue", "supplier_return", "transfer"]),
  requestId: optionalDbUuid,
  warehouseFromId: optionalDbUuid,
  warehouseToId: optionalDbUuid,
  supplierId: optionalDbUuid,
  customerId: optionalDbUuid,
  projectId: optionalDbUuid,
  note: z.string().max(2000).optional(),
  post: z.boolean().optional(),
  lines: z.array(z.object({ productId: dbUuid, qty: z.coerce.number().positive() })).min(1),
}).superRefine((value, ctx) => {
  const need = (field: "supplierId" | "customerId" | "projectId", message: string) => {
    if (!value[field]) ctx.addIssue({ code: "custom", path: [field], message });
  };
  if (["purchase_receipt", "supplier_return"].includes(value.reason)) need("supplierId", "Chọn nhà cung cấp");
  if (["customer_return", "warranty_receipt", "sales_issue"].includes(value.reason)) need("customerId", "Chọn khách hàng");
  if (value.reason === "installation_issue") need("projectId", "Chọn công trình");
  const expectedType = value.reason === "transfer" ? "transfer" : value.reason.endsWith("receipt") || value.reason === "customer_return" ? "in" : "out";
  if (value.type !== expectedType) ctx.addIssue({ code: "custom", path: ["type"], message: "Loại phiếu không khớp nghiệp vụ" });
});

export const productSupplierSchema = z.object({
  supplierId: dbUuid,
  supplierSku: z.string().trim().max(160).optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  minOrderQty: z.coerce.number().positive().optional(),
  isPreferred: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  note: z.string().max(2000).optional().or(z.literal("")),
});

export const serialNumberSchema = z.object({
  productId: dbUuid, serial: z.string().trim().min(1).max(160), warehouseId: optionalDbUuid,
  customerId: optionalDbUuid, projectId: optionalDbUuid,
  status: z.enum(["in_stock", "installed", "warranty", "damaged", "returned"]).optional(),
  warrantyUntil: z.string().date().optional().or(z.literal("")), note: z.string().max(2000).optional().or(z.literal("")),
});

export const inventoryCountSchema = z.object({
  warehouseId: dbUuid, countedAt: z.string().optional(), note: z.string().max(2000).optional(),
  lines: z.array(z.object({ productId: dbUuid, countedQty: z.coerce.number().min(0) })).min(1),
});

export const operatingExpenseSchema = z.object({
  category: z.enum(["salary", "insurance", "office_rent", "tax", "management", "tech_dept", "other"]),
  amount: z.coerce.number().positive(), expenseDate: z.string().date(), note: z.string().max(2000).optional().or(z.literal("")),
});

export const revenueEntrySchema = z.object({
  occurredAt: z.string().date(), customerId: dbUuid, projectId: optionalDbUuid, productId: dbUuid, employeeId: optionalDbUuid,
  invoiceId: optionalDbUuid, documentCode: z.string().trim().max(80).optional().or(z.literal("")),
  businessType: z.enum(["new_construction", "repair", "warranty", "retail"]), qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0), vatPercent: z.coerce.number().min(0).max(100), costAmount: z.coerce.number().min(0),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]), paidAmount: z.coerce.number().min(0), note: z.string().max(2000).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  const total = value.qty * value.unitPrice * (1 + value.vatPercent / 100);
  if (value.paidAmount > total) ctx.addIssue({ code: "custom", path: ["paidAmount"], message: "Số đã thanh toán không vượt tổng thu" });
  if (value.paymentStatus === "paid" && value.paidAmount !== total) ctx.addIssue({ code: "custom", path: ["paidAmount"], message: "Khoản đã thanh toán phải bằng tổng thu" });
});

export const revenueReductionSchema = z.object({
  occurredAt: z.string().date(), customerId: optionalDbUuid, revenueEntryId: optionalDbUuid,
  type: z.enum(["discount", "return", "other"]), amount: z.coerce.number().positive(), note: z.string().max(2000).optional().or(z.literal("")),
}).refine((value) => !!value.customerId || !!value.revenueEntryId, {
  message: "Chọn chi tiết doanh thu hoặc khách hàng cho khoản giảm trừ",
  path: ["customerId"],
});

export const revenueEntryPaymentSchema = z.object({
  paidAmount: z.coerce.number().min(0),
});

export const financeReportFilterSchema = z.object({
  from: z.string().date().optional(), to: z.string().date().optional(),
  customerId: optionalDbUuid, employeeId: optionalDbUuid, projectId: optionalDbUuid,
}).refine((value) => !value.from || !value.to || value.from <= value.to, { message: "Khoảng thời gian không hợp lệ", path: ["to"] });

export const documentSchema = z.object({
  entityType: z.enum(["customer", "lead", "deal", "quote", "order", "contract", "invoice", "campaign"]),
  entityId: dbUuid,
  originalName: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.coerce.number().int().min(0),
});
