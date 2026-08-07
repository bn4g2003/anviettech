import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getDeal, softDeleteDeal, updateDeal } from "@/features/crm/services/domain-service";
import { dealSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await getDeal(id);
    await requirePermission("deals", "view", deal.ownerId as string);
    return ok(deal);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await getDeal(id);
    const user = await requirePermission("deals", "update", deal.ownerId as string);
    const body = dealSchema.partial().omit({ customerId: true, productIds: true }).parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== deal.ownerId
      ? await resolveOwnerForCreate(user, "deals", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateDeal(id, { ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await getDeal(id);
    const user = await requirePermission("deals", "delete", deal.ownerId as string);
    await softDeleteDeal(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
