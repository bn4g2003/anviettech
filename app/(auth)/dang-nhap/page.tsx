"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { brandAssets, companyProfile } from "@/lib/company";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      setSaving(false);

      if (!response.ok) {
        setError(payload.error?.message ?? "Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản.");
        return;
      }

      const nextUrl = new URLSearchParams(window.location.search).get("next") || "/khach-hang";
      router.replace(nextUrl);
      router.refresh();
    } catch {
      setSaving(false);
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 p-4 py-8 antialiased selection:bg-primary selection:text-white">
      {/* Subtle decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-gradient-to-b from-blue-200/30 to-indigo-100/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-[300px] w-[400px] rounded-full bg-gradient-to-t from-sky-200/20 to-transparent blur-2xl" />
      </div>

      <div className="relative w-full max-w-[430px]">
        {/* Main Card */}
        <div className="rounded-2xl border border-border/80 bg-white/95 p-7 shadow-xl shadow-slate-200/70 backdrop-blur-md sm:p-9">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex items-center justify-center">
              <Image
                src={brandAssets.fullLogo}
                alt={companyProfile.legalName}
                width={320}
                height={140}
                priority
                unoptimized
                className="h-auto w-56 max-w-full drop-shadow-xs transition-transform duration-200 hover:scale-[1.02]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-0.5 text-[11px] font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Hệ thống Quản lý Khách hàng & Kinh doanh
            </div>

            <h1 className="mt-3 text-xl font-bold tracking-tight text-neutral-900">
              Đăng nhập AnViet CRM
            </h1>
            <p className="mt-1 text-xs text-muted">
              Sử dụng tài khoản nội bộ do quản trị viên phân quyền
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-neutral-700"
              >
                Tài khoản Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="admin@anviettech.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-10 w-full rounded-lg border border-border bg-white pl-9.5 pr-3 text-sm text-foreground transition-all outline-none placeholder:text-muted/60 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-neutral-700"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-border bg-white pl-9.5 pr-10 text-sm text-foreground transition-all outline-none placeholder:text-muted/60 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-foreground cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 animate-in fade-in-0 duration-150"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 font-medium text-sm text-white shadow-md shadow-neutral-900/15 transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Đăng nhập hệ thống</span>
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border/70 pt-4 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Kết nối bảo mật mã hóa SSL nội bộ</span>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="mt-5 text-center text-xs text-muted">
          <p className="font-semibold text-neutral-600">
            {companyProfile.legalName}
          </p>
          <p className="mt-1 text-[11px] text-muted/80">
            Hotline:{" "}
            <a
              href={`tel:${companyProfile.consultationPhone}`}
              className="font-medium text-neutral-700 hover:underline"
            >
              {companyProfile.consultationPhone}
            </a>{" "}
            • Kỹ thuật:{" "}
            <a
              href={`tel:${companyProfile.technicalSupportPhone}`}
              className="font-medium text-neutral-700 hover:underline"
            >
              {companyProfile.technicalSupportPhone}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

