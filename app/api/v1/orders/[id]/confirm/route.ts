import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getOrder } from "@/features/crm/services/domain-service";
import { confirmOrder } from "@/features/sales/services/sales-workflow-service";
import { confirmOrderSchema } from "@/features/crm/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrder(id);
    const user = await requirePermission("orders", "approve", order.ownerId as string);
    const body = confirmOrderSchema.parse(await parseJson(request));
    return ok(await confirmOrder(id, user.id, body.warehouseId));
  } catch (error) { return errorResponse(error); }
}
