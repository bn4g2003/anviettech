"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const response = await fetch("/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) { setError(payload.error?.message ?? "Không thể đăng nhập"); return; }
    router.replace(new URLSearchParams(window.location.search).get("next") || "/khach-hang"); router.refresh();
  }
  return <main className="grid min-h-screen place-items-center bg-surface p-4"><form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm"><h1 className="text-xl font-semibold">Đăng nhập AnViet CRM</h1><p className="mt-1 text-sm text-muted">Dùng tài khoản được quản trị viên cấp.</p><label className="mt-5 block text-sm">Email<Input className="mt-1 w-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label className="mt-3 block text-sm">Mật khẩu<Input className="mt-1 w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>{error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}<Button className="mt-5 w-full" type="submit" disabled={saving}>{saving ? "Đang đăng nhập…" : "Đăng nhập"}</Button></form></main>;
}
