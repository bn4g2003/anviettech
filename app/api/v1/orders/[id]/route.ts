import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getOrder, updateDraftOrder } from "@/features/crm/services/domain-service";
import { orderUpdateSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrder(id);
    await requirePermission("orders", "view", order.ownerId as string);
    return ok(order);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrder(id);
    const user = await requirePermission("orders", "update", order.ownerId as string);
    return ok(await updateDraftOrder(id, orderUpdateSchema.parse(await parseJson(request)), user.id));
  } catch (error) { return errorResponse(error); }
}
