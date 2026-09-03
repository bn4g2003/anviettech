import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getProject, softDeleteProject, updateProject } from "@/features/crm/services/domain-service";
import { projectUpdateSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    await requirePermission("projects", "view", project.ownerId as string);
    return ok(project);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    const user = await requirePermission("projects", "update", project.ownerId as string);
    const body = projectUpdateSchema.parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== project.ownerId
      ? await resolveOwnerForCreate(user, "projects", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateProject(id, { ...body, ownerId }, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    const user = await requirePermission("projects", "delete", project.ownerId as string);
    await softDeleteProject(id, user.id);
    return ok({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
