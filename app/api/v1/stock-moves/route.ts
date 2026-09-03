import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createStockMove } from "@/features/crm/services/domain-service";
import { stockMoveSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "stock_moves", "inventory");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const ownerId = await resolveOwnerForCreate(user, "inventory", "create", user.id);
    const input = stockMoveSchema.parse(await parseJson(request));
    if (input.post) await requirePermission("inventory", "approve", ownerId);
    return ok(await createStockMove(input, ownerId));
  } catch (error) { return errorResponse(error); }
}
