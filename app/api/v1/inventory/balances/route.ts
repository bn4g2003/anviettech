import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { listBalances } from "@/features/crm/services/domain-service";

export async function GET() {
  try {
    await requirePermission("inventory", "view");
    return ok(await listBalances());
  } catch (error) { return errorResponse(error); }
}
