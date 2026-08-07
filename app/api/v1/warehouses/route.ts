import { listHandler } from "@/features/crm/services/list-handler";
export async function GET(request: Request) {
  return listHandler(request, "warehouses", "inventory");
}
