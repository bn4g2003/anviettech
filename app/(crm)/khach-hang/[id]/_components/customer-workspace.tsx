"use client";

import { useEffect, useState } from "react";
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
      <div className="mx-auto max-w-[1440px] p-3 lg:p-5">
        <button type="button" onClick={() => router.push("/khach-hang")} className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" />
          Khách hàng
        </button>
        <section className="rounded-lg border border-border bg-white">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ background: customer.logoColor ?? "#334155" }}>
                {customer.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-semibold">{customer.name}</h1>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {customer.code} · {customer.type === "company" ? "Doanh nghiệp" : "Cá nhân"}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email || "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Tạo việc
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDealOpen(true)}>
                <Handshake className="h-3.5 w-3.5" />
                Tạo cơ hội
              </Button>
              <Button variant="primary" size="sm" onClick={() => setPaymentOpen(true)} disabled={debt <= 0}>
                <CircleDollarSign className="h-3.5 w-3.5" />
                Ghi thanh toán
              </Button>
            </div>
          </div>
          <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Công nợ cần thu" value={formatVnd(debt)} tone={debt > 0 ? "danger" : "default"} />
            <Metric label="Đã thanh toán" value={formatVnd(paidTotal)} />
            <Metric label="Pipeline đang mở" value={formatVnd(pipeline)} />
            <Metric label="Công việc cần xử lý" value={String(openTasks)} />
            <Metric label="Cập nhật gần nhất" value={relativeTime(customer.updatedAt)} />
          </div>
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-lg border border-border bg-white p-4">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="contacts">Liên hệ ({extra.contacts.length})</TabsTrigger>
                <TabsTrigger value="activity">Hoạt động & việc</TabsTrigger>
                <TabsTrigger value="deals">Cơ hội ({deals.length})</TabsTrigger>
                <TabsTrigger value="sales">BG / Đơn / HĐ</TabsTrigger>
                <TabsTrigger value="finance">Công nợ</TabsTrigger>
                <TabsTrigger value="docs">Tài liệu</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="grid gap-4 pt-3 lg:grid-cols-2">
                  <ActivityPanel tasks={customerTasks} activities={extra.activities} />
                  <InvoicePanel invoices={invoices} />
                </div>
              </TabsContent>
              <TabsContent value="contacts">
                <div className="flex justify-end pt-3">
                  <Button size="sm" onClick={() => setContactOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm liên hệ
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {extra.contacts.map((c) => (
                    <div key={c.id} className="rounded border border-border px-3 py-2">
                      <p className="text-sm font-medium">
                        {c.fullName} {c.isPrimary ? <Badge tone="success">Chính</Badge> : null}
                      </p>
                      <p className="text-xs text-muted">
                        {c.jobTitle || "—"} · {c.email || "—"} · {c.phone || "—"}
                      </p>
                    </div>
                  ))}
                  {!extra.contacts.length ? <p className="py-6 text-center text-sm text-muted">Chưa có liên hệ.</p> : null}
                </div>
              </TabsContent>
              <TabsContent value="activity">
                <div className="flex justify-end gap-2 pt-3">
                  <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
                    Ghi hoạt động
                  </Button>
                  <Button size="sm" onClick={() => setTaskOpen(true)}>
                    Tạo việc
                  </Button>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <ActivityPanel tasks={customerTasks} activities={extra.activities} />
                  <div>
                    <h2 className="text-sm font-semibold">Công việc</h2>
                    <div className="mt-2 space-y-2">
                      {customerTasks.map((task) => (
                        <div key={task.id} className="rounded border border-border px-3 py-2 text-sm">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted">
                            {task.status} · hạn {formatDateTime(task.dueAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="deals">
                <div className="flex justify-end pt-3">
                  <Button size="sm" onClick={() => setDealOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Tạo cơ hội
                  </Button>
                </div>
                <DealsPanel rows={deals} onStageChange={dealsApi.setStage} />
              </TabsContent>
              <TabsContent value="sales">
                <div className="space-y-4 pt-3">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setQuoteOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Tạo báo giá
                    </Button>
                  </div>
                  <QuotesPanel rows={quotes} onApprove={quotesApi.approve} onSend={quotesApi.send} toast={toast} />
                  <h3 className="text-sm font-semibold">Đơn hàng</h3>
                  {ordersApi.rows.map((o) => (
                    <div key={o.id} className="flex justify-between rounded border border-border px-3 py-2 text-sm">
                      <span className="font-mono text-xs">{o.code}</span>
                      <span>
                        {o.status} · {formatVnd(o.total)}
                      </span>
                    </div>
                  ))}
                  <h3 className="text-sm font-semibold">Hợp đồng</h3>
                  {contractsApi.rows.map((c) => (
                    <div key={c.id} className="flex justify-between rounded border border-border px-3 py-2 text-sm">
                      <span className="font-mono text-xs">{c.code}</span>
                      <span>
                        {c.status} · {formatVnd(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="finance">
                <FinancePanel invoices={invoices} payments={payments} />
              </TabsContent>
              <TabsContent value="docs">
                <DocsPanel customerId={id} documents={extra.documents} onCreated={reloadCustomer} toast={toast} />
              </TabsContent>
              <TabsContent value="audit">
                <div className="space-y-2 pt-3">
                  {extra.audits.map((a) => (
                    <div key={a.id} className="rounded border border-border px-3 py-2 text-sm">
                      <p className="font-medium">
                        {a.module}/{a.action}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                    </div>
                  ))}
                  {!extra.audits.length ? <p className="py-6 text-center text-sm text-muted">Chưa có audit.</p> : null}
                </div>
              </TabsContent>
            </Tabs>
          </section>
          <aside className="space-y-3">
            <section className="rounded-lg border border-border bg-white p-4">
              <h2 className="text-sm font-semibold">Thông tin liên hệ</h2>
              <div className="mt-3 space-y-3 text-sm">
                <Info icon={UserRound} label="Phụ trách" value={customer.owner.name} />
                <Info icon={MapPin} label="Địa chỉ" value={customer.address || "Chưa cập nhật"} />
                <Info icon={Building2} label="Nguồn" value={customer.source} />
              </div>
            </section>
          </aside>
        </div>

        <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} customerId={id} invoices={invoices} onSave={finance.recordPayment} toast={toast} owner={customer.owner} />
        <QuickTaskModal open={taskOpen} onOpenChange={setTaskOpen} customerId={id} owner={customer.owner} onSave={tasks.create} toast={toast} />
        <DealModal open={dealOpen} onOpenChange={setDealOpen} customerId={id} owner={customer.owner} products={products} onSave={dealsApi.create} toast={toast} />
        <QuoteModal open={quoteOpen} onOpenChange={setQuoteOpen} customerId={id} owner={customer.owner} deals={deals} products={products} onSave={quotesApi.create} toast={toast} />
        <ContactModal open={contactOpen} onOpenChange={setContactOpen} customerId={id} onCreated={reloadCustomer} toast={toast} />
        <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} customerId={id} onCreated={reloadCustomer} toast={toast} />
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={tone === "danger" ? "mt-1 text-base font-semibold tabular-nums text-danger" : "mt-1 text-base font-semibold tabular-nums"}>{value}</p>
    </div>
  );
}
function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5">{value}</p>
      </div>
    </div>
  );
}
function ActivityPanel({ tasks, activities }: { tasks: ReturnType<typeof useTasks>["all"]; activities: WorkspaceExtra["activities"] }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hoạt động gần đây</h2>
        <Clock3 className="h-4 w-4 text-muted" />
      </div>
      <div className="mt-3 space-y-0 border-l border-border pl-3">
        {activities.slice(0, 4).map((a) => (
          <div key={a.id} className="relative pb-3">
            <i className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-sm font-medium">{a.subject}</p>
            <p className="text-xs text-muted">
              {a.type} · {formatDateTime(a.occurredAt)}
            </p>
          </div>
        ))}
        {tasks.slice(0, 4).map((task) => (
          <div key={task.id} className="relative pb-3 last:pb-0">
            <i className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-sm font-medium">{task.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {task.status === "done" ? "Đã hoàn thành" : "Hạn"} · {formatDateTime(task.dueAt)}
            </p>
          </div>
        ))}
        {!activities.length && !tasks.length ? <p className="text-sm text-muted">Chưa có hoạt động.</p> : null}
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
        {invoices.slice(0, 5).map((invoice) => (
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
function DealsPanel({ rows, onStageChange }: { rows: ReturnType<typeof useDeals>["all"]; onStageChange: (id: string, stage: DealStage, reason?: string) => unknown }) {
  return (
    <div className="space-y-2 pt-3">
      {rows.map((deal) => (
        <div key={deal.id} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2.5">
          <Link href={`/co-hoi/${deal.id}`} className="min-w-0 hover:underline">
            <p className="truncate text-sm font-medium">{deal.title}</p>
          </Link>
          <div className="flex items-center gap-3">
            <Select
              className="h-8 w-36 text-xs"
              value={deal.stage}
              onChange={(event) => {
                const stage = event.target.value as DealStage;
                const reason = stage === "won" || stage === "lost" ? window.prompt("Nhập lý do thắng/thua") || undefined : undefined;
                if ((stage === "won" || stage === "lost") && !reason) return;
                void onStageChange(deal.id, stage, reason);
              }}
            >
              {Object.entries(DEAL_STAGE_META).map(([stage, data]) => (
                <option key={stage} value={stage}>
                  {data.label}
                </option>
              ))}
            </Select>
            <span className="shrink-0 text-sm font-semibold">{formatVnd(deal.value)}</span>
          </div>
        </div>
      ))}
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted">Chưa có cơ hội.</p> : null}
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
  products,
  onSave,
  toast,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  customerId: string;
  owner: { id: string; name: string };
  products: ReturnType<typeof useProducts>["all"];
  onSave: ReturnType<typeof useDeals>["create"];
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState(0);
  const [productId, setProductId] = useState("");
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
            onClick={() => {
              if (!title.trim()) return toast("Nhập tên cơ hội", "error");
              void onSave({
                title: title.trim(),
                customerId,
                stage: "new",
                value,
                owner,
                expectedCloseDate: daysFromNow(14),
                productIds: productId ? [productId] : [],
              }).then(() => {
                toast("Đã tạo cơ hội", "success");
                setTitle("");
                setValue(0);
                setProductId("");
                onOpenChange(false);
              });
            }}
          >
            Tạo cơ hội
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input placeholder="Tên cơ hội" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} />
        <Select className="w-full" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Sản phẩm</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
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
