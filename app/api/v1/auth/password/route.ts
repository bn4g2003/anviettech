import { errorResponse, noContent, parseJson } from "@/lib/api";
import { requireUser, changePassword } from "@/features/auth/services/auth-service";
import { passwordSchema } from "@/features/auth/validation";
export async function PATCH(request: Request) { try { const user=await requireUser(); const input=passwordSchema.parse(await parseJson(request)); await changePassword(user.id,input.currentPassword,input.nextPassword); return noContent(); } catch(error) { return errorResponse(error); } }
