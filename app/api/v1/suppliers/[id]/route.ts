import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getSupplier, softDeleteSupplier, updateSupplier } from "@/features/crm/services/domain-service";
import { supplierSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await getSupplier(id);
    await requirePermission("suppliers", "view", supplier.ownerId as string);
    return ok(supplier);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await getSupplier(id);
    const user = await requirePermission("suppliers", "update", supplier.ownerId as string);
    const body = supplierSchema.partial().parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== supplier.ownerId
      ? await resolveOwnerForCreate(user, "suppliers", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateSupplier(id, { ...body, ownerId }, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await getSupplier(id);
    const user = await requirePermission("suppliers", "delete", supplier.ownerId as string);
    await softDeleteSupplier(id, user.id);
    return ok({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
