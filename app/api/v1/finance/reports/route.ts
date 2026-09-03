import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getFinanceReport } from "@/features/crm/services/domain-service";
import { financeReportFilterSchema } from "@/features/crm/validation";

export async function GET(request: Request) {
  try {
    await requirePermission("finance", "view");
    const filters = financeReportFilterSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return ok(await getFinanceReport(filters));
  } catch (error) {
    return errorResponse(error);
  }
}
