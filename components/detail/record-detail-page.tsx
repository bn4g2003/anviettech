"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import type { Contract } from "@/features/contracts/types";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { Customer } from "@/features/customers/types";
import { useDeals } from "@/features/deals/hooks/use-deals";
import type { Deal } from "@/features/deals/types";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { canApproveQuoteByRole } from "@/features/quotes/quote-approval-policy";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import type { Quote } from "@/features/quotes/types";
import { formatDate, formatDateTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { TASK_TYPE_LABEL, type Task, type TaskStatus } from "@/features/tasks/types";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Handshake, ListTodo, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RecordKind = "customer" | "deal" | "task" | "quote" | "contract";
type DetailRecord = Omit<Customer, "type" | "status"> & Omit<Deal, "status"> & Omit<Task, "type" | "status"> & Omit<Quote, "status"> & Omit<Contract, "status"> & { type: Task["type"]; status: Customer["status"] | Deal["stage"] | Task["status"] | Quote["status"] | Contract["status"] };

const kindMeta: Record<RecordKind, { label: string; back: string; icon: typeof UserRound }> = {
  customer: { label: "Khách hàng", back: "/khach-hang", icon: UserRound }, deal: { label: "Cơ hội", back: "/co-hoi", icon: Handshake }, task: { label: "Công việc", back: "/cong-viec", icon: ListTodo }, quote: { label: "Báo giá", back: "/bao-gia", icon: FileText }, contract: { label: "Hợp đồng", back: "/hop-dong", icon: Handshake },
};

function RelatedLink({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline">{children}<ExternalLink className="h-3 w-3" /></Link>; }
function EmptyRelated({ label }: { label: string }) { return <p className="rounded border border-dashed border-border px-3 py-5 text-center text-xs text-muted">Chưa có {label} liên quan.</p>; }

export function RecordDetailPage({ kind, id }: { kind: RecordKind; id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const meta = kindMeta[kind];
  const Icon = meta.icon;
  const { user, canApprove, canCreate, canView } = useCurrentUser();
  const canLoad = (module: string) => Boolean(user && canView(module));
  const customers = useCustomers();
  const deals = useDeals({ enabled: canLoad("deals") });
  const tasks = useTasks({ enabled: canLoad("tasks") });
  const quotes = useQuotes({ enabled: canLoad("quotes") });
  const contracts = useContracts({ enabled: canLoad("contracts") });
  const orders = useOrders();
  const activities = useActivities({ dealId: kind === "deal" ? id : undefined, enabled: kind === "deal" && canLoad("activities") });
  const [remarketing, setRemarketing] = useState({ type: "call" as const, subject: "", content: "", nextFollowupAt: "" });

  const isLoading =
    kind === "customer"
      ? customers.loading
      : kind === "deal"
        ? deals.loading
        : kind === "task"
          ? tasks.loading
          : kind === "quote"
            ? quotes.loading
            : contracts.loading;

  const record = (
    kind === "customer"
      ? customers.getById(id)
      : kind === "deal"
        ? deals.getById(id)
        : kind === "task"
          ? tasks.getById(id)
          : kind === "quote"
            ? quotes.getById(id)
            : contracts.getById(id)
  ) as unknown as DetailRecord | undefined;

  if (isLoading && !record) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted">
          Đang tải dữ liệu...
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-border bg-white p-6 text-center">
          <p className="font-medium">Không tìm thấy bản ghi</p>
          <Button className="mt-3" variant="outline" onClick={() => router.push(meta.back)}>
            Quay lại {meta.label}
          </Button>
        </div>
      </main>
    );
  }

  const title =
    kind === "customer"
      ? record.name
      : kind === "deal"
        ? record.title
        : kind === "task"
          ? record.title
          : record.code;
  const customerId =
    kind === "customer"
      ? record.id
      : kind === "deal" || kind === "task" || kind === "quote" || kind === "contract"
        ? record.customerId
        : undefined;
  const customer = customerId ? customers.getById(customerId) : undefined;
  const relatedDeals = customerId ? deals.byCustomer(customerId) : [];
  const relatedTasks = customerId
    ? tasks.all.filter(
        (task) =>
          task.customerId === customerId || (kind === "deal" && task.dealId === id),
      )
    : [];
  const relatedQuotes = customerId
    ? quotes.all.filter(
        (quote) =>
          quote.customerId === customerId || (kind === "deal" && quote.dealId === id),
      )
    : [];
  const relatedContracts = customerId
    ? contracts.all.filter(
        (contract) =>
          contract.customerId === customerId ||
          (kind === "deal" && contract.dealId === id),
      )
    : [];
  const canApproveCurrentQuote =
    kind === "quote" &&
    record.status === "sent" &&
    Boolean(user && canApprove("quotes") && canApproveQuoteByRole(user.roles));

  async function saveRemarketing() {
    if (!record || kind !== "deal" || remarketing.subject.trim().length < 2) {
      toast("Nhập nội dung chăm sóc", "error");
      return;
    }
    try {
      await activities.create({
        type: remarketing.type,
        subject: remarketing.subject.trim(),
        content: remarketing.content.trim() || undefined,
        customerId: record.customerId,
        dealId: record.id,
        occurredAt: new Date().toISOString(),
      });
      if (remarketing.nextFollowupAt) {
        await tasks.create({
          title: `Follow-up: ${remarketing.subject.trim()}`,
          type: "followup",
          status: "open",
          dueAt: remarketing.nextFollowupAt,
          owner: record.owner,
          customerId: record.customerId,
          dealId: record.id,
          notes: remarketing.content.trim() || undefined,
        });
      }
      setRemarketing({ type: "call", subject: "", content: "", nextFollowupAt: "" });
      toast("Đã ghi nhận lịch sử chăm sóc", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu lịch sử chăm sóc", "error");
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-surface">
      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        <button
          type="button"
          onClick={() => router.push(meta.back)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại {meta.label}
        </button>
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {meta.label}
                </p>
                <h1 className="mt-0.5 text-xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-muted">
                  {kind === "customer"
                    ? `${record.code} · ${record.contactName ?? "Chưa có đầu mối"}`
                    : customer?.name ?? "Bản ghi nghiệp vụ"}
                </p>
              </div>
            </div>
            <Badge tone="info">
              {kind === "task"
                ? record.status
                : kind === "deal"
                  ? `${record.probability}% xác suất`
                  : kind === "quote" || kind === "contract"
                    ? record.status
                    : record.status}
            </Badge>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 md:grid-cols-4">
            {kind === "customer" ? (
              <>
                <Info label="Điện thoại" value={record.phone} />
                <Info label="Email" value={record.email} />
                <Info label="Phụ trách" value={record.owner?.name ?? "—"} />
                <Info label="Công nợ" value={formatVnd(customers.getDebt(record.id))} />
              </>
            ) : kind === "deal" ? (
              <>
                <Info label="Giá trị" value={formatVnd(record.value)} />
                <Info
                  label="Dự kiến chốt"
                  value={formatDate(record.expectedCloseDate)}
                />
                <Info label="Giai đoạn" value={record.stage} />
                <Info label="Phụ trách" value={record.owner?.name ?? "—"} />
              </>
            ) : kind === "task" ? (
              <>
                <Info label="Loại" value={TASK_TYPE_LABEL[record.type]} />
                <Info label="Hạn xử lý" value={formatDateTime(record.dueAt)} />
                <Info label="Phụ trách" value={record.owner?.name ?? "—"} />
                <label className="text-xs text-muted">
                  Trạng thái
                  <select
                    className="mt-1 block w-full rounded border border-border bg-white px-2 py-1.5 text-sm text-foreground"
                    value={record.status}
                    onChange={(event) =>
                      tasks.update(record.id, {
                        status: event.target.value as TaskStatus,
                      })
                    }
                  >
                    <option value="open">Cần thực hiện</option>
                    <option value="done">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </label>
              </>
            ) : kind === "quote" ? (
              <>
                <Info label="Tổng giá trị" value={formatVnd(record.total)} />
                <Info label="Hiệu lực đến" value={formatDate(record.validUntil)} />
                <Info label="Phụ trách" value={record.owner?.name ?? "—"} />
                <div>
                  <p className="text-xs text-muted">Thao tác</p>
                  {canApproveCurrentQuote ? (
                    <Button
                      size="sm"
                      className="mt-1"
                      onClick={() => {
                        void quotes
                          .approve(record.id)
                          .then(() =>
                            toast(
                            "Đã duyệt báo giá và tạo chứng từ liên quan",
                            "success",
                          ),
                          )
                          .catch((error) =>
                            toast(
                            error instanceof Error
                              ? error.message
                              : "Không thể duyệt báo giá",
                            "error",
                          ),
                          );
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Duyệt báo giá
                    </Button>
                  ) : (
                    <p className="mt-1 text-sm">Đã xử lý</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Info label="Giá trị" value={formatVnd(record.value)} />
                <Info
                  label="Thời hạn"
                  value={`${formatDate(record.startDate)} – ${formatDate(record.endDate)}`}
                />
                <Info label="Phụ trách" value={record.owner?.name ?? "—"} />
                <Info label="Điều khoản" value={record.terms || "—"} />
              </>
            )}
          </div>
        </section>

        {kind === "quote" && record.lines ? (
          <QuoteLines lines={record.lines} total={record.total} />
        ) : null}

        {kind === "contract" ? (
          <ContractLinks
            quoteId={record.quoteId}
            dealId={record.dealId}
            orders={orders.all.filter((order) => order.contractId === record.id)}
          />
        ) : null}

        {kind === "task" ? (
          <section className="mt-4 rounded-xl border border-border bg-white p-4">
            <h2 className="font-medium">Ghi chú</h2>
            <p className="mt-2 text-sm text-muted">
              {record.notes || "Chưa có ghi chú."}
            </p>
          </section>
        ) : (
          <Tabs
            defaultValue="deals"
            className="mt-4 rounded-xl border border-border bg-white p-4"
          >
            <TabsList>
              <TabsTrigger value="deals">Cơ hội ({relatedDeals.length})</TabsTrigger>
              <TabsTrigger value="tasks">Công việc ({relatedTasks.length})</TabsTrigger>
              <TabsTrigger value="quotes">Báo giá ({relatedQuotes.length})</TabsTrigger>
              <TabsTrigger value="contracts">HĐ ({relatedContracts.length})</TabsTrigger>
              {kind === "deal" ? <TabsTrigger value="remarketing">Chăm sóc ({activities.rows.length})</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="deals">
              <RelatedList
                rows={relatedDeals}
                href={(row) => `/co-hoi/${row.id}`}
                title={(row) => row.title}
                meta={(row) => formatVnd(row.value)}
                empty="cơ hội"
              />
            </TabsContent>
            <TabsContent value="tasks">
              <RelatedList
                rows={relatedTasks}
                href={() => "/cong-viec"}
                title={(row) => row.title}
                meta={(row) => formatDateTime(row.dueAt)}
                empty="công việc"
              />
            </TabsContent>
            <TabsContent value="quotes">
              <RelatedList
                rows={relatedQuotes}
                href={(row) => `/bao-gia/${row.id}`}
                title={(row) => row.code}
                meta={(row) => formatVnd(row.total)}
                empty="báo giá"
              />
            </TabsContent>
            <TabsContent value="contracts">
              <RelatedList
                rows={relatedContracts}
                href={(row) => `/hop-dong/${row.id}`}
                title={(row) => row.code}
                meta={(row) => formatVnd(row.value)}
                empty="hợp đồng"
              />
            </TabsContent>
            {kind === "deal" ? (
              <TabsContent value="remarketing">
                {canCreate("activities") ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-border bg-muted-bg/30 p-3 md:grid-cols-2">
                    <Select value={remarketing.type} onChange={(event) => setRemarketing((value) => ({ ...value, type: event.target.value as typeof value.type }))}>
                      <option value="call">Gọi điện</option>
                      <option value="email">Email</option>
                      <option value="meeting">Gặp mặt</option>
                      <option value="note">Ghi chú</option>
                    </Select>
                    <Input placeholder="Nội dung chăm sóc *" value={remarketing.subject} onChange={(event) => setRemarketing((value) => ({ ...value, subject: event.target.value }))} />
                    <Input className="md:col-span-2" placeholder="Chi tiết trao đổi" value={remarketing.content} onChange={(event) => setRemarketing((value) => ({ ...value, content: event.target.value }))} />
                    <Input type="datetime-local" value={remarketing.nextFollowupAt} onChange={(event) => setRemarketing((value) => ({ ...value, nextFollowupAt: event.target.value }))} />
                    <Button onClick={() => void saveRemarketing()}>Lưu chăm sóc</Button>
                  </div>
                ) : null}
                <div className="mt-3 space-y-2">
                  {activities.rows.map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                      <p className="font-medium">{activity.subject}</p>
                      {activity.content ? <p className="mt-0.5 text-muted">{activity.content}</p> : null}
                      <p className="mt-1 text-xs text-muted">{activity.owner.name} · {formatDateTime(activity.occurredAt)}</p>
                    </div>
                  ))}
                  {tasks.all.filter((task) => task.dealId === id && task.type === "followup" && task.status === "open").map((task) => (
                    <div key={task.id} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                      Hẹn chăm sóc: {task.title} · {formatDateTime(task.dueAt)}
                    </div>
                  ))}
                  {!activities.rows.length && !tasks.all.some((task) => task.dealId === id && task.type === "followup") ? <EmptyRelated label="lịch sử chăm sóc" /> : null}
                </div>
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </div>
    </main>
  );
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div>; }
function RelatedList<T extends { id: string }>({ rows, href, title, meta, empty }: { rows: T[]; href: (row: T) => string; title: (row: T) => string; meta: (row: T) => string; empty: string }) { if (!rows.length) return <EmptyRelated label={empty} />; return <div className="mt-3 divide-y divide-border rounded border border-border">{rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2"><RelatedLink href={href(row)}>{title(row)}</RelatedLink><span className="shrink-0 text-xs text-muted">{meta(row)}</span></div>)}</div>; }
function QuoteLines({ lines, total }: { lines: { id: string; productName: string; qty: number; lineTotal: number }[]; total: number }) { return <section className="mt-4 rounded-xl border border-border bg-white p-4"><h2 className="font-medium">Dòng hàng</h2><div className="mt-3 divide-y divide-border rounded border border-border">{lines.map((line) => <div key={line.id} className="flex justify-between gap-3 px-3 py-2 text-sm"><span>{line.productName} × {line.qty}</span><span className="font-medium">{formatVnd(line.lineTotal)}</span></div>)}<div className="flex justify-between px-3 py-2 text-sm font-semibold"><span>Tổng cộng</span><span>{formatVnd(total)}</span></div></div></section>; }
function ContractLinks({ quoteId, dealId, orders }: { quoteId?: string; dealId?: string; orders: { id: string; code: string; total: number }[] }) { return <section className="mt-4 rounded-xl border border-border bg-white p-4"><h2 className="font-medium">Chứng từ liên quan</h2><div className="mt-3 space-y-2 text-sm">{quoteId ? <RelatedLink href={`/bao-gia/${quoteId}`}>Báo giá gốc</RelatedLink> : null}{dealId ? <RelatedLink href={`/co-hoi/${dealId}`}>Cơ hội bán hàng</RelatedLink> : null}{orders.map((order) => <div key={order.id} className="flex justify-between rounded border border-border px-3 py-2"><span>{order.code}</span><span>{formatVnd(order.total)}</span></div>)}</div></section>; }
