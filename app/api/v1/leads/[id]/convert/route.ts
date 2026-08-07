import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { convertLead } from "@/features/crm/services/crm-service";
import { getLead } from "@/features/crm/services/domain-service";
import { leadConvertSchema } from "@/features/crm/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    const user = await requirePermission("leads", "update", lead.ownerId as string);
    return ok(await convertLead(id, user.id, leadConvertSchema.parse(await parseJson(request))));
  } catch (error) { return errorResponse(error); }
}
