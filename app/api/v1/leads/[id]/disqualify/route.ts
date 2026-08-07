import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { disqualifyLead, getLead } from "@/features/crm/services/domain-service";
import { disqualifySchema } from "@/features/crm/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    const user = await requirePermission("leads", "update", lead.ownerId as string);
    const body = disqualifySchema.parse(await parseJson(request));
    return ok(await disqualifyLead(id, body.reason, user.id));
  } catch (error) { return errorResponse(error); }
}
