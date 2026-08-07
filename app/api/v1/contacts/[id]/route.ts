import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { deleteContact, getContact, updateContact } from "@/features/crm/services/domain-service";
import { contactSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contact = await getContact(id);
    const user = await requirePermission("contacts", "update", contact.customerOwnerId);
    return ok(await updateContact(id, contactSchema.partial().omit({ customerId: true }).parse(await parseJson(request)), user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contact = await getContact(id);
    const user = await requirePermission("contacts", "delete", contact.customerOwnerId);
    await deleteContact(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
