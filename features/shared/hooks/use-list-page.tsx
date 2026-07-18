"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ListPageState = {
  query: string;
  setQuery: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  pageSize: number;
  setPageSize: (v: number) => void;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  clearSelection: () => void;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  viewId: string | null;
  setViewId: (id: string | null) => void;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  visibleColumns: string[];
  setVisibleColumns: (ids: string[]) => void;
  sortKey: string;
  sortDir: "asc" | "desc";
  toggleSort: (key: string) => void;
  paginate: <T>(rows: T[]) => T[];
};

const ListPageContext = createContext<ListPageState | null>(null);

export function ListPageProvider({
  children,
  defaultColumns,
  defaultFilters = {},
}: {
  children: ReactNode;
  defaultColumns: string[];
  defaultFilters?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) =>
      ids.length > 0 && ids.every((id) => prev.includes(id)) ? [] : ids,
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const toggleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const paginate = useCallback(
    <T,>(rows: T[]) => {
      const start = (page - 1) * pageSize;
      return rows.slice(start, start + pageSize);
    },
    [page, pageSize],
  );

  const value = useMemo(
    () => ({
      query,
      setQuery: (v: string) => {
        setQuery(v);
        setPage(1);
      },
      page,
      setPage,
      pageSize,
      setPageSize: (v: number) => {
        setPageSize(v);
        setPage(1);
      },
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      clearSelection,
      createOpen,
      setCreateOpen,
      editId,
      setEditId,
      viewId,
      setViewId,
      deleteId,
      setDeleteId,
      filters,
      setFilter,
      visibleColumns,
      setVisibleColumns,
      sortKey,
      sortDir,
      toggleSort,
      paginate,
    }),
    [
      query,
      page,
      pageSize,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      clearSelection,
      createOpen,
      editId,
      viewId,
      deleteId,
      filters,
      setFilter,
      visibleColumns,
      sortKey,
      sortDir,
      toggleSort,
      paginate,
    ],
  );

  return <ListPageContext.Provider value={value}>{children}</ListPageContext.Provider>;
}

export function useListPage() {
  const ctx = useContext(ListPageContext);
  if (!ctx) throw new Error("useListPage must be used within ListPageProvider");
  return ctx;
}
