import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { updateProductSupplier } from "@/features/crm/services/domain-service";
import { productSupplierSchema } from "@/features/crm/validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; relationId: string }> }) { try { const { id, relationId } = await params; const user = await requirePermission("products", "update"); return ok(await updateProductSupplier(id, relationId, productSupplierSchema.partial().parse(await parseJson(request)), user.id)); } catch (error) { return errorResponse(error); } }
