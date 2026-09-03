import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { updateRevenueEntryPayment } from "@/features/crm/services/domain-service";
import { revenueEntryPaymentSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("finance", "update");
    const { id } = await params;
    const input = revenueEntryPaymentSchema.parse(await parseJson(request));
    return ok(await updateRevenueEntryPayment(id, input.paidAmount, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
