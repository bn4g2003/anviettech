import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getStockMove, postStockMove } from "@/features/crm/services/domain-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const move = await getStockMove(id);
    const user = await requirePermission("inventory", "approve", move.ownerId);
    return ok(await postStockMove(id, user.id));
  } catch (error) { return errorResponse(error); }
}
