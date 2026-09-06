"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CctvSyncModal } from "@/features/integrations/components/cctv-sync-modal";

type Step = "register" | "sync";
type SyncSourceId = "cctv" | "misa" | "excel";

type SetupError = {
  error?: { message?: string; fields?: Record<string, string> };
};

const SOURCES: Array<{
  id: SyncSourceId;
  name: string;
  detail: string;
  enabled: boolean;
}> = [
  {
    id: "cctv",
    name: "CCTV Integration Service (Port 8080)",
    detail: "Đồng bộ thông tin khách hàng, phiếu bảo trì và doanh thu hiện trường.",
    enabled: true,
  },
];

export function AdminSetupClient({
  available,
  cctvConfigured,
}: {
  available: boolean;
  cctvConfigured: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<SyncSourceId>("cctv");
  const [syncOpen, setSyncOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("anviet-admin-setup-sync") === "1") {
      setStep("sync");
    }
  }, []);

  async function submitAdmin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/v1/admin-setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const payload = (await response.json()) as SetupError;
      if (!response.ok) {
        setError(payload.error?.message ?? "Không thể tạo tài khoản quản trị.");
        setSaving(false);
        return;
      }
      setSaving(false);
      sessionStorage.setItem("anviet-admin-setup-sync", "1");
      setStep("sync");
    } catch {
      setSaving(false);
      setError("Lỗi kết nối máy chủ quản trị (HTTP 500 / Network Error).");
    }
  }

  function enterSystem() {
    sessionStorage.removeItem("anviet-admin-setup-sync");
    router.replace("/khach-hang");
    router.refresh();
  }

  function startSync() {
    if (source !== "cctv") {
      setError("Nguồn dữ liệu này hiện chưa được hỗ trợ kết nối.");
      return;
    }
    if (!cctvConfigured) {
      setError("Thiếu thông tin kết nối cơ sở dữ liệu CCTV trong tệp cấu hình.");
      return;
    }
    setError("");
    setSyncOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] py-10 font-sans text-[12px] text-[#333333]">
      <div className="mx-auto w-full max-w-[650px] px-4">
        {/* Top Product Header */}
        <div className="mb-3 flex items-center justify-between border-b-2 border-[#41719c] pb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[19px] font-bold tracking-tight text-[#1f497d]">
              Service Management System
            </span>
            <span className="text-[11px] text-[#666666]">
              | Cài đặt máy chủ cục bộ
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#888888]">
            v2.6.4 Build 812
          </span>
        </div>

        {/* Main Panel Box */}
        <div className="rounded-[3px] border border-[#a4b9c9] bg-white shadow-sm">
          {/* Glossy Header */}
          <div className="flex items-center justify-between border-b border-[#a4b9c9] bg-gradient-to-b from-[#e3edf7] to-[#ccdceb] px-4 py-2 font-bold text-[#1e4164]">
            <span>HƯỚNG DẪN THIẾT LẬP HỆ THỐNG (INITIAL SETUP WIZARD)</span>
            <span className="text-[11px] font-normal text-[#555555]">
              Bước {step === "register" ? "1/2" : "2/2"}
            </span>
          </div>

          {/* Step Progress Bar */}
          <div className="flex border-b border-[#d8d8d8] bg-[#f7f9fa] text-[11px]">
            <div
              className={`flex-1 border-r border-[#d8d8d8] px-4 py-2 ${
                step === "register"
                  ? "bg-white font-bold text-[#0066cc]"
                  : "text-[#888888]"
              }`}
            >
              1. Khởi tạo tài khoản Quản trị viên
            </div>
            <div
              className={`flex-1 px-4 py-2 ${
                step === "sync"
                  ? "bg-white font-bold text-[#0066cc]"
                  : "text-[#888888]"
              }`}
            >
              2. Kết nối nguồn dữ liệu
            </div>
          </div>

          <div className="p-5">
            {!available && step !== "sync" ? (
              <div className="border border-[#e6c2c2] bg-[#fbf4f4] p-4 text-center">
                <div className="font-bold text-[#b70000]">
                  HỆ THỐNG ĐÃ CÓ TÀI KHOẢN QUẢN TRỊ
                </div>
                <p className="mt-2 leading-relaxed text-[#555555]">
                  Hệ thống chỉ cho phép cấu hình khởi tạo một lần duy nhất. Vui lòng đăng nhập bằng tài khoản quản trị viên hiện có để truy cập bảng điều khiển.
                </p>
                <div className="mt-4">
                  <a
                    href="/dang-nhap"
                    className="inline-block rounded-[2px] border border-[#7f9db9] bg-gradient-to-b from-[#ffffff] to-[#e4e4e4] px-4 py-1.5 font-bold text-[#333333] hover:from-[#f0f0f0] hover:to-[#d0d0d0]"
                  >
                    Đến trang đăng nhập
                  </a>
                </div>
              </div>
            ) : step === "register" ? (
              <form onSubmit={submitAdmin}>
                <p className="mb-4 text-[#555555]">
                  Thiết lập tài khoản quản trị viên cấp cao nhất (Super Admin). Tài khoản này nắm toàn quyền vận hành, phân quyền người dùng và quản lý cơ sở dữ liệu.
                </p>

                {/* Classic 2-column Table Form */}
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-[#eeeeee]">
                      <td className="w-[170px] py-2.5 pr-3 text-right font-semibold text-[#444444]">
                        Họ và tên <span className="text-[#c00]">*</span>
                      </td>
                      <td className="py-2.5">
                        <input
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={web2InputClass}
                          placeholder="Ví dụ: Quản Trị Viên"
                          autoComplete="name"
                        />
                      </td>
                    </tr>

                    <tr className="border-b border-[#eeeeee]">
                      <td className="w-[170px] py-2.5 pr-3 text-right font-semibold text-[#444444]">
                        Địa chỉ Email <span className="text-[#c00]">*</span>
                      </td>
                      <td className="py-2.5">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={web2InputClass}
                          placeholder="admin@localhost.local"
                          autoComplete="email"
                        />
                        <span className="mt-1 block text-[11px] text-[#777777]">
                          Sử dụng cho thông báo hệ thống và khôi phục thông tin.
                        </span>
                      </td>
                    </tr>

                    <tr className="border-b border-[#eeeeee]">
                      <td className="w-[170px] py-2.5 pr-3 text-right font-semibold text-[#444444]">
                        Mật khẩu truy cập <span className="text-[#c00]">*</span>
                      </td>
                      <td className="py-2.5">
                        <input
                          type="password"
                          required
                          minLength={10}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={web2InputClass}
                          autoComplete="new-password"
                        />
                        <span className="mt-1 block text-[11px] text-[#777777]">
                          Tối thiểu 10 ký tự.
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="w-[170px] py-2.5 pr-3 text-right font-semibold text-[#444444]">
                        Xác nhận mật khẩu <span className="text-[#c00]">*</span>
                      </td>
                      <td className="py-2.5">
                        <input
                          type="password"
                          required
                          minLength={10}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={web2InputClass}
                          autoComplete="new-password"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                {error && <WebNotice message={error} />}

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#d8d8d8] bg-[#f9f9f9] -mx-5 -mb-5 px-5 py-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={web2PrimaryBtnClass}
                  >
                    {saving ? "Đang xử lý..." : "Tạo tài khoản & Tiếp tục >>"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="mb-4 text-[#555555]">
                  Tài khoản quản trị viên đã sẵn sàng. Bạn có thể chọn cổng kết nối để nạp dữ liệu lịch sử hoặc bỏ qua bước này.
                </p>

                <div className="border border-[#cccccc] bg-[#fcfcfc]">
                  {SOURCES.map((item, index) => {
                    const locked = !item.enabled;
                    const selected = source === item.id;
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-3 p-3 text-left ${
                          index !== SOURCES.length - 1 ? "border-b border-[#e5e5e5]" : ""
                        } ${
                          locked
                            ? "bg-[#f5f5f5] text-[#888888] cursor-not-allowed"
                            : selected
                              ? "bg-[#eaf2fa]"
                              : "hover:bg-[#f8f8f8]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sync-source"
                          className="mt-1"
                          disabled={locked}
                          checked={selected}
                          onChange={() => setSource(item.id)}
                        />
                        <div className="flex-1">
                          <div className="font-bold text-[#1f497d]">
                            {item.name}
                            {locked && (
                              <span className="ml-2 font-normal text-[11px] text-[#999999]">
                                [Module chưa được kích hoạt]
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#666666]">{item.detail}</div>
                          {item.id === "cctv" && !cctvConfigured && (
                            <div className="mt-1 text-[11px] font-semibold text-[#c00000]">
                              Cảnh báo: Không thể xác định cấu hình kết nối CCTV.
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {error && <WebNotice message={error} />}

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#d8d8d8] bg-[#f9f9f9] -mx-5 -mb-5 px-5 py-3">
                  <button
                    type="button"
                    onClick={enterSystem}
                    className={web2SecondaryBtnClass}
                  >
                    Bỏ qua bước này
                  </button>
                  <button
                    type="button"
                    onClick={startSync}
                    className={web2PrimaryBtnClass}
                  >
                    Bắt đầu kết nối
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generic Server Footer */}
        <div className="mt-3 text-center text-[11px] text-[#777777]">
          Hệ thống chạy trên nền tảng máy chủ độc lập • Quản trị dữ liệu nội bộ
        </div>
      </div>

      <CctvSyncModal
        open={syncOpen}
        onOpenChange={setSyncOpen}
        onSuccess={enterSystem}
      />
    </div>
  );
}

const web2InputClass =
  "h-7 w-full max-w-[320px] rounded-[2px] border border-[#b5b8c8] bg-white px-2 text-[12px] text-[#333333] shadow-inner outline-none transition-colors focus:border-[#4d90fe]";

const web2PrimaryBtnClass =
  "cursor-pointer rounded-[3px] border border-[#2b5e8c] bg-gradient-to-b from-[#4a8cd1] to-[#2e6ca8] px-4 py-1.5 font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:from-[#5797dc] hover:to-[#3876b5] active:from-[#2e6ca8] active:to-[#4a8cd1] disabled:opacity-60";

const web2SecondaryBtnClass =
  "cursor-pointer rounded-[3px] border border-[#adadad] bg-gradient-to-b from-[#ffffff] to-[#e6e6e6] px-4 py-1.5 font-semibold text-[#333333] shadow-[0_1px_1px_rgba(0,0,0,0.1)] hover:from-[#fafafa] hover:to-[#d8d8d8] active:from-[#d8d8d8] active:to-[#ffffff]";

function WebNotice({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-[2px] border border-[#f5c6cb] bg-[#f8d7da] px-3 py-2 text-[11px] text-[#721c24]">
      <strong>Lỗi:</strong> {message}
    </div>
  );
}