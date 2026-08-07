import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getQuote, softDeleteQuote, updateQuote } from "@/features/crm/services/domain-service";
import { quoteSchema } from "@/features/crm/validation";
import { z } from "zod";

const dbUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID không hợp lệ");

const updateSchema = z.object({
  validUntil: z.string().optional(),
  terms: z.string().max(5000).optional(),
  dealId: dbUuid.optional(),
  lines: quoteSchema.shape.lines.optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    await requirePermission("quotes", "view", quote.ownerId as string);
    return ok(quote);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    const user = await requirePermission("quotes", "update", quote.ownerId as string);
    return ok(await updateQuote(id, updateSchema.parse(await parseJson(request)), user.id));
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    const user = await requirePermission("quotes", "delete", quote.ownerId as string);
    await softDeleteQuote(id, user.id);
    return ok({ id });
  } catch (error) { return errorResponse(error); }
}
