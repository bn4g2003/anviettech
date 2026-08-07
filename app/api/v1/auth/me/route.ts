import { errorResponse, ok } from "@/lib/api";
import { requireUser } from "@/features/auth/services/auth-service";
export async function GET() { try { return ok(await requireUser()); } catch (error) { return errorResponse(error); } }
