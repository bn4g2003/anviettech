import { errorResponse, ok } from "@/lib/api";
import { requireBusinessUser, type CurrentUser } from "@/features/auth/services/auth-service";
import { listResource, type ResourceName } from "@/features/crm/services/crm-service";
import { pageSchema } from "@/features/crm/validation";
import { ApiError } from "@/lib/api";

export function canView(user: CurrentUser, module: string) {
  return user.permissions.filter((item) => (item.module === "*" || item.module === module) && item.action === "view");
}

export async function listHandler(request: Request, resource: ResourceName, module: string) {
  try {
    const user = await requireBusinessUser();
    const permissions = canView(user, module);
    if (!permissions.length) throw new ApiError(403, "Bạn không có quyền xem dữ liệu này");
    const params = pageSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const status = params.stage ?? params.status;
    const result = await listResource(resource, {
      ...params,
      status,
      actorId: user.id,
      canViewAll: permissions.some((item) => item.scope === "all"),
      type: params.type,
      due: params.due,
      scope: params.scope,
    });
    return ok(result.rows, result.meta);
  } catch (error) {
    return errorResponse(error);
  }
}
