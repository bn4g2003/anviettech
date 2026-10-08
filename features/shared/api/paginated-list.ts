import { apiFetch, toQuery } from "@/lib/api-client";

type QueryValue = string | number | undefined | null;

export async function fetchAllPages<T>(path: string, params: Record<string, QueryValue> = {}, pageSize = 1000) {
  const pagePath = (page: number) => `${path}${toQuery({ ...params, page, pageSize })}`;
  const firstPage = await apiFetch<T[]>(pagePath(1));
  const totalPages = Number(firstPage.meta?.totalPages ?? 1);
  const remainingPages = Number.isInteger(totalPages) && totalPages > 1
    ? await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => apiFetch<T[]>(pagePath(index + 2))),
    )
    : [];

  return [firstPage, ...remainingPages].flatMap((page) => page.data ?? []);
}
