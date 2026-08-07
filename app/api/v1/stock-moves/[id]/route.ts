import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { deleteDraftStockMove, getStockMove } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const move = await getStockMove(id);
    await requirePermission("inventory", "view", move.ownerId);
    return ok(move);
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const move = await getStockMove(id);
    const user = await requirePermission("inventory", "delete", move.ownerId);
    await deleteDraftStockMove(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
