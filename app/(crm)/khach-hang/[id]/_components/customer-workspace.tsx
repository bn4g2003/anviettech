"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { customersService } from "@/features/customers/services/customers-service";
import type { Customer } from "@/features/customers/types";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META, type DealStage } from "@/features/deals/types";
import { useFinance } from "@/features/finance/hooks/use-finance";
import type { PaymentMethod } from "@/features/finance/types";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useProducts } from "@/features/products/hooks/use-products";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { daysFromNow, formatDate, formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { apiFetch } from "@/lib/api-client";
import { Building2, ChevronLeft, CircleDollarSign, Clock3, Handshake, Mail, MapPin, Phone, Plus, ReceiptText, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type WorkspaceExtra = {
  contacts: { id: string; fullName: string; email?: string; phone?: string; isPrimary: boolean; jobTitle?: string }[];
  activities: { id: string; type: string; subject: string; content?: string; occurredAt: string }[];
  documents: { id: string; originalName: string; storageKey: string; createdAt: string }[];
  audits: { id: string; action: string; module: string; createdAt: string }[];
};

export function CustomerWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [extra, setExtra] = useState<WorkspaceExtra>({ contacts: [], activities: [], documents: [], audits: [] });
  const [loading, setLoading] = useState(true);
  const dealsApi = useDeals({ customerId: id });
  const deals = dealsApi.rows;
  const tasks = useTasks({ customerId: id });
  const customerTasks = tasks.rows;
  const quotesApi = useQuotes({ customerId: id });
  const quotes = quotesApi.rows;
  const ordersApi = useOrders({ customerId: id });
  const contractsApi = useContracts({ customerId: id });
  const products = useProducts().all.filter((product) => product.status === "active");
  const finance = useFinance({ customerId: id });
  const invoices = finance.allInvoices.filter((invoice) => invoice.status !== "cancelled");
  const payments = finance.payments;
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  async function reloadCustomer() {
    setLoading(true);
    try {
      const [c, ws] = await Promise.all([
        customersService.getById(id),
        customersService.getWorkspace(id) as Promise<Record<string, unknown>>,
      ]);
      setCustomer(c);
      setExtra({
        contacts: (ws.contacts as WorkspaceExtra["contacts"]) ?? [],
        activities: (ws.activities as WorkspaceExtra["activities"]) ?? [],
        documents: (ws.documents as WorkspaceExtra["documents"]) ?? [],
        audits: (ws.audits as WorkspaceExtra["audits"]) ?? [],
      });
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadCustomer();
  }, [id]);

  if (loading) return <main className="flex h-full items-center justify-center text-sm text-muted">Đang tải...</main>;
  if (!customer) {
    return (
      <main className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-border bg-white p-6 text-center">
          <p className="font-medium">Không tìm thấy khách hàng</p>
          <Button className="mt-3" variant="outline" onClick={() => router.push("/khach-hang")}>
            Quay lại danh sách
          </Button>
        </div>
      </main>
    );
  }

  const debt = finance.getCustomerDebt(id);
  const paidTotal = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const openTasks = customerTasks.filter((task) => task.status === "open").length;
  const pipeline = deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost").reduce((sum, deal) => sum + deal.value, 0);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-surface">
      <div className="mx-auto max-w-7xl p-3 lg:p-4 space-y-3">
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/khach-hang")}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground shrink-0"
              title="Quay lại danh sách Khách hàng"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Khách hàng</span>
            </button>
            <span className="text-muted text-xs">/</span>
            <span className="font-mono text-xs text-muted shrink-0">{customer.code}</span>
            <span className="text-muted text-xs">/</span>
            <h1 className="text-sm font-semibold truncate text-foreground" title={customer.name}>
              {customer.name}
            </h1>
            <CustomerStatusBadge status={customer.status} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Tạo việc
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDealOpen(true)}>
              <Handshake className="h-3.5 w-3.5" />
              Tạo cơ hội
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuoteOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Tạo báo giá
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)} disabled={debt <= 0}>
              <CircleDollarSign className="h-3.5 w-3.5" />
              Ghi thanh toán
            </Button>
          </div>
        </div>

        {/* Compact Metrics Row */}
        <div className="grid grid-cols-2 rounded-lg border border-border bg-white sm:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <Metric label="Công nợ cần thu" value={formatVnd(debt)} tone={debt > 0 ? "danger" : "default"} />
          <Metric label="Đã thu thanh toán" value={formatVnd(paidTotal)} />
          <Metric label="Pipeline đang mở" value={formatVnd(pipeline)} />
          <Metric label="Công việc cần xử lý" value={String(openTasks)} />
          <Metric label="Cập nhật gần nhất" value={relativeTime(customer.updatedAt)} />
        </div>

        {/* 2-Column Split: Tabs Left, Rich Sidebar Right */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-lg border border-border bg-white p-3.5">
            <Tabs defaultValue="overview">
              <TabsList className="h-8">
                <TabsTrigger value="overview" className="text-xs px-2.5">Tổng quan</TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs px-2.5">Liên hệ ({extra.contacts.length})</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs px-2.5">Hoạt động & việc ({customerTasks.length})</TabsTrigger>
                <TabsTrigger value="deals" className="text-xs px-2.5">Cơ hội ({deals.length})</TabsTrigger>
                <TabsTrigger value="sales" className="text-xs px-2.5">BG / Đơn / HĐ</TabsTrigger>
                <TabsTrigger value="finance" className="text-xs px-2.5">Công nợ</TabsTrigger>
                <TabsTrigger value="docs" className="text-xs px-2.5">Tài liệu</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs px-2.5">Audit</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="grid gap-3 pt-3 lg:grid-cols-2">
                  <ActivityPanel tasks={customerTasks} activities={extra.activities} />
                  <InvoicePanel invoices={invoices} />
                </div>
              </TabsContent>
              <TabsContent value="contacts">
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setContactOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm liên hệ
                  </Button>
                </div>
                <div className="mt-2.5 space-y-2">
                  {extra.contacts.map((c) => (
                    <div key={c.id} className="rounded border border-border px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {c.fullName}
                        </span>
                        {c.isPrimary ? <Badge tone="neutral">Chính</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-muted">
                        {c.jobTitle || "—"} · SĐT: {c.phone || "—"} · Email: {c.email || "—"}
                      </p>
                    </div>
                  ))}
                  {!extra.contacts.length ? <p className="py-6 text-center text-xs text-muted">Chưa có liên hệ bổ sung.</p> : null}
                </div>
              </TabsContent>
              <TabsContent value="activity">
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
                    Ghi hoạt động
                  </Button>
                  <Button size="sm" onClick={() => setTaskOpen(true)}>
                    Tạo việc
                  </Button>
                </div>
                <div className="mt-2.5 grid gap-3 lg:grid-cols-2">
                  <ActivityPanel tasks={customerTasks} activities={extra.activities} />
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Công việc cần xử lý</h2>
                    <div className="mt-2 space-y-1.5">
                      {customerTasks.map((task) => (
                        <div key={task.id} className="rounded border border-border px-2.5 py-1.5 text-xs">
                          <p className="font-medium text-foreground">{task.title}</p>
                          <p className="text-[11px] text-muted">
                            Trạng thái: {task.status} · Hạn {formatDateTime(task.dueAt)}
                          </p>
                        </div>
                      ))}
                      {!customerTasks.length ? <p className="py-4 text-center text-xs text-muted">Chưa có việc.</p> : null}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="deals">
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setDealOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Tạo cơ hội
                  </Button>
                </div>
                <DealsPanel rows={deals} onStageChange={dealsApi.setStage} />
              </TabsContent>
              <TabsContent value="sales">
                <div className="space-y-3 pt-2">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setQuoteOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Tạo báo giá
                    </Button>
                  </div>
                  <QuotesPanel rows={quotes} onApprove={quotesApi.approve} onSend={quotesApi.send} toast={toast} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted pt-2 border-t border-border">Đơn hàng</h3>
                  {ordersApi.rows.map((o) => (
                    <div key={o.id} className="flex justify-between rounded border border-border px-2.5 py-1.5 text-xs">
                      <span className="font-mono">{o.code}</span>
                      <span>
                        {o.status} · {formatVnd(o.total)}
                      </span>
                    </div>
                  ))}
                  {ordersApi.rows.length === 0 ? <p className="text-xs text-muted">Chưa có đơn hàng.</p> : null}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted pt-2 border-t border-border">Hợp đồng</h3>
                  {contractsApi.rows.map((c) => (
                    <div key={c.id} className="flex justify-between rounded border border-border px-2.5 py-1.5 text-xs">
                      <span className="font-mono">{c.code}</span>
                      <span>
                        {c.status} · {formatVnd(c.value)}
                      </span>
                    </div>
                  ))}
                  {contractsApi.rows.length === 0 ? <p className="text-xs text-muted">Chưa có hợp đồng.</p> : null}
                </div>
              </TabsContent>
              <TabsContent value="finance">
                <FinancePanel invoices={invoices} payments={payments} />
              </TabsContent>
              <TabsContent value="docs">
                <DocsPanel customerId={id} documents={extra.documents} onCreated={reloadCustomer} toast={toast} />
              </TabsContent>
              <TabsContent value="audit">
                <div className="space-y-1.5 pt-2">
                  {extra.audits.map((a) => (
                    <div key={a.id} className="rounded border border-border px-2.5 py-1.5 text-xs">
                      <p className="font-medium text-foreground">
                        {a.module}/{a.action}
                      </p>
                      <p className="text-[11px] text-muted">{formatDateTime(a.createdAt)}</p>
                    </div>
                  ))}
                  {!extra.audits.length ? <p className="py-6 text-center text-xs text-muted">Chưa có audit.</p> : null}
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Right Sidebar: Rich, Balanced, Informative */}
          <aside className="space-y-3">
            {/* Card 1: Customer Profile Overview */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Hồ sơ khách hàng
              </h2>
              <div className="space-y-2 text-xs divide-y divide-border">
                <div className="pt-1">
                  <p className="text-[11px] text-muted">Tên doanh nghiệp / Khách hàng</p>
                  <p className="font-semibold text-foreground text-sm truncate">{customer.name}</p>
                </div>

                <div className="pt-2 flex justify-between">
                  <div>
                    <p className="text-[11px] text-muted">Hình thức</p>
                    <p className="font-medium text-foreground">
                      {customer.type === "company" ? "Doanh nghiệp" : "Cá nhân"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Nguồn tiếp cận</p>
                    <p className="font-medium text-foreground">{customer.source}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <div>
                    <p className="text-[11px] text-muted">Điện thoại</p>
                    <p className="font-medium text-foreground">{customer.phone || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Email</p>
                    <p className="font-medium text-foreground truncate max-w-[150px]">{customer.email || "—"}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-muted">Địa chỉ</p>
                  <p className="font-medium text-foreground leading-snug">{customer.address || "Chưa cập nhật"}</p>
                </div>

                <div className="pt-2 flex justify-between">
                  <div>
                    <p className="text-[11px] text-muted">Người phụ trách</p>
                    <p className="font-medium text-foreground">{customer.owner.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Ngày tạo</p>
                    <p className="font-medium text-foreground">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>

                {customer.notes ? (
                  <div className="pt-2">
                    <p className="text-[11px] text-muted">Ghi chú</p>
                    <p className="text-muted-foreground whitespace-pre-line text-[11px]">{customer.notes}</p>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Card 2: Quick Contacts */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Đầu mối liên hệ ({extra.contacts.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setContactOpen(true)} className="h-6 px-1.5 text-xs">
                  <Plus className="h-3 w-3 mr-0.5" />
                  Thêm
                </Button>
              </div>

              <div className="space-y-2 text-xs">
                {extra.contacts.slice(0, 3).map((c) => (
                  <div key={c.id} className="rounded border border-border p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{c.fullName}</span>
                      {c.isPrimary ? <Badge tone="neutral">Chính</Badge> : null}
                    </div>
                    {c.jobTitle ? <p className="text-[11px] text-muted">{c.jobTitle}</p> : null}
                    <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-foreground hover:underline">
                          <Phone className="h-3 w-3 text-muted" />
                          {c.phone}
                        </a>
                      ) : null}
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-foreground hover:underline truncate">
                          <Mail className="h-3 w-3 text-muted" />
                          {c.email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!extra.contacts.length ? (
                  <p className="text-xs text-muted italic">Chưa có thông tin đầu mối liên hệ.</p>
                ) : null}
              </div>
            </section>

            {/* Card 3: Financial Summary */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Tài chính & Sổ nợ
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setPaymentOpen(true)} disabled={debt <= 0} className="h-6 px-1.5 text-xs">
                  Thu nợ
                </Button>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Tổng nợ cần thu:</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatVnd(debt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Đã thanh toán:</span>
                  <span className="font-medium tabular-nums text-foreground">{formatVnd(paidTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Hóa đơn còn nợ:</span>
                  <span className="font-medium text-foreground">{invoices.filter((i) => i.amount > i.paidAmount).length}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} customerId={id} invoices={invoices} onSave={finance.recordPayment} toast={toast} owner={customer.owner} />
        <QuickTaskModal open={taskOpen} onOpenChange={setTaskOpen} customerId={id} owner={customer.owner} onSave={tasks.create} toast={toast} />
        <DealModal open={dealOpen} onOpenChange={setDealOpen} customerId={id} owner={customer.owner} onSave={dealsApi.create} toast={toast} />
        <QuoteModal open={quoteOpen} onOpenChange={setQuoteOpen} customerId={id} owner={customer.owner} deals={deals} products={products} onSave={quotesApi.create} toast={toast} />
        <ContactModal open={contactOpen} onOpenChange={setContactOpen} customerId={id} onCreated={reloadCustomer} toast={toast} />
        <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} customerId={id} onCreated={reloadCustomer} toast={toast} />
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={tone === "danger" ? "mt-0.5 text-sm font-bold tabular-nums text-danger" : "mt-0.5 text-sm font-bold tabular-nums text-foreground"}>{value}</p>
    </div>
  );
}
function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
      <div>
        <p className="text-[11px] text-muted">{label}</p>
        <p className="text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
function ActivityPanel({ tasks, activities }: { tasks: ReturnType<typeof useTasks>["all"]; activities: WorkspaceExtra["activities"] }) {
  return (
    <section>
      <div className="flex items-center justify-between pb-1 mb-2 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Hoạt động gần đây</h2>
        <Clock3 className="h-3.5 w-3.5 text-muted" />
      </div>
      <div className="space-y-0 border-l border-border pl-3">
        {(activities ?? []).slice(0, 4).map((a) => (
          <div key={a.id} className="relative pb-2.5">
            <i className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-neutral-900" />
            <p className="text-xs font-medium text-foreground">{a.subject}</p>
            <p className="text-[11px] text-muted">
              {a.type} · {formatDateTime(a.occurredAt)}
            </p>
          </div>
        ))}
        {(tasks ?? []).slice(0, 4).map((task) => (
          <div key={task.id} className="relative pb-2.5 last:pb-0">
            <i className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-neutral-400" />
            <p className="text-xs font-medium text-foreground">{task.title}</p>
            <p className="text-[11px] text-muted">
              {task.status === "done" ? "Đã xong" : "Hạn"} · {formatDateTime(task.dueAt)}
            </p>
          </div>
        ))}
        {!(activities ?? []).length && !(tasks ?? []).length ? <p className="text-xs text-muted">Chưa có hoạt động.</p> : null}
      </div>
    </section>
  );
}
function InvoicePanel({ invoices }: { invoices: ReturnType<typeof useFinance>["allInvoices"] }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hóa đơn cần theo dõi</h2>
        <ReceiptText className="h-4 w-4 text-muted" />
      </div>
      <div className="mt-3 overflow-hidden rounded border border-border">
        {(invoices ?? []).slice(0, 5).map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 last:border-0">
            <div>
              <p className="font-mono text-xs font-medium">{invoice.code}</p>
              <p className="mt-0.5 text-[11px] text-muted">Hạn {formatDate(invoice.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium">{formatVnd(invoice.amount - invoice.paidAmount)}</p>
            </div>
          </div>
        ))}
        {invoices.length === 0 ? <p className="p-4 text-center text-sm text-muted">Chưa có hóa đơn.</p> : null}
      </div>
    </section>
  );
}
function FinancePanel({ invoices, payments }: { invoices: ReturnType<typeof useFinance>["allInvoices"]; payments: ReturnType<typeof useFinance>["payments"] }) {
  return (
    <div className="pt-4">
      <h2 className="text-sm font-semibold">Công nợ theo hóa đơn</h2>
      <div className="mt-3 overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[660px] text-sm">
          <thead className="bg-muted-bg text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Hóa đơn</th>
              <th className="px-3 py-2 text-right">Còn lại</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{invoice.code}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums text-danger">{formatVnd(invoice.amount - invoice.paidAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-5 text-sm font-semibold">Lịch sử thanh toán</h2>
      <div className="mt-3 divide-y divide-border rounded border border-border">
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div>
              <p className="font-mono text-xs font-medium">{payment.code}</p>
              <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(payment.paidAt)}</p>
            </div>
            <span className="font-medium tabular-nums text-success">+{formatVnd(payment.amount)}</span>
          </div>
        ))}
        {payments.length === 0 ? <p className="p-4 text-center text-sm text-muted">Chưa có thanh toán.</p> : null}
      </div>
    </div>
  );
}
function DealsPanel({ rows }: { rows: ReturnType<typeof useDeals>["all"]; onStageChange?: (id: string, stage: DealStage, reason?: string) => unknown }) {
  return (
    <div className="space-y-1.5 pt-2">
      {rows.map((deal) => {
        const meta = DEAL_STAGE_META[deal.stage] || { label: deal.stage };
        const isWon = deal.stage === "won";
        const isLost = deal.stage === "lost";
        return (
          <div key={deal.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/co-hoi/${deal.id}`} className="font-semibold text-foreground hover:underline truncate">
                  {deal.title}
                </Link>
                <span className="font-mono text-[11px] text-muted shrink-0">{deal.code}</span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Xác suất: {deal.probability ?? 0}% · Hạn chốt: {formatDate(deal.expectedCloseDate)}
                {deal.closedReason ? ` · [${isWon ? "Thắng" : isLost ? "Thua" : "Kết quả"}] ${deal.closedReason}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge tone="neutral">{meta.label}</Badge>
              <span className="font-semibold tabular-nums text-foreground">{formatVnd(deal.value)}</span>
              <Link href={`/co-hoi/${deal.id}`}>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs">
                  Chi tiết
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
      {rows.length === 0 ? <p className="py-6 text-center text-xs text-muted">Chưa có cơ hội bán hàng nào.</p> : null}
    </div>
  );
}
function QuotesPanel({
  rows,
  onApprove,
  onSend,
  toast,
}: {
  rows: ReturnType<typeof useQuotes>["all"];
  onApprove: (id: string) => unknown;
  onSend: (id: string) => unknown;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Báo giá</h3>
      {rows.map((quote) => (
        <div key={quote.id} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2.5">
          <Link href={`/bao-gia/${quote.id}`} className="min-w-0 hover:underline">
            <p className="text-sm font-medium">{quote.code}</p>
          </Link>
          <div className="flex items-center gap-2">
            <Badge>{quote.status}</Badge>
            {quote.status === "draft" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void Promise.resolve(onSend(quote.id)).then(() => toast("Đã gửi báo giá", "success"));
                }}
              >
                Gửi
              </Button>
            ) : null}
            {quote.status === "sent" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void Promise.resolve(onApprove(quote.id))
                    .then(() => toast("Đã duyệt báo giá", "success"))
                    .catch((error) => toast(error instanceof Error ? error.message : "Không thể duyệt", "error"));
                }}
              >
                Duyệt
              </Button>
            ) : null}
            <span className="text-sm font-semibold">{formatVnd(quote.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocsPanel({
  customerId,
  documents,
  onCreated,
  toast,
}: {
  customerId: string;
  documents: WorkspaceExtra["documents"];
  onCreated: () => Promise<void>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="space-y-3 pt-3">
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="Tên tài liệu" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="URL / storage key" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          onClick={() => {
            void apiFetch("/api/v1/documents", {
              method: "POST",
              body: JSON.stringify({
                entityType: "customer",
                entityId: customerId,
                originalName: name,
                storageKey: url || `doc://${customerId}/${Date.now()}`,
                mimeType: "application/octet-stream",
                sizeBytes: 0,
              }),
            })
              .then(() => {
                toast("Đã thêm tài liệu", "success");
                setName("");
                setUrl("");
                return onCreated();
              })
              .catch((e) => toast(e instanceof Error ? e.message : "Lỗi", "error"));
          }}
        >
          Thêm metadata
        </Button>
      </div>
      {documents.map((d) => (
        <div key={d.id} className="rounded border border-border px-3 py-2 text-sm">
          <p className="font-medium">{d.originalName}</p>
          <p className="text-xs text-muted">{d.storageKey}</p>
        </div>
      ))}
    </div>
  );
}

function PaymentModal({
  open,
  onOpenChange,
  customerId,
  invoices,
  onSave,
  toast,
  owner,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  customerId: string;
  invoices: ReturnType<typeof useFinance>["allInvoices"];
  onSave: ReturnType<typeof useFinance>["recordPayment"];
  toast: ReturnType<typeof useToast>["toast"];
  owner: { id: string; name: string };
}) {
  const unpaid = invoices.filter((invoice) => invoice.amount > invoice.paidAmount);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const selected = unpaid.find((invoice) => invoice.id === invoiceId) ?? unpaid[0];
  const currentAmount = invoiceId ? amount : selected ? selected.amount - selected.paidAmount : 0;
  const submit = () => {
    if (!selected || currentAmount <= 0 || currentAmount > selected.amount - selected.paidAmount) {
      toast("Kiểm tra lại hóa đơn và số tiền thanh toán", "error");
      return;
    }
    void onSave({
      invoiceId: selected.id,
      customerId,
      amount: currentAmount,
      method,
      paidAt: new Date().toISOString(),
      owner,
      note: "Ghi nhận tại hồ sơ khách hàng",
    }).then(() => {
      toast("Đã ghi nhận thanh toán", "success");
      onOpenChange(false);
      setInvoiceId("");
      setAmount(0);
    });
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ghi nhận thanh toán"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={submit}>
            Xác nhận thanh toán
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <label className="space-y-1 text-xs">
          <span className="text-muted">Hóa đơn cần thu</span>
          <Select
            className="w-full"
            value={invoiceId || selected?.id || ""}
            onChange={(event) => {
              setInvoiceId(event.target.value);
              const invoice = unpaid.find((item) => item.id === event.target.value);
              setAmount(invoice ? invoice.amount - invoice.paidAmount : 0);
            }}
          >
            {unpaid.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.code} — còn {formatVnd(invoice.amount - invoice.paidAmount)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Số tiền nhận</span>
          <Input type="number" min={0} value={currentAmount} onChange={(event) => setAmount(Number(event.target.value) || 0)} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Phương thức</span>
          <Select className="w-full" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
            <option value="bank">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="other">Khác</option>
          </Select>
        </label>
      </div>
    </Modal>
  );
}

function QuickTaskModal({
  open,
  onOpenChange,
  customerId,
  owner,
  onSave,
  toast,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  customerId: string;
  owner: { id: string; name: string };
  onSave: ReturnType<typeof useTasks>["create"];
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo công việc"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!title.trim()) return toast("Nhập nội dung công việc", "error");
              void onSave({ title: title.trim(), type: "followup", status: "open", dueAt: daysFromNow(1), owner, customerId }).then(() => {
                toast("Đã tạo công việc", "success");
                setTitle("");
                onOpenChange(false);
              });
            }}
          >
            <Send className="h-3.5 w-3.5" />
            Tạo việc
          </Button>
        </>
      }
    >
      <Input autoFocus placeholder="Nội dung" value={title} onChange={(e) => setTitle(e.target.value)} />
    </Modal>
  );
}

function DealModal({
  open,
  onOpenChange,
  customerId,
  owner,
  onSave,
  toast,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  customerId: string;
  owner: { id: string; name: string };
  onSave: ReturnType<typeof useDeals>["create"];
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function createDeal() {
    if (savingRef.current) return;
    if (!title.trim()) {
      toast("Nhập tên cơ hội", "error");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        customerId,
        stage: "new",
        value: 0,
        owner,
        expectedCloseDate: daysFromNow(14),
        productIds: [],
        notes: notes.trim() || undefined,
      });
      toast("Đã tạo cơ hội", "success");
      setTitle("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo cơ hội", "error");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo cơ hội mới"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void createDeal()}
          >
            {saving ? "Đang tạo..." : "Tạo cơ hội"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input placeholder="Tên cơ hội" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Ghi chú / nội dung trao đổi" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

function QuoteModal({
  open,
  onOpenChange,
  customerId,
  owner,
  deals,
  products,
  onSave,
  toast,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  customerId: string;
  owner: { id: string; name: string };
  deals: ReturnType<typeof useDeals>["all"];
  products: ReturnType<typeof useProducts>["all"];
  onSave: ReturnType<typeof useQuotes>["create"];
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [dealId, setDealId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const product = products.find((item) => item.id === productId);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo báo giá nháp"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!product) return toast("Chọn sản phẩm", "error");
              void onSave({
                customerId,
                dealId: dealId || undefined,
                status: "draft",
                validUntil: daysFromNow(15),
                owner,
                terms: "Thanh toán theo thỏa thuận",
                lines: [{ productId: product.id, qty, unitPrice: product.unitPrice, discountPercent: 0, vatPercent: product.vatPercent }],
              }).then(() => {
                toast("Đã tạo báo giá nháp", "success");
                setProductId("");
                setDealId("");
                setQty(1);
                onOpenChange(false);
              });
            }}
          >
            Tạo báo giá
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Select className="w-full" value={dealId} onChange={(e) => setDealId(e.target.value)}>
          <option value="">Không gắn cơ hội</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} — {d.title}
            </option>
          ))}
        </Select>
        <Select className="w-full" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Chọn sản phẩm</option>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
      </div>
    </Modal>
  );
}

function ContactModal({
  open,
  onOpenChange,
  customerId,
  onCreated,
  toast,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  onCreated: () => Promise<void>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm liên hệ"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              if (!fullName.trim()) return toast("Nhập tên", "error");
              void apiFetch("/api/v1/contacts", {
                method: "POST",
                body: JSON.stringify({ customerId, fullName, phone, email, isPrimary: false }),
              })
                .then(() => {
                  toast("Đã thêm liên hệ", "success");
                  onOpenChange(false);
                  return onCreated();
                })
                .catch((e) => toast(e instanceof Error ? e.message : "Lỗi", "error"));
            }}
          >
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input placeholder="Họ tên" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input placeholder="SĐT" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
    </Modal>
  );
}

function ActivityModal({
  open,
  onOpenChange,
  customerId,
  onCreated,
  toast,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  onCreated: () => Promise<void>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("note");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ghi hoạt động"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              if (!subject.trim()) return toast("Nhập nội dung", "error");
              void apiFetch("/api/v1/activities", {
                method: "POST",
                body: JSON.stringify({ type, subject, customerId }),
              })
                .then(() => {
                  toast("Đã ghi hoạt động", "success");
                  onOpenChange(false);
                  return onCreated();
                })
                .catch((e) => toast(e instanceof Error ? e.message : "Lỗi", "error"));
            }}
          >
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Select className="w-full" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="note">Ghi chú</option>
          <option value="call">Gọi điện</option>
          <option value="email">Email</option>
          <option value="meeting">Họp</option>
        </Select>
        <Input placeholder="Tiêu đề" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
    </Modal>
  );
}
