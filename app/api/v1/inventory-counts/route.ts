import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createInventoryCount } from "@/features/crm/services/domain-service";
import { inventoryCountSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";
export async function GET(request: Request) { return listHandler(request, "inventory_counts", "inventory"); }
export async function POST(request: Request) { try { const user = await requirePermission("inventory", "create"); return ok(await createInventoryCount(inventoryCountSchema.parse(await parseJson(request)), user.id)); } catch (error) { return errorResponse(error); } }
