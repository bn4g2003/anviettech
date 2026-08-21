import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, requirePermission } from "@/features/auth/services/auth-service";
import { createUser, listActiveUsers, listUsers } from "@/features/auth/services/users-service";
import { userSchema } from "@/features/auth/validation";

export async function GET() {
  try {
    const user = await requireBusinessUser();
    const hasFullView = user.permissions.some(
      (p) => (p.module === "users" || p.module === "*") && p.action === "view"
    );
    if (hasFullView) {
      return ok(await listUsers());
    }
    return ok(await listActiveUsers());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("users", "create");
    return ok(await createUser(userSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
