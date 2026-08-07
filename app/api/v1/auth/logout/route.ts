import { errorResponse, noContent } from "@/lib/api";
import { logout } from "@/features/auth/services/auth-service";
export async function POST() { try { await logout(); return noContent(); } catch (error) { return errorResponse(error); } }
