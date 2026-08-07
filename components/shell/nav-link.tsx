"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

function PendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-current",
        pending ? "animate-pulse opacity-60" : "opacity-0",
      )}
    />
  );
}

type NavLinkProps = {
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
  showPendingHint?: boolean;
};

export function NavLink({ href, title, className, children, showPendingHint = true }: NavLinkProps) {
  return (
    <Link href={href} title={title} className={className}>
      {children}
      {showPendingHint ? <PendingHint /> : null}
    </Link>
  );
}
