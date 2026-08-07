import { errorResponse, ok } from "@/lib/api";
import { getResource, listResource, type ResourceName } from "@/features/crm/services/crm-service";
import { pageSchema } from "@/features/crm/validation";
import { requireBusinessUser } from "@/features/auth/services/auth-service";
import { ApiError } from "@/lib/api";

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params;
    const config = getResource(resource);
    const user = await requireBusinessUser();
    const query = pageSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const permissions = user.permissions.filter(
      (item) => (item.module === "*" || item.module === config.module) && item.action === "view",
    );
    if (!permissions.length) throw new ApiError(403, "Bạn không có quyền xem dữ liệu này");
    const result = await listResource(resource as ResourceName, {
      ...query,
      status: query.stage ?? query.status,
      actorId: user.id,
      canViewAll: permissions.some((item) => item.scope === "all"),
    });
    return ok(result.rows, result.meta);
  } catch (error) {
    return errorResponse(error);
  }
}
