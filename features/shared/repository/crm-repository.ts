/**
 * Repository layer — sole bridge between services and Zustand persist store.
 * UI components must NOT import this module or call localStorage.
 */
import { getCrmStore, type CrmState } from "@/features/shared/store/crm-store";
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

type EntityKey =
  | "customers"
  | "products"
  | "deals"
  | "tasks"
  | "quotes"
  | "contracts"
  | "orders"
  | "stockLevels"
  | "stockMoves"
  | "invoices"
  | "payments"
  | "campaigns";

const setters: Record<EntityKey, (rows: never[]) => void> = {
  customers: (rows) => getCrmStore().setCustomers(rows as Customer[]),
  products: (rows) => getCrmStore().setProducts(rows as Product[]),
  deals: (rows) => getCrmStore().setDeals(rows as Deal[]),
  tasks: (rows) => getCrmStore().setTasks(rows as Task[]),
  quotes: (rows) => getCrmStore().setQuotes(rows as Quote[]),
  contracts: (rows) => getCrmStore().setContracts(rows as Contract[]),
  orders: (rows) => getCrmStore().setOrders(rows as Order[]),
  stockLevels: (rows) => getCrmStore().setStockLevels(rows as StockLevel[]),
  stockMoves: (rows) => getCrmStore().setStockMoves(rows as StockMove[]),
  invoices: (rows) => getCrmStore().setInvoices(rows as Invoice[]),
  payments: (rows) => getCrmStore().setPayments(rows as Payment[]),
  campaigns: (rows) => getCrmStore().setCampaigns(rows as Campaign[]),
};

function read<K extends EntityKey>(key: K): CrmState[K] {
  return getCrmStore()[key];
}

function write<K extends EntityKey>(key: K, rows: CrmState[K]) {
  setters[key](rows as never[]);
}

export const crmRepository = {
  getState: () => getCrmStore(),

  listCustomers: () => read("customers"),
  saveCustomers: (rows: Customer[]) => write("customers", rows),

  listProducts: () => read("products"),
  saveProducts: (rows: Product[]) => write("products", rows),

  listDeals: () => read("deals"),
  saveDeals: (rows: Deal[]) => write("deals", rows),

  listTasks: () => read("tasks"),
  saveTasks: (rows: Task[]) => write("tasks", rows),

  listQuotes: () => read("quotes"),
  saveQuotes: (rows: Quote[]) => write("quotes", rows),

  listContracts: () => read("contracts"),
  saveContracts: (rows: Contract[]) => write("contracts", rows),

  listOrders: () => read("orders"),
  saveOrders: (rows: Order[]) => write("orders", rows),

  listStockLevels: () => read("stockLevels"),
  saveStockLevels: (rows: StockLevel[]) => write("stockLevels", rows),

  listStockMoves: () => read("stockMoves"),
  saveStockMoves: (rows: StockMove[]) => write("stockMoves", rows),

  listInvoices: () => read("invoices"),
  saveInvoices: (rows: Invoice[]) => write("invoices", rows),

  listPayments: () => read("payments"),
  savePayments: (rows: Payment[]) => write("payments", rows),

  listCampaigns: () => read("campaigns"),
  saveCampaigns: (rows: Campaign[]) => write("campaigns", rows),

  resetDemo: () => getCrmStore().resetDemo(),
};
