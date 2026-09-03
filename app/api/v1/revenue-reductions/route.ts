import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createRevenueReduction } from "@/features/crm/services/domain-service";
import { revenueReductionSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "revenue_reductions", "finance");
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("finance", "create");
    return ok(await createRevenueReduction(revenueReductionSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
