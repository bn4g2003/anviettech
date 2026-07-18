"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "@/features/customers/types";
import type { Product } from "@/features/products/types";
import type { Deal } from "@/features/deals/types";
import type { Task } from "@/features/tasks/types";
import type { Quote } from "@/features/quotes/types";
import type { Contract } from "@/features/contracts/types";
import type { Order } from "@/features/orders/types";
import type { StockLevel, StockMove } from "@/features/inventory/types";
import type { Invoice, Payment } from "@/features/finance/types";
import type { Campaign } from "@/features/marketing/types";
import { createSeedData } from "@/features/shared/seed";

export type CrmState = {
  customers: Customer[];
  products: Product[];
  deals: Deal[];
  tasks: Task[];
  quotes: Quote[];
  contracts: Contract[];
  orders: Order[];
  stockLevels: StockLevel[];
  stockMoves: StockMove[];
  invoices: Invoice[];
  payments: Payment[];
  campaigns: Campaign[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  replaceAll: (data: ReturnType<typeof createSeedData>) => void;
  resetDemo: () => void;
  // Generic entity setters used only by repository layer
  setCustomers: (rows: Customer[]) => void;
  setProducts: (rows: Product[]) => void;
  setDeals: (rows: Deal[]) => void;
  setTasks: (rows: Task[]) => void;
  setQuotes: (rows: Quote[]) => void;
  setContracts: (rows: Contract[]) => void;
  setOrders: (rows: Order[]) => void;
  setStockLevels: (rows: StockLevel[]) => void;
  setStockMoves: (rows: StockMove[]) => void;
  setInvoices: (rows: Invoice[]) => void;
  setPayments: (rows: Payment[]) => void;
  setCampaigns: (rows: Campaign[]) => void;
};

const seed = createSeedData();

export const useCrmStore = create<CrmState>()(
  persist(
    (set) => ({
      ...seed,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      replaceAll: (data) => set({ ...data }),
      resetDemo: () => set({ ...createSeedData() }),
      setCustomers: (customers) => set({ customers }),
      setProducts: (products) => set({ products }),
      setDeals: (deals) => set({ deals }),
      setTasks: (tasks) => set({ tasks }),
      setQuotes: (quotes) => set({ quotes }),
      setContracts: (contracts) => set({ contracts }),
      setOrders: (orders) => set({ orders }),
      setStockLevels: (stockLevels) => set({ stockLevels }),
      setStockMoves: (stockMoves) => set({ stockMoves }),
      setInvoices: (invoices) => set({ invoices }),
      setPayments: (payments) => set({ payments }),
      setCampaigns: (campaigns) => set({ campaigns }),
    }),
    {
      name: "anviet-crm-v2",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        customers: state.customers,
        products: state.products,
        deals: state.deals,
        tasks: state.tasks,
        quotes: state.quotes,
        contracts: state.contracts,
        orders: state.orders,
        stockLevels: state.stockLevels,
        stockMoves: state.stockMoves,
        invoices: state.invoices,
        payments: state.payments,
        campaigns: state.campaigns,
      }),
    },
  ),
);

/** Imperative access for services — never import this in UI components. */
export function getCrmStore() {
  return useCrmStore.getState();
}
