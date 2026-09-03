import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createWarehouse } from "@/features/crm/services/domain-service";
import { listHandler } from "@/features/crm/services/list-handler";
import { warehouseSchema } from "@/features/crm/validation";
export async function GET(request: Request) {
  return listHandler(request, "warehouses", "inventory");
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("inventory", "create");
    const body = warehouseSchema.parse(await parseJson(request));
    return ok(await createWarehouse(body, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
