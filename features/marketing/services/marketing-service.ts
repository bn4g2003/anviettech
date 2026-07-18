import type { Campaign, CampaignInput } from "@/features/marketing/types";
import { customersService } from "@/features/customers/services/customers-service";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";
import type { Customer } from "@/features/customers/types";

function nextCode(rows: Campaign[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `MK-${String(max + 1).padStart(4, "0")}`;
}

export const marketingService = {
  list(): Campaign[] {
    return crmRepository.listCampaigns();
  },

  getById(id: string): Campaign | undefined {
    return crmRepository.listCampaigns().find((c) => c.id === id);
  },

  search(query: string, filters?: { status?: string; channel?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listCampaigns().filter((c) => {
      if (filters?.status && c.status !== filters.status) return false;
      if (filters?.channel && c.channel !== filters.channel) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });
  },

  create(input: CampaignInput): Campaign {
    const rows = crmRepository.listCampaigns();
    const now = nowIso();
    const row: Campaign = {
      ...input,
      id: createId("camp"),
      code: input.code ?? nextCode(rows),
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveCampaigns([row, ...rows]);
    return row;
  },

  update(id: string, patch: Partial<CampaignInput>): Campaign {
    const rows = crmRepository.listCampaigns();
    const idx = rows.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Không tìm thấy chiến dịch");
    const next = { ...rows[idx], ...patch, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveCampaigns(copy);
    return next;
  },

  convertLeadToCustomer(
    campaignId: string,
    data: Pick<Customer, "name" | "phone" | "email" | "owner"> & Partial<Customer>,
  ): Customer {
    const campaign = this.getById(campaignId);
    const customer = customersService.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      owner: data.owner,
      type: data.type ?? "company",
      address: data.address ?? "",
      source: "Marketing",
      status: "lead",
      campaignId,
      contactName: data.contactName,
      logoColor: data.logoColor ?? "#6366f1",
    });
    if (campaign) {
      this.update(campaignId, { leadsCount: campaign.leadsCount + 1 });
    }
    return customer;
  },

  remove(id: string): void {
    crmRepository.saveCampaigns(crmRepository.listCampaigns().filter((c) => c.id !== id));
  },
};
