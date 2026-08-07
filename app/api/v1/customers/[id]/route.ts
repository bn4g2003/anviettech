import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getCustomer, softDeleteCustomer, updateCustomer } from "@/features/crm/services/domain-service";
import { customerSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await getCustomer(id);
    await requirePermission("customers", "view", customer.ownerId as string);
    return ok(customer);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await getCustomer(id);
    const user = await requirePermission("customers", "update", customer.ownerId as string);
    const body = customerSchema.partial().parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== customer.ownerId
      ? await resolveOwnerForCreate(user, "customers", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateCustomer(id, { ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await getCustomer(id);
    const user = await requirePermission("customers", "delete", customer.ownerId as string);
    await softDeleteCustomer(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
