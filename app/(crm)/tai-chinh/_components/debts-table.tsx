"use client";
 
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useFinance } from "@/features/finance/hooks/use-finance";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { Wallet, Eye, HandCoins } from "lucide-react";

type EnrichedDebtRow = {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  phone: string;
  ownerName: string;
  debt: number;
  invoiceCount: number;
};

export function DebtsTable() {
  const router = useRouter();
  const list = useListPage();
  const { debts, invoices, loading } = useFinance({
    query: list.query,
    customerId: list.filters.customerId,
  });
  const { all: customers } = useCustomers();

  const customerMap = useMemo(() => {
    const map = new Map<string, (typeof customers)[0]>();
    for (const c of customers) map.set(c.id, c);
    return map;
  }, [customers]);

  const enrichedRows: EnrichedDebtRow[] = useMemo(() => {
    return (debts as Array<{ customerId: string; customerName: string; debt: number; invoiceCount: number }>).map((d) => {
      const c = customerMap.get(d.customerId);
      return {
        id: d.customerId,
        customerId: d.customerId,
        customerName: d.customerName || c?.name || "Khách hàng",
        customerCode: c?.code || "—",
        phone: c?.phone || "—",
        ownerName: c?.owner?.name || "—",
        debt: d.debt,
        invoiceCount: d.invoiceCount,
      };
    });
  }, [debts, customerMap]);

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    const custFilter = list.filters.customerId;
    return enrichedRows.filter((d) => {
      if (custFilter && d.customerId !== custFilter) return false;
      if (!q) return true;
      return (
        d.customerName.toLowerCase().includes(q) ||
        d.customerCode.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.ownerName.toLowerCase().includes(q)
      );
    });
  }, [enrichedRows, list.query, list.filters.customerId]);

  const sorted = useMemo(() => {
    const sortKey = list.sortKey || "debt";
    const dir = list.sortKey ? (list.sortDir === "asc" ? 1 : -1) : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "debt" || sortKey === "invoiceCount") {
        return (a[sortKey] - b[sortKey]) * dir;
      }
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const handleCollectDebt = (row: EnrichedDebtRow) => {
    const targetInvoice = invoices.find(
      (inv) => inv.customerId === row.customerId && (inv.status === "unpaid" || inv.status === "partial")
    );
    if (targetInvoice) {
      list.setFilter("payInvoiceId", targetInvoice.id);
      list.setCreateOpen(true);
    } else {
      router.push(`/khach-hang/${row.customerId}?tab=finance`);
    }
  };

  const allColumns: DataGridColumn<EnrichedDebtRow>[] = [
    {
      id: "code",
      header: "Mã KH",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.customerCode}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      sortable: true,
      cell: (r) => (
        <span
          className="font-medium text-foreground hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/khach-hang/${r.customerId}`);
          }}
        >
          {r.customerName}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Số điện thoại",
      width: "w-36",
      cell: (r) => <span className="text-muted">{r.phone}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {r.ownerName.slice(0, 1)}
          </span>
          <span>{r.ownerName}</span>
        </span>
      ),
    },
    {
      id: "invoiceCount",
      header: "Số HĐ nợ",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="whitespace-nowrap">{r.invoiceCount} hóa đơn</span>,
    },
    {
      id: "debt",
      header: "Công nợ hiện tại",
      width: "w-40",
      sortable: true,
      cell: (r) => (
        <span className="font-semibold text-danger whitespace-nowrap">{formatVnd(r.debt)}</span>
      ),
    },
    {
      id: "status",
      header: "Tình trạng",
      width: "w-32",
      cell: (r) => (
        <StatusDot
          color={r.debt > 50000000 ? "red" : "orange"}
          label={r.debt > 50000000 ? "Nợ lớn" : "Chờ thu"}
        />
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-28",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Xem hồ sơ khách hàng"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/khach-hang/${r.customerId}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            title="Thu nợ khách hàng"
            onClick={(e) => {
              e.stopPropagation();
              handleCollectDebt(r);
            }}
          >
            <HandCoins className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      <DataGrid
        columns={columns}
        rows={pageRows}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        onRowClick={(r) => router.push(`/khach-hang/${r.customerId}`)}
        loading={loading}
        empty={
          <EmptyState
            icon={Wallet}
            title="Không có công nợ"
            description="Tất cả khách hàng đã thanh toán đủ hoặc không phát sinh công nợ."
          />
        }
      />
      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={sorted.length}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
    </>
  );
}
