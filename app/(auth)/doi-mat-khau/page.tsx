"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";

type PasswordError = {
  error?: {
    message?: string;
    fields?: Record<string, string>;
  };
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (nextPassword.length < 10) {
      setError("Mật khẩu mới cần ít nhất 10 ký tự.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/v1/auth/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as PasswordError;
        setError(
          payload.error?.fields?.nextPassword
            ?? payload.error?.fields?.currentPassword
            ?? payload.error?.message
            ?? "Không thể đổi mật khẩu",
        );
        return;
      }

      router.replace("/khach-hang");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-muted">Bạn cần đổi mật khẩu tạm thời trước khi tiếp tục.</p>

        <label className="mt-5 block text-sm">
          Mật khẩu hiện tại
          <Input
            className="mt-1 w-full"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>

        <label className="mt-3 block text-sm">
          Mật khẩu mới
          <Input
            className="mt-1 w-full"
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
          />
          <span className="mt-1 block text-xs text-muted">Ít nhất 10 ký tự.</span>
        </label>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="mt-5 w-full" disabled={saving}>
          {saving ? "Đang lưu…" : "Đổi mật khẩu"}
        </Button>
        <div className="mt-4 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/v1/auth/logout", { method: "POST" });
              } finally {
                window.location.href = "/dang-nhap";
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-danger transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất & quay lại đăng nhập</span>
          </button>
        </div>
      </form>
    </main>
  );
}
