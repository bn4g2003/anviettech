"use client";

import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { TASK_TYPE_LABEL, type Task, type TaskStatus } from "@/features/tasks/types";
import { formatDate } from "@/features/shared/utils/date";
import { cn } from "@/lib/cn";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const COLUMNS: { id: TaskStatus; label: string; tone: "info" | "success" | "neutral" }[] = [
  { id: "open", label: "Cần thực hiện", tone: "info" },
  { id: "done", label: "Hoàn thành", tone: "success" },
  { id: "cancelled", label: "Đã hủy", tone: "neutral" },
];

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task } });
  const { getById } = useCustomers();
  const customer = task.customerId ? getById(task.customerId) : null;
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <article ref={setNodeRef} style={style} className={cn("rounded-md border border-border bg-white p-2 shadow-sm", isDragging && "opacity-40")}>
      <div className="flex items-start gap-1">
        <button type="button" className="mt-0.5 cursor-grab text-muted hover:text-foreground active:cursor-grabbing" aria-label="Kéo công việc" {...listeners} {...attributes}><GripVertical className="h-4 w-4" /></button>
        <Link href={`/cong-viec/${task.id}`} className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-medium hover:underline">{task.title}</p><p className="mt-1 truncate text-[11px] text-muted">{customer?.name ?? TASK_TYPE_LABEL[task.type]}</p></Link>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1"><Badge tone="neutral">{TASK_TYPE_LABEL[task.type]}</Badge><span className="text-[10px] text-muted">{formatDate(task.dueAt)}</span></div>
    </article>
  );
}

function KanbanColumn({ id, label, tone, tasks }: { id: TaskStatus; label: string; tone: "info" | "success" | "neutral"; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <section ref={setNodeRef} className={cn("flex min-h-[420px] min-w-[260px] flex-1 flex-col rounded-lg border border-border bg-muted-bg/60", isOver && "border-blue-400 bg-blue-50")}>
    <header className="flex items-center justify-between border-b border-border px-3 py-2"><Badge tone={tone}>{label}</Badge><span className="text-xs tabular-nums text-muted">{tasks.length}</span></header>
    <div className="flex flex-1 flex-col gap-2 p-2">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}{tasks.length === 0 ? <p className="px-1 py-4 text-center text-xs text-muted">Kéo công việc vào đây</p> : null}</div>
  </section>;
}

export function TasksKanban() {
  const list = useListPage();
  const { rows, update } = useTasks({ query: list.query, type: list.filters.type, ownerId: list.filters.ownerId, view: list.filters.view });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const moveTask = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;
    const targetStatus = COLUMNS.some((column) => column.id === over.id) ? over.id as TaskStatus : (over.data.current?.task as Task | undefined)?.status;
    const task = active.data.current?.task as Task | undefined;
    if (task && targetStatus && task.status !== targetStatus) update(task.id, { status: targetStatus });
  };
  return <div className="min-h-0 flex-1 overflow-auto p-3"><DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(event: DragStartEvent) => setActiveTask(event.active.data.current?.task as Task)} onDragEnd={moveTask} onDragCancel={() => setActiveTask(null)}><div className="flex min-w-[840px] gap-3">{COLUMNS.map((column) => <KanbanColumn key={column.id} {...column} tasks={rows.filter((task) => task.status === column.id)} />)}</div><DragOverlay>{activeTask ? <div className="w-60 rounded-md border border-blue-300 bg-white p-2 shadow-lg"><p className="text-xs font-medium">{activeTask.title}</p></div> : null}</DragOverlay></DndContext></div>;
}
