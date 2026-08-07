import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createRole, listRoles } from "@/features/auth/services/roles-service";
import { roleSchema } from "@/features/auth/validation";

export async function GET() {
  try {
    await requirePermission("roles", "view");
    return ok(await listRoles());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("roles", "create");
    return ok(await createRole(roleSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
