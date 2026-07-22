"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  mockDisputes,
  statusLabelMap,
  type DisputeCase,
  type DisputeStatus,
} from "./mockDisputes";

type TabValue = "all" | DisputeStatus;

function formatCurrency(n: number): string {
  return `HK$ ${n.toLocaleString("zh-HK")}`;
}

function statusBadgeClasses(status: DisputeStatus): string {
  switch (status) {
    case "pending":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "investigating":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    case "buyer_refunded":
      return "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]/20";
    case "seller_released":
      return "bg-[rgba(212,165,116,0.12)] text-[#d4c4b7] border-white/10";
    case "frozen":
      return "bg-[#2e2925] text-[#8A8680] border-white/10";
    default:
      return "bg-[#2e2925] text-[#8A8680] border-white/10";
  }
}

function categoryBadgeClasses(category: DisputeCase["category"]): string {
  switch (category) {
    case "惡意欺詐":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "卡牌品相不符":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    case "誘導私下交易":
      return "bg-[rgba(16,185,129,0.10)] text-[#10b981] border-[#10b981]/20";
    case "物流爭議":
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
    default:
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
  }
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const counts = useMemo(() => {
    const all = mockDisputes.length;
    const pending = mockDisputes.filter((c) => c.status === "pending").length;
    const investigating = mockDisputes.filter(
      (c) => c.status === "investigating",
    ).length;
    const resolved = mockDisputes.filter((c) =>
      ["buyer_refunded", "seller_released", "frozen"].includes(c.status),
    ).length;
    return { all, pending, investigating, resolved };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockDisputes.filter((c) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "buyer_refunded" ||
              activeTab === "seller_released" ||
              activeTab === "frozen"
            ? ["buyer_refunded", "seller_released", "frozen"].includes(c.status)
            : c.status === activeTab;

      if (!q) return matchesTab;

      const searchable = [
        c.id.toLowerCase(),
        c.accused.name.toLowerCase(),
        c.accused.handle.toLowerCase(),
        c.reporter.toLowerCase(),
        c.category.toLowerCase(),
        c.description.toLowerCase(),
        c.orderId.toLowerCase(),
      ].join(" ");

      return matchesTab && searchable.includes(q);
    });
  }, [activeTab, query]);

  const handleRowClick = (id: string) => {
    router.push(`/admin/disputes/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-[24px] font-bold text-[#eae1da]">
            舉報與爭議仲裁工作台
          </h1>
          <p className="mt-0.5 font-sans text-[13px] text-[#d4c4b7]">
            全平台舉報、糾紛投訴、Stripe 支付爭議聯合仲裁管控面板
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/10 bg-[#26211C] px-4 py-2">
            <span className="block font-mono text-[18px] font-semibold text-[#ef4444]">
              {counts.pending.toString().padStart(2, "0")}
            </span>
            <span className="block font-sans text-[11px] text-[#d4c4b7]">
              待處理
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#26211C] px-4 py-2">
            <span className="block font-mono text-[18px] font-semibold text-[#d4a574]">
              {counts.investigating.toString().padStart(2, "0")}
            </span>
            <span className="block font-sans text-[11px] text-[#d4c4b7]">
              調查中
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#26211C] px-4 py-2">
            <span className="block font-mono text-[18px] font-semibold text-[#10b981]">
              {counts.resolved.toString().padStart(2, "0")}
            </span>
            <span className="block font-sans text-[11px] text-[#d4c4b7]">
              已裁決結案
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#8A8680]" />
          <Input
            type="text"
            placeholder="搜尋案件單號、被舉報人、舉報人、類別..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 border-white/10 bg-[#17130f] pl-9 text-[#eae1da] placeholder:text-[#50453b] focus-visible:border-[#d4a574]/40 focus-visible:ring-[#d4a574]/40"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full lg:w-auto"
        >
          <TabsList className="h-10 w-full border border-white/10 bg-[#26211C] p-1 lg:w-auto">
            <TabsTrigger
              value="all"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              全部 ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              待處理
            </TabsTrigger>
            <TabsTrigger
              value="investigating"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              調查中
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              已裁決
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Cases Table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#26211C] p-1 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="overflow-x-auto rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  案件單號
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  被舉報用戶
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  申訴買家/舉報人
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  舉報類別
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  詳細舉報原因
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  爭議金額
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  提交時間
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  案件狀態
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-transparent hover:bg-transparent">
                  <TableCell colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#d4c4b7]">
                      <span className="font-mono text-[28px]">⚖️</span>
                      <p className="font-sans text-[14px]">
                        目前沒有符合篩選條件的爭議案件。
                      </p>
                      <p className="font-sans text-[12px] text-[#8A8680]">
                        請嘗試清除搜尋字詞或切換其他狀態分頁。
                      </p>
                      {(query || activeTab !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery("");
                            setActiveTab("all");
                          }}
                          className="mt-2 border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10"
                        >
                          清除篩選條件
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => handleRowClick(c.id)}
                    className="cursor-pointer border-white/[0.06] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[#39342f]"
                  >
                    <TableCell>
                      <span className="font-mono text-[13px] font-medium text-[#eae1da]">
                        {c.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-sans text-[13px] text-[#eae1da]">
                          {c.accused.name}
                        </span>
                        <span className="font-sans text-[11px] text-[#8A8680]">
                          {c.accused.handle}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-sans text-[13px] text-[#eae1da]">
                        {c.reporter}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={categoryBadgeClasses(c.category)}
                      >
                        {c.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <p className="max-w-[240px] cursor-help truncate font-sans text-[13px] text-[#d4c4b7]">
                              {c.description}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-sm border border-white/10 bg-[#2e2925] text-[#eae1da]"
                          >
                            <p className="font-sans text-[12px] leading-relaxed">
                              {c.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[13px] font-semibold text-[#eae1da]">
                        {formatCurrency(c.escrowAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-sans text-[12px] text-[#8A8680]">
                        {c.submittedAt}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeClasses(c.status)}
                      >
                        {statusLabelMap[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(c.id);
                        }}
                        className="border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 active:scale-[0.98]"
                      >
                        <span className="mr-1">🔍</span>
                        查看詳情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
