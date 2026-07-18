"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  value: "quotes" | "orders";
  onChange: (v: "quotes" | "orders") => void;
};

export function BaoGiaTabs({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as "quotes" | "orders")}>
      <TabsList>
        <TabsTrigger value="quotes">Báo giá</TabsTrigger>
        <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
