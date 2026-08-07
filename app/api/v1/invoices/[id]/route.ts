import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getInvoice } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await getInvoice(id);
    await requirePermission("finance", "view", invoice.ownerId as string);
    return ok(invoice);
  } catch (error) { return errorResponse(error); }
}
