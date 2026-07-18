"use client";

import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

type RowActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: React.ReactNode;
};

export function RowActions({ onView, onEdit, onDelete, extra }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {extra}
      {onView ? (
        <Button variant="ghost" size="icon" title="Xem" onClick={onView}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      {onEdit ? (
        <Button variant="ghost" size="icon" title="Sửa" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button variant="ghost" size="icon" title="Xóa" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-danger" />
        </Button>
      ) : null}
    </div>
  );
}
