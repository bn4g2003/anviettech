import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getLead, qualifyLead } from "@/features/crm/services/domain-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    const user = await requirePermission("leads", "update", lead.ownerId as string);
    return ok(await qualifyLead(id, user.id));
  } catch (error) { return errorResponse(error); }
}
