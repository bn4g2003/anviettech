import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { listPermissions } from "@/features/auth/services/roles-service";

export async function GET() {
  try {
    await requirePermission("roles", "view");
    return ok(await listPermissions());
  } catch (error) {
    return errorResponse(error);
  }
}
