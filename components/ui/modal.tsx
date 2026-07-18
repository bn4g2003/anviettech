"use client";

import { cn } from "@/lib/cn";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-white shadow-lg",
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start justify-between border-b border-border px-4 py-3">
            <div>
              <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-xs text-muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
