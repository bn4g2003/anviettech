import type { Customer } from "@/features/customers/types";
import type { Product } from "@/features/products/types";
import type { Deal } from "@/features/deals/types";
import type { Task } from "@/features/tasks/types";
import type { Quote } from "@/features/quotes/types";
import type { Contract } from "@/features/contracts/types";
import type { Order } from "@/features/orders/types";
import type { StockLevel, StockMove } from "@/features/inventory/types";
import type { Invoice, Payment } from "@/features/finance/types";
import type { Campaign } from "@/features/marketing/types";
import type { OwnerRef } from "@/features/shared/types/ids";
import { daysFromNow } from "@/features/shared/utils/date";
import { calcLineTotal } from "@/features/shared/utils/money";

export const OWNERS: OwnerRef[] = [
  { id: "u1", name: "Michelle Alva" },
  { id: "u2", name: "James Brown" },
  { id: "u3", name: "Lan Nguyễn" },
  { id: "u4", name: "Minh Trần" },
  { id: "u5", name: "Hương Lê" },
];

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export type CrmSeedData = {
  customers: Customer[];
  products: Product[];
  deals: Deal[];
  tasks: Task[];
  quotes: Quote[];
  contracts: Contract[];
  orders: Order[];
  stockLevels: StockLevel[];
  stockMoves: StockMove[];
  invoices: Invoice[];
  payments: Payment[];
  campaigns: Campaign[];
};

export function createSeedData(): CrmSeedData {
  const campaigns: Campaign[] = [
    {
      id: "camp_1",
      code: "MK-001",
      name: "Giải pháp camera cho nhà xưởng",
      channel: "email",
      status: "running",
      budget: 50000000,
      spent: 22000000,
      leadsCount: 48,
      owner: OWNERS[0],
      startDate: daysFromNow(-40),
      endDate: daysFromNow(20),
      createdAt: ts(40),
      updatedAt: ts(1),
    },
    {
      id: "camp_2",
      code: "MK-002",
      name: "Điều hòa tiết kiệm điện cho văn phòng",
      channel: "ads",
      status: "running",
      budget: 80000000,
      spent: 45000000,
      leadsCount: 120,
      owner: OWNERS[2],
      startDate: daysFromNow(-20),
      endDate: daysFromNow(40),
      createdAt: ts(20),
      updatedAt: ts(0),
    },
    {
      id: "camp_3",
      code: "MK-003",
      name: "Hội thảo an toàn điện & giám sát từ xa",
      channel: "event",
      status: "completed",
      budget: 30000000,
      spent: 28500000,
      leadsCount: 65,
      owner: OWNERS[1],
      startDate: daysFromNow(-60),
      endDate: daysFromNow(-45),
      createdAt: ts(60),
      updatedAt: ts(45),
    },
  ];

  const companies = [
    { name: "Công ty Cơ điện Minh Phát", color: "#E05252" },
    { name: "Xưởng May Thành Công", color: "#2563EB" },
    { name: "Tòa nhà An Phú Plaza", color: "#7C3AED" },
    { name: "Siêu thị Điện máy Hoàng Gia", color: "#F97316" },
    { name: "Nhà máy Thực phẩm An Khang", color: "#16A34A" },
    { name: "Khách sạn Biển Xanh", color: "#0891B2" },
    { name: "Trường Quốc tế Việt Úc", color: "#CA8A04" },
    { name: "Kho vận Đông Nam", color: "#4F46E5" },
    { name: "Bệnh viện Hồng Đức", color: "#DC2626" },
    { name: "Chung cư Green View", color: "#059669" },
    { name: "Công ty Nội thất Đại Phúc", color: "#9333EA" },
    { name: "Nhà hàng Sông Trăng", color: "#EA580C" },
    { name: "Cụm công nghiệp Tân Bình", color: "#0F766E" },
    { name: "Văn phòng Luật Việt Tín", color: "#1D4ED8" },
    { name: "Resort Mũi Né Bay", color: "#0284C7" },
    { name: "Trung tâm Anh ngữ Á Châu", color: "#BE123C" },
    { name: "Showroom Ô tô Phú Mỹ", color: "#334155" },
    { name: "Công ty Xây dựng Gia Long", color: "#B45309" },
    { name: "Chuỗi cà phê Mộc", color: "#713F12" },
    { name: "Nhà máy Nhựa Thành Đạt", color: "#0E7490" },
  ];

  const customers: Customer[] = companies.map((c, i) => ({
    id: `cus_${i + 1}`,
    code: `KH-${String(i + 1).padStart(4, "0")}`,
    name: c.name,
    type: i % 7 === 0 ? "individual" : "company",
    phone: `09${String(10000000 + i * 137).slice(0, 8)}`,
    email: `contact${i + 1}@${c.name.toLowerCase().replace(/\s|\./g, "")}.vn`,
    address: `${100 + i} Nguyễn Huệ, Q.1, TP.HCM`,
    owner: OWNERS[i % OWNERS.length],
    source: i % 3 === 0 ? "Marketing" : i % 3 === 1 ? "Giới thiệu" : "Cold call",
    status: i % 11 === 0 ? "lead" : i % 13 === 0 ? "inactive" : "active",
    campaignId: i % 3 === 0 ? campaigns[i % campaigns.length].id : undefined,
    contactName: ["An Phạm", "Bình Lê", "Chi Trần", "Dũng Hoàng", "Em Vũ"][i % 5],
    logoColor: c.color,
    notes: "Khách hàng thiết bị điện, điện lạnh và an ninh mạng.",
    createdAt: ts(30 - (i % 20)),
    updatedAt: ts(i % 10),
  }));

  const productDefs = [
    { sku: "CAM-IPC-4MP", name: "Camera IP Hikvision 4MP", cat: "Camera mạng", price: 1850000, unit: "cái" },
    { sku: "CAM-NVR-16", name: "Đầu ghi NVR 16 kênh PoE", cat: "Camera mạng", price: 7450000, unit: "bộ" },
    { sku: "NET-SW-POE8", name: "Switch PoE 8 cổng Gigabit", cat: "Thiết bị mạng", price: 2380000, unit: "cái" },
    { sku: "NET-CAT6-LS", name: "Cáp mạng Cat6 LS-VINA", cat: "Thiết bị mạng", price: 2850000, unit: "thùng" },
    { sku: "ELC-MCB-32A", name: "Aptomat MCB Schneider 32A", cat: "Thiết bị điện", price: 285000, unit: "cái" },
    { sku: "ELC-LED-100W", name: "Đèn pha LED 100W Rạng Đông", cat: "Thiết bị điện", price: 790000, unit: "cái" },
    { sku: "ELC-CAD-25", name: "Cáp điện Cadivi CV 2.5mm", cat: "Thiết bị điện", price: 1680000, unit: "cuộn" },
    { sku: "AC-INV-18000", name: "Điều hòa Daikin Inverter 18.000 BTU", cat: "Điện lạnh", price: 18400000, unit: "bộ" },
    { sku: "AC-COP-2HP", name: "Máy nén lạnh Copeland 2HP", cat: "Điện lạnh", price: 9650000, unit: "cái" },
    { sku: "AC-PIPE-16", name: "Ống đồng Hailiang phi 16", cat: "Điện lạnh", price: 1420000, unit: "cuộn" },
    { sku: "SMT-DOOR", name: "Khóa cửa vân tay thông minh", cat: "An ninh", price: 4250000, unit: "bộ" },
    { sku: "SVC-INSTALL", name: "Thi công & cấu hình hệ thống", cat: "Dịch vụ kỹ thuật", price: 3500000, unit: "gói" },
  ];

  const products: Product[] = productDefs.map((p, i) => ({
    id: `prd_${i + 1}`,
    sku: p.sku,
    name: p.name,
    category: p.cat,
    unit: p.unit,
    unitPrice: p.price,
    vatPercent: 8,
    status: i === 11 ? "inactive" : "active",
    minStock: p.cat === "Dịch vụ kỹ thuật" ? 0 : 8 + (i % 4) * 4,
    description: `Thiết bị chính hãng, phù hợp cho công trình ${p.cat.toLowerCase()}.`,
    createdAt: ts(60),
    updatedAt: ts(5),
  }));

  const stages: Deal["stage"][] = [
    "new",
    "demo",
    "negotiation",
    "ready",
    "won",
    "lost",
    "negotiation",
    "demo",
    "ready",
    "new",
    "won",
    "negotiation",
    "demo",
    "ready",
    "new",
  ];

  const deals: Deal[] = stages.map((stage, i) => {
    const meta = (
      {
        new: 10,
        demo: 30,
        negotiation: 50,
        ready: 80,
        won: 100,
        lost: 0,
      } as const
    )[stage];
    return {
      id: `deal_${i + 1}`,
      code: `CH-${String(i + 1).padStart(4, "0")}`,
      title: `${products[i % products.length].name} · ${customers[i % customers.length].name}`,
      customerId: customers[i % customers.length].id,
      stage,
      value: (i + 1) * 25000000,
      probability: meta,
      owner: OWNERS[i % OWNERS.length],
      expectedCloseDate: daysFromNow(7 + i * 3),
      productIds: [products[i % products.length].id, products[(i + 1) % products.length].id],
      notes: "",
      createdAt: ts(20 - (i % 15)),
      updatedAt: ts(i % 7),
    };
  });

  const tasks: Task[] = Array.from({ length: 25 }, (_, i) => ({
    id: `task_${i + 1}`,
    title: [
      "Gọi xác nhận khối lượng camera",
      "Khảo sát vị trí lắp điều hòa",
      "Gửi bản vẽ hệ thống điện",
      "Kiểm tra bảo hành thiết bị",
      "Xác nhận lịch thi công",
    ][i % 5],
    type: (["call", "meeting", "email", "followup", "meeting"] as const)[i % 5],
    status: i % 5 === 0 ? "done" : i % 11 === 0 ? "cancelled" : "open",
    dueAt: daysFromNow(i % 2 === 0 ? -i % 5 : i % 10),
    owner: OWNERS[i % OWNERS.length],
    customerId: customers[i % customers.length].id,
    dealId: i % 2 === 0 ? deals[i % deals.length].id : undefined,
    createdAt: ts(10),
    updatedAt: ts(1),
  }));

  const quotes: Quote[] = Array.from({ length: 12 }, (_, i) => {
    const product = products[i % products.length];
    const qty = 1 + (i % 3);
    const lineTotal = calcLineTotal(qty, product.unitPrice, 0, product.vatPercent);
    return {
      id: `quote_${i + 1}`,
      code: `BG-${String(i + 1).padStart(4, "0")}`,
      customerId: customers[i % customers.length].id,
      dealId: deals[i % deals.length].id,
      status: (["draft", "sent", "approved", "rejected", "sent", "approved"] as const)[i % 6],
      validUntil: daysFromNow(15 + i),
      owner: OWNERS[i % OWNERS.length],
      terms: "Thanh toán 50% khi ký, 50% khi nghiệm thu",
      lines: [
        {
          id: `ql_${i}_1`,
          productId: product.id,
          productName: product.name,
          qty,
          unitPrice: product.unitPrice,
          discountPercent: i % 4 === 0 ? 5 : 0,
          vatPercent: product.vatPercent,
          lineTotal,
        },
      ],
      subtotal: qty * product.unitPrice,
      total: lineTotal,
      createdAt: ts(12),
      updatedAt: ts(2),
    };
  });

  const contracts: Contract[] = quotes
    .filter((q) => q.status === "approved")
    .map((q, i) => ({
      id: `ctr_${i + 1}`,
      code: `HD-${String(i + 1).padStart(4, "0")}`,
      customerId: q.customerId,
      quoteId: q.id,
      dealId: q.dealId,
      status: (["active", "draft", "completed"] as const)[i % 3],
      value: q.total,
      startDate: daysFromNow(-10 + i),
      endDate: daysFromNow(355 + i),
      owner: q.owner,
      terms: q.terms,
      createdAt: ts(8),
      updatedAt: ts(1),
    }));

  const orders: Order[] = Array.from({ length: 18 }, (_, i) => {
    const product = products[i % products.length];
    const accessory = products[(i + 2) % products.length];
    const qty = 2 + (i % 7);
    const accessoryQty = 1 + (i % 3);
    const lines = [
      { id: `ol_${i}_1`, productId: product.id, productName: product.name, qty, unitPrice: product.unitPrice, lineTotal: qty * product.unitPrice },
      { id: `ol_${i}_2`, productId: accessory.id, productName: accessory.name, qty: accessoryQty, unitPrice: accessory.unitPrice, lineTotal: accessoryQty * accessory.unitPrice },
    ];
    return {
      id: `ord_${i + 1}`,
      code: `DH-${String(i + 1).padStart(4, "0")}`,
      customerId: customers[i % customers.length].id,
      contractId: contracts[i % contracts.length]?.id,
      quoteId: quotes[i % quotes.length]?.id,
      status: i % 7 === 0 ? "confirmed" : "fulfilled",
      owner: OWNERS[i % OWNERS.length],
      lines,
      total: lines.reduce((sum, line) => sum + line.lineTotal, 0),
      createdAt: ts(165 - i * 9),
      updatedAt: ts(Math.max(1, 165 - i * 9)),
    };
  });

  const stockLevels: StockLevel[] = products.map((p, i) => ({
    productId: p.id,
    qty: p.category === "Dịch vụ kỹ thuật" ? 0 : 4 + ((i * 7) % 26),
  }));

  const stockMoves: StockMove[] = [
    {
      id: "sm_1",
      code: "PN-0001",
      type: "in",
      status: "posted",
      warehouseTo: "Kho chính",
      owner: OWNERS[0],
      lines: [
        {
          id: "sml_1",
          productId: products[5].id,
          productName: products[5].name,
          qty: 20,
        },
      ],
      note: "Nhập thiết bị camera và switch PoE",
      createdAt: ts(15),
      updatedAt: ts(15),
    },
    {
      id: "sm_2",
      code: "PX-0001",
      type: "out",
      status: "posted",
      orderId: orders[0]?.id,
      warehouseFrom: "Kho chính",
      owner: OWNERS[1],
      lines: [
        {
          id: "sml_2",
          productId: products[0].id,
          productName: products[0].name,
          qty: 2,
        },
      ],
      createdAt: ts(4),
      updatedAt: ts(4),
    },
  ];

  const invoices: Invoice[] = orders
    .filter((o) => o.status !== "draft")
    .map((o, i) => ({
      id: `inv_${i + 1}`,
      code: `HDON-${String(i + 1).padStart(4, "0")}`,
      customerId: o.customerId,
      orderId: o.id,
      contractId: o.contractId,
      status: (["unpaid", "partial", "paid"] as const)[i % 3],
      amount: o.total,
      paidAmount: i % 3 === 0 ? 0 : i % 3 === 1 ? Math.round(o.total * 0.4) : o.total,
      dueDate: daysFromNow(-20 + i * 5),
      owner: o.owner,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

  const payments: Payment[] = invoices
    .filter((inv) => inv.paidAmount > 0)
    .map((inv, i) => ({
      id: `pay_${i + 1}`,
      code: `TT-${String(i + 1).padStart(4, "0")}`,
      invoiceId: inv.id,
      customerId: inv.customerId,
      amount: inv.paidAmount,
      method: (["bank", "cash", "card"] as const)[i % 3],
      paidAt: daysFromNow(-i),
      owner: inv.owner,
      note: "Thanh toán đơn hàng thiết bị",
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

  return {
    customers,
    products,
    deals,
    tasks,
    quotes,
    contracts,
    orders,
    stockLevels,
    stockMoves,
    invoices,
    payments,
    campaigns,
  };
}
