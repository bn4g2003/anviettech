import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createProduct } from "@/features/crm/services/domain-service";
import { productSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "products", "products");
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("products", "create");
    return ok(await createProduct(productSchema.parse(await parseJson(request)), user.id));
  } catch (error) { return errorResponse(error); }
}
