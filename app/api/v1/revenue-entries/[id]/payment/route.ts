import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getRevenueEntryPaymentTarget, updateRevenueEntryPayment } from "@/features/crm/services/domain-service";
import { revenueEntryPaymentSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const target = await getRevenueEntryPaymentTarget(id);
    const user = await requirePermission("finance", "update", target.ownerId);
    const input = revenueEntryPaymentSchema.parse(await parseJson(request));
    return ok(await updateRevenueEntryPayment(id, input.paidAmount, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
