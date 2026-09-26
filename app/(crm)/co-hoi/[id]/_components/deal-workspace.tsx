"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META, type Deal, type DealStage } from "@/features/deals/types";
import { parseClosedReason } from "@/features/deals/win-loss";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { canApproveQuoteByRole } from "@/features/quotes/quote-approval-policy";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { formatDate, formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { DealWinLossDialog } from "../../_components/deal-win-loss-dialog";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Send,
  User,
  XCircle,
} from "lucide-react";

const STAGE_ORDER: DealStage[] = ["new", "demo", "negotiation", "ready", "won", "lost"];
const ACTIVE_STAGES: DealStage[] = ["new", "demo", "negotiation", "ready"];

export function DealWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, canApprove, canCreate, canEdit } = useCurrentUser();

  const deals = useDeals();
  const customers = useCustomers();
  const quotes = useQuotes();
  const contracts = useContracts();
  const orders = useOrders();
  const tasks = useTasks();
  const activities = useActivities({ dealId: id });

  const deal = deals.getById(id);
  const customer = deal ? customers.getById(deal.customerId) : undefined;

  // Win/Loss dialog state
  const [winLossOpen, setWinLossOpen] = useState(false);
  const [winLossStage, setWinLossStage] = useState<"won" | "lost" | null>(null);

  // Edit deal modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    value: 0,
    expectedCloseDate: "",
    notes: "",
  });

  // Task modal
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Remarketing form state
  const [remarketing, setRemarketing] = useState({
    type: "call" as const,
    subject: "",
    content: "",
    nextFollowupAt: "",
  });

  useEffect(() => {
    if (deal) {
      setEditForm({
        title: deal.title,
        value: deal.value,
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : "",
        notes: deal.notes || "",
      });
    }
  }, [deal]);

  if (deals.loading && !deal) {
    return (
      <main className="flex h-full items-center justify-center p-6 text-sm text-muted">
        Đang tải thông tin cơ hội...
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-border bg-white p-6 text-center">
          <p className="font-medium">Không tìm thấy cơ hội bán hàng</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => router.push("/co-hoi")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Quay lại Cơ hội
          </Button>
        </div>
      </main>
    );
  }

  const relatedQuotes = quotes.all.filter((q) => q.dealId === id || (customer && q.customerId === customer.id));
  const relatedTasks = tasks.all.filter((t) => t.dealId === id || (customer && t.customerId === customer.id));
  const relatedContracts = contracts.all.filter((c) => c.dealId === id);
  const relatedContractIds = new Set(relatedContracts.map((c) => c.id));
  const relatedQuoteIds = new Set(relatedQuotes.map((q) => q.id));
  const relatedOrders = orders.all.filter(
    (o) => (o.contractId && relatedContractIds.has(o.contractId)) || (o.quoteId && relatedQuoteIds.has(o.quoteId))
  );
  const parsedReason = deal.closedReason ? parseClosedReason(deal.closedReason) : null;
  const isClosed = deal.stage === "won" || deal.stage === "lost";
  const stageMeta = DEAL_STAGE_META[deal.stage] || { label: deal.stage, probability: 0 };
  const weightedValue = Math.round((deal.value * (deal.probability ?? stageMeta.probability)) / 100);

  // Handle stage change from interactive stepper
  async function handleStageClick(targetStage: DealStage) {
    if (targetStage === deal!.stage) return;
    if (targetStage === "won" || targetStage === "lost") {
      setWinLossStage(targetStage);
      setWinLossOpen(true);
      return;
    }
    try {
      await deals.setStage(deal!.id, targetStage);
      toast(`Đã chuyển giai đoạn sang "${DEAL_STAGE_META[targetStage]?.label ?? targetStage}"`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Không thể cập nhật giai đoạn", "error");
    }
  }

  // Handle win/loss modal confirm
  async function handleWinLossConfirm(dealId: string, stage: DealStage, reason: string, actualValue?: number) {
    await deals.setStage(dealId, stage, reason);
    if (typeof actualValue === "number" && !isNaN(actualValue)) {
      await deals.update(dealId, { value: actualValue });
    }
    await deals.reload();
  }

  // Save edit deal
  async function handleSaveEdit() {
    if (!editForm.title.trim()) {
      toast("Vui lòng nhập tên cơ hội", "error");
      return;
    }
    try {
      await deals.update(deal!.id, {
        title: editForm.title.trim(),
        value: Number(editForm.value) || 0,
        expectedCloseDate: editForm.expectedCloseDate || deal!.expectedCloseDate,
        notes: editForm.notes.trim() || undefined,
      });
      toast("Đã cập nhật cơ hội", "success");
      setEditOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi lưu cơ hội", "error");
    }
  }

  // Save quick task
  async function handleSaveTask() {
    if (!taskTitle.trim()) {
      toast("Vui lòng nhập tiêu đề công việc", "error");
      return;
    }
    try {
      await tasks.create({
        title: taskTitle.trim(),
        type: "followup",
        status: "open",
        dueAt: taskDue || new Date(Date.now() + 86400000).toISOString(),
        owner: deal!.owner,
        customerId: deal!.customerId,
        dealId: deal!.id,
      });
      toast("Đã tạo công việc liên kết cơ hội", "success");
      setTaskTitle("");
      setTaskDue("");
      setTaskOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo việc", "error");
    }
  }

  // Save remarketing / activity
  async function handleSaveRemarketing() {
    if (remarketing.subject.trim().length < 2) {
      toast("Vui lòng nhập nội dung chăm sóc", "error");
      return;
    }
    try {
      await activities.create({
        type: remarketing.type,
        subject: remarketing.subject.trim(),
        content: remarketing.content.trim() || undefined,
        customerId: deal!.customerId,
        dealId: deal!.id,
        occurredAt: new Date().toISOString(),
      });
      if (remarketing.nextFollowupAt) {
        await tasks.create({
          title: `Follow-up: ${remarketing.subject.trim()}`,
          type: "followup",
          status: "open",
          dueAt: remarketing.nextFollowupAt,
          owner: deal!.owner,
          customerId: deal!.customerId,
          dealId: deal!.id,
          notes: remarketing.content.trim() || undefined,
        });
      }
      setRemarketing({ type: "call", subject: "", content: "", nextFollowupAt: "" });
      toast("Đã ghi nhận chăm sóc & lịch hẹn", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Không thể lưu chăm sóc", "error");
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-surface">
      <div className="mx-auto max-w-7xl p-3 lg:p-4 space-y-3">
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/co-hoi")}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground shrink-0"
              title="Quay lại danh sách Cơ hội"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cơ hội</span>
            </button>
            <span className="text-muted text-xs">/</span>
            <span className="font-mono text-xs text-muted shrink-0">{deal.code}</span>
            <span className="text-muted text-xs">/</span>
            <h1 className="text-sm font-semibold truncate text-foreground" title={deal.title}>
              {deal.title}
            </h1>
            <Badge tone="neutral">
              {stageMeta.label}
            </Badge>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Link href={`/bao-gia?dealId=${deal.id}`}>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Tạo báo giá
              </Button>
            </Link>

            <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
              <Calendar className="h-3.5 w-3.5" />
              Tạo việc
            </Button>

            {!isClosed && canEdit("deals", deal.owner?.id) ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWinLossStage("won");
                    setWinLossOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-muted" />
                  Chốt Thắng
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWinLossStage("lost");
                    setWinLossOpen(true);
                  }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1 text-muted" />
                  Báo Thua
                </Button>
              </>
            ) : null}

            {isClosed && canEdit("deals", deal.owner?.id) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWinLossStage(deal.stage === "won" ? "won" : "lost");
                  setWinLossOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1 text-muted" />
                Cập nhật kết quả
              </Button>
            ) : null}

            {canEdit("deals", deal.owner?.id) ? (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1 text-muted" />
                Sửa
              </Button>
            ) : null}
          </div>
        </div>

        {/* Pipeline Stage Stepper */}
        <section className="rounded-lg border border-border bg-white p-3">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border text-xs">
            <span className="font-medium text-foreground">Tiến trình cơ hội (Sales Pipeline):</span>
            <span className="text-muted text-[11px]">Nhấp vào giai đoạn để cập nhật trạng thái</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-6">
            {ACTIVE_STAGES.map((s) => {
              const meta = DEAL_STAGE_META[s];
              const isCurrent = deal.stage === s;
              const isPassed = !isClosed && STAGE_ORDER.indexOf(deal.stage) > STAGE_ORDER.indexOf(s);

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => void handleStageClick(s)}
                  className={`group relative flex flex-col items-center justify-center rounded border p-2 text-center transition-colors ${
                    isCurrent
                      ? "border-neutral-900 bg-neutral-900 text-white font-semibold shadow-2xs"
                      : isPassed
                        ? "border-neutral-300 bg-neutral-100 text-foreground hover:bg-neutral-200"
                        : "border-border bg-white text-muted hover:bg-muted-bg hover:text-foreground"
                  }`}
                >
                  <span className="text-xs truncate w-full flex items-center justify-center gap-1">
                    {isPassed ? <Check className="h-3 w-3 shrink-0 text-muted" /> : null}
                    {meta.label}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isCurrent ? "text-neutral-300" : "text-muted"
                    }`}
                  >
                    {meta.probability}%
                  </span>
                </button>
              );
            })}

            {/* Won Button */}
            <button
              type="button"
              onClick={() => void handleStageClick("won")}
              className={`flex flex-col items-center justify-center rounded border p-2 text-center transition-colors ${
                deal.stage === "won"
                  ? "border-neutral-900 bg-neutral-900 text-white font-semibold shadow-2xs"
                  : "border-border bg-white text-muted hover:bg-muted-bg hover:text-foreground"
              }`}
            >
              <span className="text-xs truncate w-full flex items-center justify-center gap-1">
                {deal.stage === "won" ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : null}
                Chốt Thắng
              </span>
              <span className={`text-[10px] mt-0.5 ${deal.stage === "won" ? "text-neutral-300" : "text-muted"}`}>
                100%
              </span>
            </button>

            {/* Lost Button */}
            <button
              type="button"
              onClick={() => void handleStageClick("lost")}
              className={`flex flex-col items-center justify-center rounded border p-2 text-center transition-colors ${
                deal.stage === "lost"
                  ? "border-neutral-900 bg-neutral-900 text-white font-semibold shadow-2xs"
                  : "border-border bg-white text-muted hover:bg-muted-bg hover:text-foreground"
              }`}
            >
              <span className="text-xs truncate w-full flex items-center justify-center gap-1">
                {deal.stage === "lost" ? <XCircle className="h-3.5 w-3.5 text-white" /> : null}
                Báo Thua
              </span>
              <span className={`text-[10px] mt-0.5 ${deal.stage === "lost" ? "text-neutral-300" : "text-muted"}`}>
                0%
              </span>
            </button>
          </div>
        </section>

        {/* Closed Won/Lost Structured Details Box */}
        {isClosed && (
          <section className="rounded-lg border border-border bg-muted-bg/40 p-3.5 text-xs text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {deal.stage === "won" ? "Kết quả: Thắng cơ hội (Won)" : "Kết quả: Thất bại (Lost)"}
                </span>
                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-800">
                  {parsedReason?.category || "Đã chốt kết quả"}
                </span>
              </div>
              <span className="text-[11px] text-muted">
                Cập nhật lúc: {formatDateTime(deal.updatedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted">Lý do chính</p>
                <p className="mt-0.5 font-medium">{parsedReason?.category || "—"}</p>
              </div>

              {deal.stage === "won" && parsedReason?.actualValue ? (
                <div>
                  <p className="text-[11px] text-muted">Giá trị chốt thực tế</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{formatVnd(parsedReason.actualValue)}</p>
                </div>
              ) : null}

              {deal.stage === "lost" && parsedReason?.competitor ? (
                <div>
                  <p className="text-[11px] text-muted">Đối thủ cạnh tranh</p>
                  <p className="mt-0.5 font-medium">{parsedReason.competitor}</p>
                </div>
              ) : null}

              <div className="sm:col-span-2 md:col-span-3">
                <p className="text-[11px] text-muted">Ghi chú & Đánh giá bài học kinh nghiệm</p>
                <p className="mt-0.5 font-normal text-muted-foreground whitespace-pre-line">
                  {parsedReason?.notes || "Chưa có ghi chú bổ sung."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Main 2-Column Split Workspace */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left Column: Business Tabs */}
          <div className="min-w-0 space-y-3">
            <section className="rounded-lg border border-border bg-white p-3.5">
              <Tabs defaultValue="activities">
                <TabsList className="h-8">
                  <TabsTrigger value="activities" className="text-xs px-2.5">
                    Chăm sóc & Nhật ký ({activities.rows.length})
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="text-xs px-2.5">
                    Báo giá ({relatedQuotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs px-2.5">
                    Công việc ({relatedTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="text-xs px-2.5">
                    Hợp đồng & Đơn ({relatedContracts.length + relatedOrders.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Activities & Remarketing */}
                <TabsContent value="activities" className="space-y-3 pt-3">
                  {/* Quick Activity Form */}
                  {canCreate("activities") ? (
                    <div className="rounded-lg border border-border bg-muted-bg/30 p-3 space-y-2 text-xs">
                      <p className="font-semibold text-foreground">Ghi nhận hoạt động trao đổi / chăm sóc:</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Select
                          className="h-8 text-xs"
                          value={remarketing.type}
                          onChange={(e) =>
                            setRemarketing((prev) => ({ ...prev, type: e.target.value as typeof prev.type }))
                          }
                        >
                          <option value="call">Gọi điện tư vấn</option>
                          <option value="meeting">Gặp mặt / Khảo sát hiện trường</option>
                          <option value="email">Gửi email trao đổi</option>
                          <option value="note">Ghi chú nội bộ</option>
                        </Select>

                        <Input
                          className="h-8 text-xs"
                          placeholder="Tiêu đề nội dung trao đổi *"
                          value={remarketing.subject}
                          onChange={(e) => setRemarketing((prev) => ({ ...prev, subject: e.target.value }))}
                        />

                        <Input
                          className="sm:col-span-2 h-8 text-xs"
                          placeholder="Chi tiết nội dung trao đổi / kết quả khảo sát..."
                          value={remarketing.content}
                          onChange={(e) => setRemarketing((prev) => ({ ...prev, content: e.target.value }))}
                        />

                        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <span>Lịch hẹn tiếp theo:</span>
                            <Input
                              type="datetime-local"
                              className="h-7 text-xs w-52"
                              value={remarketing.nextFollowupAt}
                              onChange={(e) =>
                                setRemarketing((prev) => ({ ...prev, nextFollowupAt: e.target.value }))
                              }
                            />
                          </div>
                          <Button size="sm" onClick={() => void handleSaveRemarketing()}>
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Lưu chăm sóc
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Scheduled follow-up tasks */}
                  {relatedTasks.filter((t) => t.status === "open").length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-foreground">Lịch hẹn chăm sóc tiếp theo:</p>
                      {relatedTasks
                        .filter((t) => t.status === "open")
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-2 rounded border border-border bg-white px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.title}</p>
                              <p className="text-[11px] text-muted">
                                Hạn xử lý: {formatDateTime(t.dueAt)} · Phụ trách: {t.owner?.name ?? "—"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void tasks.update(t.id, { status: "done" }).then(() => toast("Đã hoàn thành việc", "success"));
                              }}
                            >
                              Hoàn thành
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : null}

                  {/* Activity History List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Lịch sử tương tác:</p>
                    {activities.rows.map((act) => (
                      <div key={act.id} className="rounded border border-border bg-white p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{act.subject}</span>
                          <span className="text-[11px] text-muted">{formatDateTime(act.occurredAt)}</span>
                        </div>
                        {act.content ? (
                          <p className="mt-1 text-muted text-xs whitespace-pre-line">{act.content}</p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted font-mono">
                          Người ghi: {act.owner.name} · Hình thức: {act.type}
                        </p>
                      </div>
                    ))}

                    {activities.rows.length === 0 ? (
                      <p className="rounded border border-dashed border-border py-6 text-center text-xs text-muted">
                        Chưa có nhật ký hoạt động nào cho cơ hội này.
                      </p>
                    ) : null}
                  </div>
                </TabsContent>

                {/* Tab 2: Quotes */}
                <TabsContent value="quotes" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Báo giá của cơ hội ({relatedQuotes.length})</span>
                    <Link href={`/bao-gia?dealId=${deal.id}`}>
                      <Button size="sm">
                        <Plus className="h-3.5 w-3.5" />
                        Tạo báo giá
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {relatedQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-white p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <Link href={`/bao-gia/${q.id}`} className="font-medium text-foreground hover:underline">
                            {q.code}
                          </Link>
                          <p className="text-[11px] text-muted">
                            Hiệu lực: {formatDate(q.validUntil)} · Tổng: {formatVnd(q.total)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{q.status}</Badge>
                          {q.status === "draft" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void quotes.send(q.id).then(() => toast("Đã gửi báo giá", "success"));
                              }}
                            >
                              Gửi
                            </Button>
                          ) : null}
                          {q.status === "sent" && user && canApprove("quotes") && canApproveQuoteByRole(user.roles) ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                void quotes.approve(q.id).then(() => toast("Đã duyệt báo giá", "success"));
                              }}
                            >
                              Duyệt
                            </Button>
                          ) : null}
                          <Link href={`/bao-gia/${q.id}`}>
                            <Button variant="ghost" size="sm">
                              Chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}

                    {relatedQuotes.length === 0 ? (
                      <p className="rounded border border-dashed border-border py-6 text-center text-xs text-muted">
                        Chưa có báo giá nào liên kết.
                      </p>
                    ) : null}
                  </div>
                </TabsContent>

                {/* Tab 3: Tasks */}
                <TabsContent value="tasks" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Công việc cần xử lý ({relatedTasks.length})</span>
                    <Button size="sm" onClick={() => setTaskOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Tạo việc
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {relatedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded border border-border bg-white p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{t.title}</p>
                          <p className="text-[11px] text-muted">
                            Hạn: {formatDateTime(t.dueAt)} · Phụ trách: {t.owner?.name ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            className="h-7 text-xs w-28"
                            value={t.status}
                            onChange={(e) => {
                              void tasks.update(t.id, { status: e.target.value as typeof t.status });
                            }}
                          >
                            <option value="open">Đang mở</option>
                            <option value="done">Hoàn thành</option>
                            <option value="cancelled">Hủy</option>
                          </Select>
                        </div>
                      </div>
                    ))}

                    {relatedTasks.length === 0 ? (
                      <p className="rounded border border-dashed border-border py-6 text-center text-xs text-muted">
                        Chưa có công việc nào gắn với cơ hội này.
                      </p>
                    ) : null}
                  </div>
                </TabsContent>

                {/* Tab 4: Contracts & Orders */}
                <TabsContent value="contracts" className="space-y-3 pt-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">Hợp đồng liên quan:</p>
                      {relatedContracts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 rounded border border-border bg-white p-2.5 text-xs mb-1.5"
                        >
                          <div>
                            <Link href={`/hop-dong/${c.id}`} className="font-medium text-foreground hover:underline">
                              {c.code}
                            </Link>
                            <p className="text-[11px] text-muted">
                              Thời hạn: {formatDate(c.startDate)} – {formatDate(c.endDate)}
                            </p>
                          </div>
                          <span className="font-medium tabular-nums">{formatVnd(c.value)}</span>
                        </div>
                      ))}
                      {relatedContracts.length === 0 ? (
                        <p className="rounded border border-dashed border-border py-4 text-center text-xs text-muted">
                          Chưa có hợp đồng.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1.5">Đơn hàng liên quan:</p>
                      {relatedOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-2 rounded border border-border bg-white p-2.5 text-xs mb-1.5"
                        >
                          <div>
                            <span className="font-mono font-medium text-foreground">{o.code}</span>
                            <p className="text-[11px] text-muted">Trạng thái: {o.status}</p>
                          </div>
                          <span className="font-medium tabular-nums">{formatVnd(o.total)}</span>
                        </div>
                      ))}
                      {relatedOrders.length === 0 ? (
                        <p className="rounded border border-dashed border-border py-4 text-center text-xs text-muted">
                          Chưa có đơn hàng.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* Right Column: Key Details & Connected Customer Info */}
          <aside className="space-y-3">
            {/* Card 1: Key Financials & Deal Metrics */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Thông số cơ hội
              </h2>
              <div className="space-y-2 text-xs divide-y divide-border">
                <div className="pt-1">
                  <p className="text-[11px] text-muted">Giá trị dự kiến</p>
                  <p className="text-base font-bold text-foreground tabular-nums">
                    {formatVnd(deal.value)}
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-muted">Xác suất thành công</p>
                    <p className="font-semibold text-foreground">{deal.probability ?? stageMeta.probability}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Doanh thu kỳ vọng</p>
                    <p className="font-semibold text-foreground tabular-nums">{formatVnd(weightedValue)}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-muted">Dự kiến chốt</p>
                    <p className="font-medium text-foreground">{formatDate(deal.expectedCloseDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Người phụ trách</p>
                    <p className="font-medium text-foreground">{deal.owner?.name ?? "—"}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-muted">
                  <span>Cập nhật gần nhất:</span>
                  <span>{relativeTime(deal.updatedAt)}</span>
                </div>
              </div>
            </section>

            {/* Card 2: Connected Customer Profile */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Khách hàng liên kết
                </h2>
                {customer ? (
                  <Link
                    href={`/khach-hang/${customer.id}`}
                    className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-foreground hover:underline"
                  >
                    Hồ sơ 360° <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>

              {customer ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                    <p className="font-mono text-[11px] text-muted">
                      {customer.code} · {customer.type === "company" ? "Doanh nghiệp" : "Cá nhân"}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-border text-[11px]">
                    <div className="flex items-center gap-2 text-muted">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-foreground">{customer.contactName || "Chưa có đầu mối"}</span>
                    </div>

                    {customer.phone ? (
                      <div className="flex items-center gap-2 text-muted">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${customer.phone}`} className="hover:underline text-foreground">
                          {customer.phone}
                        </a>
                      </div>
                    ) : null}

                    {customer.email ? (
                      <div className="flex items-center gap-2 text-muted">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a href={`mailto:${customer.email}`} className="hover:underline text-foreground truncate">
                          {customer.email}
                        </a>
                      </div>
                    ) : null}

                    {customer.address ? (
                      <div className="flex items-start gap-2 text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="text-foreground leading-tight">{customer.address}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted">Công nợ hiện tại:</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatVnd(customers.getDebt(customer.id))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">Chưa liên kết thông tin khách hàng.</p>
              )}
            </section>

            {/* Card 3: Notes & Requirements */}
            <section className="rounded-lg border border-border bg-white p-3.5 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Nhu cầu & Ghi chú
              </h2>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {deal.notes || "Chưa có ghi chú đặc thù hoặc yêu cầu kỹ thuật."}
              </p>
            </section>
          </aside>
        </div>

        {/* Win / Loss Confirmation Dialog */}
        <DealWinLossDialog
          deal={deal}
          targetStage={winLossStage}
          open={winLossOpen}
          onOpenChange={setWinLossOpen}
          onConfirm={handleWinLossConfirm}
        />

        {/* Edit Deal Modal */}
        <Modal
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Chỉnh sửa cơ hội"
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => void handleSaveEdit()}>
                Lưu thay đổi
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Tên cơ hội *</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Giá trị dự kiến (VNĐ)</label>
              <Input
                type="number"
                min={0}
                value={editForm.value}
                onChange={(e) => setEditForm((prev) => ({ ...prev, value: Number(e.target.value) || 0 }))}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày dự kiến chốt</label>
              <Input
                type="date"
                value={editForm.expectedCloseDate}
                onChange={(e) => setEditForm((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ghi chú / Yêu cầu giải pháp</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded border border-border p-2 text-xs outline-none"
              />
            </div>
          </div>
        </Modal>

        {/* Quick Task Modal */}
        <Modal
          open={taskOpen}
          onOpenChange={setTaskOpen}
          title="Tạo việc liên quan cơ hội"
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setTaskOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => void handleSaveTask()}>
                Tạo việc
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Nội dung công việc *</label>
              <Input
                autoFocus
                placeholder="VD: Gửi lại bản vẽ báo giá camera tầng 2..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Hạn xử lý</label>
              <Input
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>
        </Modal>
      </div>
    </main>
  );
}
