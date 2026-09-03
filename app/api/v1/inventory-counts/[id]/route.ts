import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getInventoryCount } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const count = await getInventoryCount(id);
    await requirePermission("inventory", "view", count.ownerId);
    return ok(count);
  } catch (error) { return errorResponse(error); }
}
