"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { apiFetch, announceSuccessfulMutation } from "@/lib/api-client";
import { formatVnd } from "@/features/shared/utils/money";
import type { SyncPreviewData, SyncResult } from "@/features/integrations/services/cctv-sync-service";
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  ArrowRight,
  Sparkles,
  Database,
  Building2,
  User,
} from "lucide-react";

interface CctvSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "scanning" | "preview" | "committing" | "success" | "error";

export function CctvSyncModal({ open, onOpenChange, onSuccess }: CctvSyncModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("scanning");
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState("Đang kết nối database CCTV...");
  const [previewData, setPreviewData] = useState<SyncPreviewData | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("customers");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && step === "success") {
      announceSuccessfulMutation();
      if (onSuccess) onSuccess();
    }
    onOpenChange(nextOpen);
  };

  // Bắt đầu quét khi mở Modal
  useEffect(() => {
    if (!open) {
      setStep("scanning");
      setProgress(15);
      setPreviewData(null);
      setSyncResult(null);
      setErrorMessage("");
      return;
    }

    void startScan();
  }, [open]);

  async function startScan() {
    setStep("scanning");
    setProgress(20);
    setStatusText("Đang kết nối database CCTV (chỉ đọc)...");

    const t1 = setTimeout(() => {
      setProgress(50);
      setStatusText("Đang đọc danh sách khách hàng và phiếu việc mới...");
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText("Đang đối chiếu dữ liệu với CRM để tìm khác biệt...");
    }, 900);

    try {
      const res = await apiFetch<SyncPreviewData>("/api/v1/integrations/cctv/preview", {
        method: "GET",
        skipMutationBroadcast: true,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      setProgress(100);
      setStatusText("Hoàn tất quét dữ liệu!");

      if (res?.data) {
        setPreviewData(res.data);
        setTimeout(() => {
          setStep("preview");
        }, 300);
      } else {
        throw new Error("Không nhận được dữ liệu phản hồi từ máy chủ");
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStep("error");
      setErrorMessage(err instanceof Error ? err.message : "Không thể kết nối hoặc đọc dữ liệu từ CCTV");
    }
  }

  async function handleCommit() {
    if (!previewData) return;
    setStep("committing");
    setProgress(30);
    setStatusText("Đang bắt đầu ghi dữ liệu vào CRM...");

    const t1 = setTimeout(() => {
      setProgress(65);
      setStatusText("Đang cập nhật khách hàng và lịch sử công việc...");
    }, 500);

    const t2 = setTimeout(() => {
      setProgress(90);
      setStatusText("Đang ghi nhận doanh thu và hạch toán P&L...");
    }, 1100);

    try {
      const res = await apiFetch<SyncResult>("/api/v1/integrations/cctv/sync", {
        method: "POST",
        body: JSON.stringify({ previewData }),
        skipMutationBroadcast: true,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      setProgress(100);
      setStatusText("Đồng bộ hoàn tất!");

      if (res?.data) {
        setSyncResult(res.data);
        setStep("success");
        toast("Đã đồng bộ thành công dữ liệu từ CCTV vào CRM!", "success");
      } else {
        throw new Error("Không nhận được kết quả ghi dữ liệu từ máy chủ");
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStep("error");
      setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi ghi dữ liệu vào CRM");
    }
  }

  const allCustomersCount =
    (previewData?.customers.toCreate.length || 0) + (previewData?.customers.toUpdate.length || 0);
  const totalOrdersCount = previewData?.workOrders.length || 0;
  const hasChanges = allCustomersCount > 0 || totalOrdersCount > 0;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Cửa sổ Đồng bộ Dữ liệu từ CCTV"
      description="Quét, đối chiếu và xem trước dữ liệu trước khi quyết định ghi vào CRM"
      size="4xl"
      footer={
        step === "preview" ? (
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted">
              {hasChanges
                ? "Dữ liệu chỉ được ghi vào CRM sau khi bạn nhấn nút Xác nhận."
                : "Không có dữ liệu mới để đồng bộ."}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleCommit()}
                disabled={!hasChanges}
                className="flex items-center gap-1.5"
              >
                <span>Đồng ý ghi vào CRM ({allCustomersCount} khách, {totalOrdersCount} phiếu)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : step === "success" ? (
          <Button
            variant="primary"
            onClick={() => {
              announceSuccessfulMutation();
              if (onSuccess) onSuccess();
              onOpenChange(false);
            }}
          >
            Đóng & Xem danh sách
          </Button>
        ) : step === "error" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={() => void startScan()}>
              Thử lại
            </Button>
          </div>
        ) : null
      }
    >
      {/* 1. GIAI ĐOẠN QUÉT (SCANNING) HOẶC ĐANG GHI (COMMITTING) */}
      {(step === "scanning" || step === "committing") && (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Database className="h-6 w-6 text-primary absolute" />
          </div>

          <div className="space-y-2 max-w-md w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            {/* Thanh tiến trình (Progress Bar) */}
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted italic">
              {step === "scanning"
                ? "Hệ thống đang đọc đối chiếu theo lô siêu tốc (Batch Query), hoàn toàn không làm gián đoạn hệ thống CCTV."
                : "Đang lưu vào CRM và đối soát các nhóm doanh thu P&L..."}
            </p>
          </div>
        </div>
      )}

      {/* 2. GIAI ĐOẠN XEM TRƯỚC (PREVIEW TABLE & TABS) */}
      {step === "preview" && previewData && (
        <div className="space-y-4">
          {/* Thẻ tóm tắt thông số (Summary Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-md">
              <div className="text-[10px] font-medium text-green-700">Khách hàng mới</div>
              <div className="text-lg font-bold text-green-900 mt-0.5">
                +{previewData.summary.newCustomersCount}
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md">
              <div className="text-[10px] font-medium text-amber-700">Khách cập nhật</div>
              <div className="text-lg font-bold text-amber-900 mt-0.5">
                {previewData.summary.updateCustomersCount}
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-[10px] font-medium text-blue-700">Phiếu & Hóa đơn</div>
              <div className="text-lg font-bold text-blue-900 mt-0.5">
                +{previewData.summary.newOrdersCount}
              </div>
            </div>

            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-md">
              <div className="text-[10px] font-medium text-purple-700">Tổng doanh thu</div>
              <div className="text-xs font-bold text-purple-900 mt-1 truncate" title={formatVnd(previewData.summary.totalRevenue)}>
                {formatVnd(previewData.summary.totalRevenue)}
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="text-[10px] font-medium text-emerald-700">Đã thu (TM/CK)</div>
              <div className="text-xs font-bold text-emerald-900 mt-1 truncate" title={formatVnd(previewData.summary.totalPaid)}>
                {formatVnd(previewData.summary.totalPaid)}
              </div>
            </div>

            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md">
              <div className="text-[10px] font-medium text-rose-700">Công nợ còn lại</div>
              <div className="text-xs font-bold text-rose-900 mt-1 truncate" title={formatVnd(previewData.summary.totalDebt)}>
                {formatVnd(previewData.summary.totalDebt)}
              </div>
            </div>
          </div>

          {!hasChanges ? (
            <div className="p-8 text-center border border-dashed border-border rounded-md">
              <Sparkles className="h-8 w-8 text-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Dữ liệu hiện tại đã đồng bộ mới nhất</p>
              <p className="text-xs text-muted mt-1">
                Không tìm thấy khách hàng hoặc phiếu việc mới nào từ CCTV cần chuyển sang CRM.
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-sm">
                <TabsTrigger value="customers" className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>Khách hàng ({allCustomersCount})</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-1.5 text-xs">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Đơn hàng & Tài chính ({totalOrdersCount})</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB KHÁCH HÀNG */}
              <TabsContent value="customers" className="mt-3">
                <div className="max-h-[340px] overflow-y-auto border border-border rounded-md">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-border text-[11px] text-muted font-semibold">
                      <tr>
                        <th className="py-2 px-3">Loại</th>
                        <th className="py-2 px-3">Tên Khách hàng</th>
                        <th className="py-2 px-3">Số điện thoại</th>
                        <th className="py-2 px-3">Danh bạ liên hệ</th>
                        <th className="py-2 px-3">Địa chỉ & Tọa độ</th>
                        <th className="py-2 px-3">Phân loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Khách hàng MỚI */}
                      {previewData.customers.toCreate.map((c) => (
                        <tr key={c.cctvId} className="hover:bg-green-50/40">
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">
                              Tạo mới
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">{c.name}</td>
                          <td className="py-2 px-3 text-muted">{c.phone || "—"}</td>
                          <td className="py-2 px-3 text-muted">
                            {c.contacts && c.contacts.length > 0 ? (
                              <span title={c.contacts.map((ct) => `${ct.name} (${ct.phone})`).join(", ")}>
                                {c.contacts[0].name}
                                {c.contacts.length > 1 && (
                                  <span className="ml-1 text-[10px] text-primary">+{c.contacts.length - 1} khác</span>
                                )}
                              </span>
                            ) : (
                              c.contactName || c.name
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted truncate max-w-[200px]" title={c.address}>
                            <span>{c.address || "—"}</span>
                            {c.lat && c.lng && (
                              <span className="ml-1 text-[10px] text-primary font-mono" title={`GPS: ${c.lat}, ${c.lng}`}>
                                [GPS]
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted">
                            {c.type === "company" ? (
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <Building2 className="h-3 w-3 text-muted" /> Công ty
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <User className="h-3 w-3 text-muted" /> Cá nhân
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Khách hàng CẬP NHẬT */}
                      {previewData.customers.toUpdate.map((u) => (
                        <tr key={u.id} className="hover:bg-amber-50/40">
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Cập nhật
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">{u.currentName}</td>
                          <td className="py-2 px-3 text-muted">{u.phone || "—"}</td>
                          <td className="py-2 px-3 text-muted">
                            {u.contacts && u.contacts.length > 0 ? (
                              <span>{u.contacts.length} liên hệ</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted truncate max-w-[200px]" title={u.address}>
                            {u.address || "—"}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-amber-700 italic">
                            Chỉ điền ô trống
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* TAB PHIẾU VIỆC, ĐƠN HÀNG & TÀI CHÍNH */}
              <TabsContent value="orders" className="mt-3">
                <div className="max-h-[340px] overflow-y-auto border border-border rounded-md">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-border text-[11px] text-muted font-semibold">
                      <tr>
                        <th className="py-2 px-3">Mã phiếu / Đơn</th>
                        <th className="py-2 px-3">Khách hàng</th>
                        <th className="py-2 px-3">Nhóm P&L</th>
                        <th className="py-2 px-3">Tổng tiền</th>
                        <th className="py-2 px-3">Đã thu</th>
                        <th className="py-2 px-3">Còn nợ</th>
                        <th className="py-2 px-3">Trạng thái & Hình thức</th>
                        <th className="py-2 px-3">Ngày</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.workOrders.map((wo) => {
                        const pnlLabel =
                          wo.businessType === "new_construction"
                            ? "Thi công mới"
                            : wo.businessType === "warranty"
                            ? "Bảo hành"
                            : "Sửa chữa";

                        const methodLabel =
                          wo.paymentMethod === "bank_transfer"
                            ? "Chuyển khoản"
                            : wo.paymentMethod === "cash"
                            ? "Tiền mặt"
                            : "";

                        return (
                          <tr key={wo.cctvId} className="hover:bg-neutral-50">
                            <td className="py-2 px-3 font-mono font-medium text-foreground">
                              {wo.code}
                              {wo.materials && wo.materials.length > 0 && (
                                <span className="block text-[10px] text-muted font-sans" title={wo.materials.map(m => `${m.name} (${m.quantity})`).join(", ")}>
                                  {wo.materials.length} linh kiện
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium text-foreground truncate max-w-[140px]" title={wo.customerName}>
                              {wo.customerName}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-800">
                                {pnlLabel}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {formatVnd(wo.totalAmount)}
                            </td>
                            <td className="py-2 px-3 text-emerald-700 font-medium">
                              {formatVnd(wo.paidAmount)}
                            </td>
                            <td className="py-2 px-3 text-rose-700 font-medium">
                              {wo.debtAmount > 0 ? formatVnd(wo.debtAmount) : "0 đ"}
                            </td>
                            <td className="py-2 px-3">
                              {wo.paymentStatus === "paid" ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                  Đã thu {methodLabel ? `(${methodLabel})` : ""}
                                </span>
                              ) : wo.paymentStatus === "partial" ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                  Tạm ứng
                                </span>
                              ) : wo.debtAmount > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800" title={wo.paymentNote || "Còn nợ"}>
                                  Ghi nợ
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
                                  Chưa thu
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-muted text-[11px]">{wo.occurredAt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* 3. GIAI ĐOẠN THÀNH CÔNG (SUCCESS SCREEN) */}
      {step === "success" && syncResult && (
        <div className="py-10 px-6 text-center space-y-4">
          <div className="h-14 w-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Đồng bộ dữ liệu thành công!</h3>
            <p className="text-xs text-muted">
              Đã ghi dữ liệu an toàn vào CRM trong {(syncResult.durationMs / 1000).toFixed(1)} giây.
            </p>
          </div>

          <div className="max-w-sm mx-auto p-3.5 bg-neutral-50 rounded-md border border-border text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted">Khách hàng mới tạo:</span>
              <span className="font-semibold text-green-700">+{syncResult.customersCreated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Khách hàng đã cập nhật:</span>
              <span className="font-semibold text-amber-700">{syncResult.customersUpdated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Đơn hàng đã đồng bộ:</span>
              <span className="font-semibold text-blue-700">+{syncResult.ordersSynced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Hóa đơn bán hàng / dịch vụ:</span>
              <span className="font-semibold text-purple-700">+{syncResult.invoicesSynced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Phiếu thu tiền (Tiền mặt/CK):</span>
              <span className="font-semibold text-emerald-700">+{syncResult.paymentsSynced}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. GIAI ĐOẠN LỖI (ERROR SCREEN) */}
      {step === "error" && (
        <div className="py-10 px-6 text-center space-y-4">
          <div className="h-14 w-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Không thể hoàn tất đồng bộ</h3>
            <p className="text-xs text-danger max-w-md mx-auto">{errorMessage}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
