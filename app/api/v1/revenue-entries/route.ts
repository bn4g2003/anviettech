import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createRevenueEntry } from "@/features/crm/services/domain-service";
import { revenueEntrySchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) { return listHandler(request, "revenue_entries", "finance"); }
export async function POST(request: Request) { try { const user = await requirePermission("finance", "create"); return ok(await createRevenueEntry(revenueEntrySchema.parse(await parseJson(request)), user.id)); } catch (error) { return errorResponse(error); } }
