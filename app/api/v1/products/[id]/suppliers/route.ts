import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createProductSupplier, listProductSuppliers } from "@/features/crm/services/domain-service";
import { productSupplierSchema } from "@/features/crm/validation";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; await requirePermission("products", "view"); return ok(await listProductSuppliers(id)); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const user = await requirePermission("products", "update"); return ok(await createProductSupplier(id, productSupplierSchema.parse(await parseJson(request)), user.id)); } catch (error) { return errorResponse(error); } }
