import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getWarehouse, softDeleteWarehouse, updateWarehouse } from "@/features/crm/services/domain-service";
import { warehouseSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requirePermission("inventory", "view");
    return ok(await getWarehouse(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission("inventory", "update");
    const body = warehouseSchema.partial().parse(await parseJson(request));
    return ok(await updateWarehouse(id, body, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission("inventory", "delete");
    await softDeleteWarehouse(id, user.id);
    return ok({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
