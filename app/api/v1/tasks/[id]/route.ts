import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getTask, softDeleteTask, updateTask } from "@/features/crm/services/domain-service";
import { taskSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await getTask(id);
    const user = await requirePermission("tasks", "update", task.ownerId);
    const body = taskSchema.partial().parse(await parseJson(request));
    let ownerId = body.ownerId;
    if (ownerId && ownerId !== task.ownerId) {
      ownerId = await resolveOwnerForCreate(user, "tasks", "update", ownerId);
    }
    return ok(await updateTask(id, { ...body, ownerId }, user.id, { actor: user }));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await getTask(id);
    const user = await requirePermission("tasks", "delete", task.ownerId);
    await softDeleteTask(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
