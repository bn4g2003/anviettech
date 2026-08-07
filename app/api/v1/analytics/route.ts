import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getAnalyticsDashboard, getFinancialMatrixAnalytics } from "@/features/crm/services/domain-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics", "view");
    const searchParams = req.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : 2025;

    const [dashboard, matrix] = await Promise.all([
      getAnalyticsDashboard(),
      getFinancialMatrixAnalytics(year),
    ]);

    return ok({
      ...dashboard,
      matrix,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
