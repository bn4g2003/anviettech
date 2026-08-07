import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getLead, softDeleteLead, updateLead } from "@/features/crm/services/domain-service";
import { leadCreateSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    await requirePermission("leads", "view", lead.ownerId as string);
    return ok(lead);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    const user = await requirePermission("leads", "update", lead.ownerId as string);
    const body = leadCreateSchema.partial().parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== lead.ownerId
      ? await resolveOwnerForCreate(user, "leads", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateLead(id, { ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await getLead(id);
    const user = await requirePermission("leads", "delete", lead.ownerId as string);
    await softDeleteLead(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
