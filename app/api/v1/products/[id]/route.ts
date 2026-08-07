import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { softDeleteProduct, updateProduct } from "@/features/crm/services/domain-service";
import { productSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("products", "update");
    const { id } = await params;
    return ok(await updateProduct(id, productSchema.partial().parse(await parseJson(request)), user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("products", "delete");
    const { id } = await params;
    await softDeleteProduct(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
