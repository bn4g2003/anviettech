import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createDocument, listDocuments } from "@/features/crm/services/domain-service";
import { resolveDocumentEntityOwner } from "@/features/crm/services/relation-guards";
import { documentSchema } from "@/features/crm/validation";
import { z } from "zod";

const dbUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID không hợp lệ");

export async function GET(request: Request) {
  try {
    const params = z.object({
      entityType: z.enum(["customer", "lead", "deal", "quote", "order", "contract", "invoice", "campaign"]),
      entityId: dbUuid,
    }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const ownerId = await resolveDocumentEntityOwner(params.entityType, params.entityId);
    await requirePermission("documents", "view", ownerId);
    return ok(await listDocuments(params.entityType, params.entityId));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const body = documentSchema.parse(await parseJson(request));
    const ownerId = await resolveDocumentEntityOwner(body.entityType, body.entityId);
    const user = await requirePermission("documents", "create", ownerId);
    return ok(await createDocument(body, user.id));
  } catch (error) { return errorResponse(error); }
}
