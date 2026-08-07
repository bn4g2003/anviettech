import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { changeDealStage, getDeal } from "@/features/crm/services/domain-service";
import { dealStageSchema } from "@/features/crm/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await getDeal(id);
    const user = await requirePermission("deals", "update", deal.ownerId as string);
    const body = dealStageSchema.parse(await parseJson(request));
    return ok(await changeDealStage(id, body.stage, body.reason, user.id));
  } catch (error) { return errorResponse(error); }
}
