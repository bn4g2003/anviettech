import { crmRepository } from "@/features/shared/repository/crm-repository";
import { DEAL_STAGE_META, type DealStage } from "@/features/deals/types";
import { financeService } from "@/features/finance/services/finance-service";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { customersService } from "@/features/customers/services/customers-service";

export type AnalyticsSnapshot = {
  revenueThisMonth: number;
  pipelineValue: number;
  winRate: number;
  totalDebt: number;
  lowStockCount: number;
  openTasks: number;
  dealsByStage: { stage: DealStage; label: string; count: number; value: number }[];
  topCustomers: { customerId: string; name: string; revenue: number }[];
  revenueByMonth: { month: string; amount: number }[];
  revenueForecast: { month: string; actual?: number; forecast?: number }[];
  categoryRevenue: { category: string; revenue: number; color: string }[];
  replenishmentForecast: {
    productId: string;
    name: string;
    category: string;
    stock: number;
    forecastQty: number;
    coverageDays: number;
  }[];
};

export const analyticsService = {
  snapshot(): AnalyticsSnapshot {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const invoices = crmRepository.listInvoices().filter((i) => i.status !== "cancelled");
    const revenueThisMonth = invoices
      .filter((i) => {
        const d = new Date(i.createdAt);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, i) => acc + i.paidAmount, 0);

    const deals = crmRepository.listDeals();
    const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const pipelineValue = openDeals.reduce((acc, d) => acc + d.value, 0);

    const closed = deals.filter((d) => d.stage === "won" || d.stage === "lost");
    const won = deals.filter((d) => d.stage === "won");
    const winRate = closed.length === 0 ? 0 : Math.round((won.length / closed.length) * 100);

    const debts = financeService.debtByCustomer();
    const totalDebt = debts.reduce((acc, d) => acc + d.debt, 0);

    const stages = Object.keys(DEAL_STAGE_META) as DealStage[];
    const dealsByStage = stages.map((stage) => {
      const rows = deals.filter((d) => d.stage === stage);
      return {
        stage,
        label: DEAL_STAGE_META[stage].label,
        count: rows.length,
        value: rows.reduce((acc, d) => acc + d.value, 0),
      };
    });

    const revenueMap = new Map<string, number>();
    for (const inv of invoices) {
      const cus = inv.customerId;
      revenueMap.set(cus, (revenueMap.get(cus) ?? 0) + inv.paidAmount);
    }
    const topCustomers = [...revenueMap.entries()]
      .map(([customerId, revenue]) => ({
        customerId,
        name: customersService.getById(customerId)?.name ?? customerId,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const revenueByMonth: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const amount = invoices
        .filter((inv) => {
          const id = new Date(inv.createdAt);
          return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
        })
        .reduce((acc, inv) => acc + inv.paidAmount, 0);
      revenueByMonth.push({ month: label, amount });
    }

    const averageMonthlyChange = revenueByMonth.length < 2
      ? 0
      : revenueByMonth.slice(1).reduce((sum, item, index) => (
        sum + item.amount - revenueByMonth[index].amount
      ), 0) / (revenueByMonth.length - 1);
    const lastRevenue = revenueByMonth.at(-1)?.amount ?? 0;
    const nextMonth = new Date(year, month + 1, 1);
    const followingMonth = new Date(year, month + 2, 1);
    const forecastFor = (period: number) => Math.max(0, Math.round(lastRevenue + averageMonthlyChange * period));
    const revenueForecast = [
      ...revenueByMonth.slice(-4).map((item) => ({ month: item.month, actual: item.amount })),
      { month: `${String(nextMonth.getMonth() + 1).padStart(2, "0")}/${nextMonth.getFullYear()}`, forecast: forecastFor(1) },
      { month: `${String(followingMonth.getMonth() + 1).padStart(2, "0")}/${followingMonth.getFullYear()}`, forecast: forecastFor(2) },
    ];

    const categoryColors = ["#2563eb", "#0891b2", "#16a34a", "#ea580c", "#7c3aed", "#ca8a04"];
    const categoryTotals = new Map<string, number>();
    const productById = new Map(crmRepository.listProducts().map((product) => [product.id, product]));
    for (const order of crmRepository.listOrders()) {
      for (const line of order.lines) {
        const category = productById.get(line.productId)?.category ?? "Khác";
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + line.lineTotal);
      }
    }
    const categoryRevenue = [...categoryTotals.entries()]
      .map(([category, revenue], index) => ({ category, revenue, color: categoryColors[index % categoryColors.length] }))
      .sort((a, b) => b.revenue - a.revenue);

    const recentOrderLines = crmRepository.listOrders()
      .filter((order) => Date.now() - new Date(order.createdAt).getTime() <= 90 * 24 * 60 * 60 * 1000)
      .flatMap((order) => order.lines);
    const quantitiesByProduct = new Map<string, number>();
    for (const line of recentOrderLines) {
      quantitiesByProduct.set(line.productId, (quantitiesByProduct.get(line.productId) ?? 0) + line.qty);
    }
    const replenishmentForecast = crmRepository.listProducts()
      .filter((product) => product.minStock > 0)
      .map((product) => {
        const stock = inventoryService.getQty(product.id);
        const forecastQty = Math.max(1, Math.ceil((quantitiesByProduct.get(product.id) ?? 0) / 3));
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          stock,
          forecastQty,
          coverageDays: Math.floor((stock / forecastQty) * 30),
        };
      })
      .sort((a, b) => a.coverageDays - b.coverageDays)
      .slice(0, 5);

    return {
      revenueThisMonth,
      pipelineValue,
      winRate,
      totalDebt,
      lowStockCount: inventoryService.lowStock().length,
      openTasks: crmRepository.listTasks().filter((t) => t.status === "open").length,
      dealsByStage,
      topCustomers,
      revenueByMonth,
      revenueForecast,
      categoryRevenue,
      replenishmentForecast,
    };
  },
};
