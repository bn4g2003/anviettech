import { crmRepository } from "@/features/shared/repository/crm-repository";

export function resetDemoData() {
  crmRepository.resetDemo();
}
