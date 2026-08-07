import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getAnalyticsDashboard } from "@/features/crm/services/domain-service";

export async function GET() {
  try {
    await requirePermission("analytics", "view");
    return ok(await getAnalyticsDashboard());
  } catch (error) { return errorResponse(error); }
}
