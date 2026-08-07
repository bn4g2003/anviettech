import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getInvoice } from "@/features/crm/services/domain-service";
import { recordPayment } from "@/features/sales/services/sales-workflow-service";
import { paymentSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "payments", "finance");
}

export async function POST(request: Request) {
  try {
    const body = paymentSchema.parse(await parseJson(request));
    const invoice = await getInvoice(body.invoiceId);
    const user = await requirePermission("finance", "create", invoice.ownerId);
    return ok(await recordPayment(body, user.id));
  } catch (error) { return errorResponse(error); }
}
