"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { RefreshCw, Search, X, Calendar as CalendarIcon } from "lucide-react";

// ── Types Definitions ────────────────────────────────────────────────────────
interface WithdrawalRequest {
  id: string;
  userName: string;
  amount: number;
  fpsId: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
  orderId: string;
  orderNumber: string;
}

interface MerchantStripeFlow {
  stripeTransferId: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  merchantName: string;
  subAccountId: string;
  balance: number;
  totalPayout: number;
  platformCommission: number;
}

type SortDirection = "asc" | "desc";

type FpsFilter = "all" | "incomplete" | "completed" | "failed";

/** 排序下拉選單的組合值：`${欄位}-${方向}`，"none" 代表維持資料原始順序。 */
type FpsSortValue =
  | "none"
  | "userName-asc"
  | "userName-desc"
  | "submittedAt-desc"
  | "submittedAt-asc";

type StripeSortValue =
  | "none"
  | "merchantName-asc"
  | "merchantName-desc"
  | "createdAt-desc"
  | "createdAt-asc";

const FPS_SORT_OPTIONS: { value: FpsSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "userName-asc", label: "用戶名稱：A → Z" },
  { value: "userName-desc", label: "用戶名稱：Z → A" },
  { value: "submittedAt-desc", label: "提交時間：最新優先" },
  { value: "submittedAt-asc", label: "提交時間：最舊優先" },
];

const STRIPE_SORT_OPTIONS: { value: StripeSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "merchantName-asc", label: "商戶名稱：A → Z" },
  { value: "merchantName-desc", label: "商戶名稱：Z → A" },
  { value: "createdAt-desc", label: "建立日期：最新優先" },
  { value: "createdAt-asc", label: "建立日期：最舊優先" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseLocalDate = (s: string) => new Date(s.replace(/\//g, "-")).getTime();

// Deterministic UUID-lookalike so the mock data is SSR-safe.
const mockUuid = (seq: number) => {
  const suffix = String(seq).padStart(12, "0");
  return `00000000-0000-4000-8${suffix.slice(0, 3)}-${suffix.slice(3, 7)}-${suffix.slice(7, 19)}`;
};

const STATUS_LABELS: Record<WithdrawalRequest["status"], string> = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  failed: "已駁回",
};

const STATUS_BADGES = {
  pending: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  processing: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  completed: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
};

// ── Initial Mock Data ────────────────────────────────────────────────────────
// 每一筆提現申請嚴格對應唯一一筆 member_orders 訂單（1:1），以符合反洗錢追蹤要求。
// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: payout_requests, member_orders | View / RPC: list_payout_requests
const initialWithdrawals: WithdrawalRequest[] = [
  {
    id: "WD-1002",
    userName: "KojiTCG_Collector",
    amount: 48500,
    fpsId: "10283472",
    status: "pending",
    submittedAt: "2025/5/21 10:30",
    orderId: mockUuid(1),
    orderNumber: "ORD-2026-000001",
  },
  {
    id: "WD-1003",
    userName: "TokyoRare_HongKong",
    amount: 32400,
    fpsId: "94829374",
    status: "pending",
    submittedAt: "2025/5/20 15:45",
    orderId: mockUuid(2),
    orderNumber: "ORD-2026-000002",
  },
  {
    id: "WD-1004",
    userName: "OsakaPoke_Alex",
    amount: 15600,
    fpsId: "84729110",
    status: "pending",
    submittedAt: "2025/5/20 18:22",
    orderId: mockUuid(3),
    orderNumber: "ORD-2026-000003",
  },
  {
    id: "WD-1005",
    userName: "Nagoya_CardVault",
    amount: 62000,
    fpsId: "37482910",
    status: "pending",
    submittedAt: "2025/5/19 11:15",
    orderId: mockUuid(4),
    orderNumber: "ORD-2026-000004",
  },
  {
    id: "WD-1001",
    userName: "JapanTCG_Trader",
    amount: 19800,
    fpsId: "19384720",
    status: "completed",
    submittedAt: "2025/5/14 09:00",
    orderId: mockUuid(5),
    orderNumber: "ORD-2026-000005",
  },
  {
    id: "WD-1006",
    userName: "Pikachu_Specialist",
    amount: 8900,
    fpsId: "58291044",
    status: "pending",
    submittedAt: "2025/5/18 14:10",
    orderId: mockUuid(6),
    orderNumber: "ORD-2026-000006",
  },
  {
    id: "WD-1007",
    userName: "Charizard_Vault_HK",
    amount: 105000,
    fpsId: "88291023",
    status: "pending",
    submittedAt: "2025/5/17 20:05",
    orderId: mockUuid(7),
    orderNumber: "ORD-2026-000007",
  },
  {
    id: "WD-1008",
    userName: "MewtwoMaster_99",
    amount: 27500,
    fpsId: "77281920",
    status: "processing",
    submittedAt: "2025/5/17 11:20",
    orderId: mockUuid(8),
    orderNumber: "ORD-2026-000008",
  },
  {
    id: "WD-1009",
    userName: "Gengar_Store_JP",
    amount: 41000,
    fpsId: "66291033",
    status: "completed",
    submittedAt: "2025/5/16 16:40",
    orderId: mockUuid(9),
    orderNumber: "ORD-2026-000009",
  },
  {
    id: "WD-1010",
    userName: "KyotoCards_Official",
    amount: 13500,
    fpsId: "55210944",
    status: "failed",
    submittedAt: "2025/5/16 09:15",
    orderId: mockUuid(10),
    orderNumber: "ORD-2026-000010",
  },
  {
    id: "WD-1011",
    userName: "Fukuoka_PokeHub",
    amount: 89000,
    fpsId: "44102933",
    status: "pending",
    submittedAt: "2025/5/15 22:10",
    orderId: mockUuid(11),
    orderNumber: "ORD-2026-000011",
  },
  {
    id: "WD-1012",
    userName: "Rayquaza_Vault",
    amount: 53000,
    fpsId: "33019288",
    status: "completed",
    submittedAt: "2025/5/15 14:30",
    orderId: mockUuid(12),
    orderNumber: "ORD-2026-000012",
  },
  {
    id: "WD-1013",
    userName: "Eevee_Kingdom_HK",
    amount: 19500,
    fpsId: "22019388",
    status: "pending",
    submittedAt: "2025/5/14 18:00",
    orderId: mockUuid(13),
    orderNumber: "ORD-2026-000013",
  },
  {
    id: "WD-1014",
    userName: "Snorlax_Bed_TCG",
    amount: 31000,
    fpsId: "11029384",
    status: "completed",
    submittedAt: "2025/5/13 12:45",
    orderId: mockUuid(14),
    orderNumber: "ORD-2026-000014",
  },
  {
    id: "WD-1015",
    userName: "Lugias_Lair_2025",
    amount: 78000,
    fpsId: "99018273",
    status: "pending",
    submittedAt: "2025/5/13 08:30",
    orderId: mockUuid(15),
    orderNumber: "ORD-2026-000015",
  },
  {
    id: "WD-1016",
    userName: "Umbreon_Moon_HK",
    amount: 22000,
    fpsId: "88019283",
    status: "processing",
    submittedAt: "2025/5/12 21:10",
    orderId: mockUuid(16),
    orderNumber: "ORD-2026-000016",
  },
  {
    id: "WD-1017",
    userName: "Dragonite_Fly_JP",
    amount: 46000,
    fpsId: "77019284",
    status: "completed",
    submittedAt: "2025/5/12 15:50",
    orderId: mockUuid(17),
    orderNumber: "ORD-2026-000017",
  },
  {
    id: "WD-1018",
    userName: "Shinobi_TCG_Shop",
    amount: 11500,
    fpsId: "66019285",
    status: "failed",
    submittedAt: "2025/5/11 10:20",
    orderId: mockUuid(18),
    orderNumber: "ORD-2026-000018",
  },
  {
    id: "WD-1019",
    userName: "Kanto_Classics_HK",
    amount: 92000,
    fpsId: "55019286",
    status: "pending",
    submittedAt: "2025/5/10 19:40",
    orderId: mockUuid(19),
    orderNumber: "ORD-2026-000019",
  },
  {
    id: "WD-1020",
    userName: "Johto_Gold_TCG",
    amount: 35000,
    fpsId: "44019287",
    status: "completed",
    submittedAt: "2025/5/10 11:15",
    orderId: mockUuid(20),
    orderNumber: "ORD-2026-000020",
  },
];

// 同一商戶的多筆 Stripe 交易會重複顯示商戶層級餘額與分成，此為預期設計，方便按訂單維度逐筆對賬。
// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: merchant_ledgers, merchant_orders, profiles | View / RPC: list_merchant_stripe_flows
// Note: merchant_ledgers.stripe_transfer_id and merchant_ledgers.order_id already exist in the real schema.

// TODO: [Stripe Wiring] Replace mock data with real Stripe API call
// Target API: stripe.balance.retrieve | Fallback: mock
const stripePlatformBalance = {
  available: 1284650,
  pending: 236800,
  todayIn: 87450,
  lastSyncedAt: "2026-07-26 09:42",
};

// TODO: [Stripe Wiring] Replace mock data with real Stripe API call
// Target API: stripe.payouts.list({ limit, starting_after }) | Fallback: mock
const STRIPE_LOG_PAYOUT_COUNT = 38;

// TODO: [Stripe Wiring] Replace mock data with real Stripe API call
// Target API: stripe.transfers.list({ limit, starting_after }) | Fallback: mock
const STRIPE_LOG_TRANSFER_COUNT = 38;

const initialMerchantFlows: MerchantStripeFlow[] = [
  {
    stripeTransferId: "tr_3Nf82HKojiTCa1Bz",
    orderId: mockUuid(21),
    orderNumber: "ORD-2026-100101",
    createdAt: "2025/5/21 09:00",
    merchantName: "HarutoCards Premium",
    subAccountId: "acct_1NfG82H",
    balance: 142000,
    totalPayout: 1280000,
    platformCommission: 64000,
  },
  {
    stripeTransferId: "tr_3Nf82HKojiTCa2By",
    orderId: mockUuid(22),
    orderNumber: "ORD-2026-100102",
    createdAt: "2025/5/20 14:30",
    merchantName: "HarutoCards Premium",
    subAccountId: "acct_1NfG82H",
    balance: 142000,
    totalPayout: 1280000,
    platformCommission: 64000,
  },
  {
    stripeTransferId: "tr_3Nf82HKojiTCa3Bx",
    orderId: mockUuid(23),
    orderNumber: "ORD-2026-100103",
    createdAt: "2025/5/18 11:15",
    merchantName: "HarutoCards Premium",
    subAccountId: "acct_1NfG82H",
    balance: 142000,
    totalPayout: 1280000,
    platformCommission: 64000,
  },
  {
    stripeTransferId: "tr_1MeF83JLpqrTCa1Bz",
    orderId: mockUuid(24),
    orderNumber: "ORD-2026-100201",
    createdAt: "2025/5/21 10:45",
    merchantName: "AikoRare Collection",
    subAccountId: "acct_1MeF83J",
    balance: 89000,
    totalPayout: 840000,
    platformCommission: 42000,
  },
  {
    stripeTransferId: "tr_1MeF83JLpqrTCa2By",
    orderId: mockUuid(25),
    orderNumber: "ORD-2026-100202",
    createdAt: "2025/5/19 16:20",
    merchantName: "AikoRare Collection",
    subAccountId: "acct_1MeF83J",
    balance: 89000,
    totalPayout: 840000,
    platformCommission: 42000,
  },
  {
    stripeTransferId: "tr_1KyT92KMrstTCa1Bz",
    orderId: mockUuid(26),
    orderNumber: "ORD-2026-100301",
    createdAt: "2025/5/20 13:10",
    merchantName: "Daichi Rare Cards",
    subAccountId: "acct_1KyT92K",
    balance: 215000,
    totalPayout: 1950000,
    platformCommission: 97500,
  },
  {
    stripeTransferId: "tr_1KyT92KMrstTCa2By",
    orderId: mockUuid(27),
    orderNumber: "ORD-2026-100302",
    createdAt: "2025/5/17 09:50",
    merchantName: "Daichi Rare Cards",
    subAccountId: "acct_1KyT92K",
    balance: 215000,
    totalPayout: 1950000,
    platformCommission: 97500,
  },
  {
    stripeTransferId: "tr_1KyT92KMrstTCa3Bx",
    orderId: mockUuid(28),
    orderNumber: "ORD-2026-100303",
    createdAt: "2025/5/15 20:05",
    merchantName: "Daichi Rare Cards",
    subAccountId: "acct_1KyT92K",
    balance: 215000,
    totalPayout: 1950000,
    platformCommission: 97500,
  },
  {
    stripeTransferId: "tr_1PzX44LNtuvTCa1Bz",
    orderId: mockUuid(29),
    orderNumber: "ORD-2026-100401",
    createdAt: "2025/5/18 15:30",
    merchantName: "KuroGamer TCG",
    subAccountId: "acct_1PzX44L",
    balance: 12000,
    totalPayout: 310000,
    platformCommission: 15500,
  },
  {
    stripeTransferId: "tr_1PzX44LNtuvTCa2By",
    orderId: mockUuid(30),
    orderNumber: "ORD-2026-100402",
    createdAt: "2025/5/14 08:40",
    merchantName: "KuroGamer TCG",
    subAccountId: "acct_1PzX44L",
    balance: 12000,
    totalPayout: 310000,
    platformCommission: 15500,
  },
  {
    stripeTransferId: "tr_1QmA99MOwxyTCa1Bz",
    orderId: mockUuid(31),
    orderNumber: "ORD-2026-100501",
    createdAt: "2025/5/21 08:20",
    merchantName: "TokyoRare_HongKong",
    subAccountId: "acct_1QmA99M",
    balance: 67000,
    totalPayout: 540000,
    platformCommission: 27000,
  },
  {
    stripeTransferId: "tr_1QmA99MOwxyTCa2By",
    orderId: mockUuid(32),
    orderNumber: "ORD-2026-100502",
    createdAt: "2025/5/16 19:00",
    merchantName: "TokyoRare_HongKong",
    subAccountId: "acct_1QmA99M",
    balance: 67000,
    totalPayout: 540000,
    platformCommission: 27000,
  },
  {
    stripeTransferId: "tr_1RnB88NPzabTCa1Bz",
    orderId: mockUuid(33),
    orderNumber: "ORD-2026-100601",
    createdAt: "2025/5/19 12:25",
    merchantName: "Kyoto Vault TCG",
    subAccountId: "acct_1RnB88N",
    balance: 112000,
    totalPayout: 920000,
    platformCommission: 46000,
  },
  {
    stripeTransferId: "tr_1RnB88NPzabTCa2By",
    orderId: mockUuid(34),
    orderNumber: "ORD-2026-100602",
    createdAt: "2025/5/13 17:45",
    merchantName: "Kyoto Vault TCG",
    subAccountId: "acct_1RnB88N",
    balance: 112000,
    totalPayout: 920000,
    platformCommission: 46000,
  },
  {
    stripeTransferId: "tr_1RnB88NPzabTCa3Bx",
    orderId: mockUuid(35),
    orderNumber: "ORD-2026-100603",
    createdAt: "2025/5/11 10:10",
    merchantName: "Kyoto Vault TCG",
    subAccountId: "acct_1RnB88N",
    balance: 112000,
    totalPayout: 920000,
    platformCommission: 46000,
  },
  {
    stripeTransferId: "tr_1SoC77OQcdeTCa1Bz",
    orderId: mockUuid(36),
    orderNumber: "ORD-2026-100701",
    createdAt: "2025/5/20 16:55",
    merchantName: "Osaka PokeCenter HK",
    subAccountId: "acct_1SoC77O",
    balance: 45000,
    totalPayout: 410000,
    platformCommission: 20500,
  },
  {
    stripeTransferId: "tr_1SoC77OQcdeTCa2By",
    orderId: mockUuid(37),
    orderNumber: "ORD-2026-100702",
    createdAt: "2025/5/15 22:30",
    merchantName: "Osaka PokeCenter HK",
    subAccountId: "acct_1SoC77O",
    balance: 45000,
    totalPayout: 410000,
    platformCommission: 20500,
  },
  {
    stripeTransferId: "tr_1TpD66PRefgTCa1Bz",
    orderId: mockUuid(38),
    orderNumber: "ORD-2026-100801",
    createdAt: "2025/5/21 07:15",
    merchantName: "Fukuoka Card Kingdom",
    subAccountId: "acct_1TpD66P",
    balance: 88000,
    totalPayout: 760000,
    platformCommission: 38000,
  },
  {
    stripeTransferId: "tr_1TpD66PRefgTCa2By",
    orderId: mockUuid(39),
    orderNumber: "ORD-2026-100802",
    createdAt: "2025/5/17 14:00",
    merchantName: "Fukuoka Card Kingdom",
    subAccountId: "acct_1TpD66P",
    balance: 88000,
    totalPayout: 760000,
    platformCommission: 38000,
  },
  {
    stripeTransferId: "tr_1TpD66PRefgTCa3Bx",
    orderId: mockUuid(40),
    orderNumber: "ORD-2026-100803",
    createdAt: "2025/5/12 09:35",
    merchantName: "Fukuoka Card Kingdom",
    subAccountId: "acct_1TpD66P",
    balance: 88000,
    totalPayout: 760000,
    platformCommission: 38000,
  },
];

// ── Reusable In-File Components ──────────────────────────────────────────────
/** 排序下拉選單（擺於搜尋列下方，取代舊有的表頭點擊排序）。 */
function SortSelect<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-sans text-[11px] text-text-secondary whitespace-nowrap">
        排序
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as V)}>
        <SelectTrigger
          aria-label="排序方式"
          className="w-44 min-w-44 min-h-[44px] h-11 bg-[#26211C] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40"
        >
          <SelectValue placeholder="預設排序">
            {options.find((opt) => opt.value === value)?.label ?? "預設排序"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-[44px] focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type StripeLogStatus = "paid" | "pending" | "in_transit" | "failed";

type StripeLogVariant = "payout" | "transfer";

interface StripePayoutLog {
  id: string;
  recipient: string;
  amount: number;
  status: StripeLogStatus;
  createdAt: string;
}

interface StripeTransferLog {
  id: string;
  merchantName: string;
  splitAmount: number;
  platformCommission: number;
  status: StripeLogStatus;
  createdAt: string;
}

type StripeLogRow = StripePayoutLog | StripeTransferLog;

const STRIPE_LOG_PAGE_SIZE = 15;

const STRIPE_LOG_STATUS_LABELS: Record<StripeLogStatus, string> = {
  paid: "已到賬",
  pending: "處理中",
  in_transit: "轉賬中",
  failed: "失敗",
};

const STRIPE_LOG_STATUS_CLASSES: Record<StripeLogStatus, string> = {
  paid: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  pending: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  in_transit: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
};

const PAYOUT_RECIPIENTS = [
  "KojiTCG_Collector",
  "TokyoRare_HongKong",
  "OsakaPoke_Alex",
  "Nagoya_CardVault",
  "JapanTCG_Trader",
  "Pikachu_Specialist",
  "Charizard_Vault_HK",
  "MewtwoMaster_99",
  "Gengar_Store_JP",
  "KyotoCards_Official",
  "Fukuoka_PokeHub",
  "Rayquaza_Vault",
  "Eevee_Kingdom_HK",
  "Snorlax_Bed_TCG",
  "Lugias_Lair_2025",
  "Umbreon_Moon_HK",
  "Dragonite_Fly_JP",
  "Shinobi_TCG_Shop",
  "Kanto_Classics_HK",
];

const TRANSFER_MERCHANTS = [
  "HarutoCards Premium",
  "AikoRare Collection",
  "Daichi Rare Cards",
  "KuroGamer TCG",
  "TokyoRare_HongKong",
  "Kyoto Vault TCG",
  "Osaka PokeCenter HK",
  "Fukuoka Card Kingdom",
];

// Deterministic, SSR-safe helpers for Stripe log generation.
const makePayoutId = (seq: number) =>
  `po_1QxAbC${String(seq).padStart(22, "0")}XYZ`;
const makeTransferId = (seq: number) =>
  `tr_1QxDeF${String(seq).padStart(22, "0")}XYZ`;

const cyclePayoutStatus = (seq: number): StripeLogStatus => {
  const cycle = seq % 5;
  if (cycle === 0) return "paid";
  if (cycle === 1 || cycle === 2) return "in_transit";
  if (cycle === 3) return "pending";
  return "failed";
};

const cycleTransferStatus = (seq: number): StripeLogStatus => {
  const cycle = seq % 6;
  if (cycle === 0 || cycle === 1) return "paid";
  if (cycle === 2 || cycle === 3) return "in_transit";
  if (cycle === 4) return "pending";
  return "failed";
};

const makePayoutDate = (seq: number) => {
  // Seq 1 is latest, seq 38 is oldest. Base day: 2026-07-26.
  const base = new Date(2026, 6, 26, 18, 30, 0).getTime();
  const offsetMinutes = (STRIPE_LOG_PAYOUT_COUNT - seq) * 65;
  const d = new Date(base - offsetMinutes * 60 * 1000);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const makeTransferDate = (seq: number) => {
  const base = new Date(2026, 6, 26, 17, 15, 0).getTime();
  const offsetMinutes = (STRIPE_LOG_TRANSFER_COUNT - seq) * 95;
  const d = new Date(base - offsetMinutes * 60 * 1000);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const MOCK_PAYOUT_LOGS: StripePayoutLog[] = Array.from(
  { length: STRIPE_LOG_PAYOUT_COUNT },
  (_, i) => {
    const seq = i + 1;
    return {
      id: makePayoutId(seq),
      recipient: PAYOUT_RECIPIENTS[seq % PAYOUT_RECIPIENTS.length],
      amount: 9800 + (seq % 47) * 1450,
      status: cyclePayoutStatus(seq),
      createdAt: makePayoutDate(seq),
    };
  },
).sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt));

const MOCK_TRANSFER_LOGS: StripeTransferLog[] = Array.from(
  { length: STRIPE_LOG_TRANSFER_COUNT },
  (_, i) => {
    const seq = i + 1;
    const splitAmount = 24000 + (seq % 61) * 1850;
    return {
      id: makeTransferId(seq),
      merchantName: TRANSFER_MERCHANTS[seq % TRANSFER_MERCHANTS.length],
      splitAmount,
      platformCommission: Math.round(splitAmount * 0.05),
      status: cycleTransferStatus(seq),
      createdAt: makeTransferDate(seq),
    };
  },
).sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt));

function FilterChips<K extends string>({
  options,
  active,
  onSelect,
}: {
  options: { key: K; label: string; count: number }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
      {options.map(({ key, label, count }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`min-h-[44px] px-3 py-1 rounded-lg font-sans text-[11px] transition-colors border ${
              selected
                ? "bg-brand/10 text-brand font-semibold border-brand/40"
                : "text-text-secondary border-white/10 hover:text-text-primary hover:border-white/20"
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

function StripeLogPanel({ variant }: { variant: StripeLogVariant }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const rawRows: StripeLogRow[] =
    variant === "payout" ? MOCK_PAYOUT_LOGS : MOCK_TRANSFER_LOGS;

  const filteredRows = useMemo(() => {
    let result = rawRows;

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      if (variant === "payout") {
        result = result.filter((row) => {
          const payout = row as StripePayoutLog;
          const statusLabel = STRIPE_LOG_STATUS_LABELS[payout.status] || "";
          return (
            payout.id.toLowerCase().includes(q) ||
            payout.recipient.toLowerCase().includes(q) ||
            payout.status.toLowerCase().includes(q) ||
            statusLabel.includes(q)
          );
        });
      } else {
        result = result.filter((row) => {
          const transfer = row as StripeTransferLog;
          const statusLabel = STRIPE_LOG_STATUS_LABELS[transfer.status] || "";
          return (
            transfer.id.toLowerCase().includes(q) ||
            transfer.merchantName.toLowerCase().includes(q) ||
            transfer.status.toLowerCase().includes(q) ||
            statusLabel.includes(q)
          );
        });
      }
    }

    // Date range filter according to createdAt timestamp
    if (dateRange?.from || dateRange?.to) {
      const fromMs = dateRange.from ? startOfDay(dateRange.from).getTime() : 0;
      const toMs = dateRange.to ? endOfDay(dateRange.to).getTime() : Infinity;

      result = result.filter((row) => {
        const timestamp = parseLocalDate(row.createdAt);
        return timestamp >= fromMs && timestamp <= toMs;
      });
    }

    return result;
  }, [rawRows, variant, searchQuery, dateRange]);

  const totalPages =
    Math.ceil(filteredRows.length / STRIPE_LOG_PAGE_SIZE) || 1;

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * STRIPE_LOG_PAGE_SIZE;
    return filteredRows.slice(start, start + STRIPE_LOG_PAGE_SIZE);
  }, [filteredRows, page]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const title =
    variant === "payout"
      ? "Stripe Log — 平台放款紀錄"
      : "Stripe Log — 商戶交易紀錄";
  const subtitle =
    variant === "payout"
      ? "平台 Stripe 帳戶撥款至會員收款帳戶之交易日誌"
      : "商戶 Stripe Connect 子帳戶分賬與交易日誌";

  const headers =
    variant === "payout"
      ? ["Payout ID", "收款會員", "金額", "狀態", "建立時間"]
      : ["Transfer ID", "商戶名稱", "分賬金額", "平台分成", "狀態", "建立時間"];

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[420px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-[16px] text-text-primary">
            {title}
          </h3>
          <p className="font-sans text-[12px] text-text-secondary">{subtitle}</p>
        </div>

        {/* Filter Toolbar: Searchbar + Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder={
                variant === "payout"
                  ? "搜尋 Payout ID、收款人或狀態..."
                  : "搜尋 Transfer ID、商戶或狀態..."
              }
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-disabled" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-text-disabled hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger className="min-h-[44px] h-10 px-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary hover:bg-bg-elevated hover:border-brand/40 transition-colors flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-brand" />
              <span>
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`
                  ) : (
                    `${format(dateRange.from, "yyyy/MM/dd")} - 選擇`
                  )
                ) : (
                  "選擇日期範圍"
                )}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] shadow-2xl z-50"
              align="end"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between gap-4">
                <span className="font-sans text-xs font-semibold text-text-primary">
                  日誌日期範圍篩選
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleDateRangeChange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    })
                  }
                  className="font-mono text-[11px] text-brand hover:underline"
                >
                  近 30 天
                </button>
              </div>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={1}
                className="p-3 bg-transparent text-[#eae1da]"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
        <Table>
          <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
            <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
              {headers.map((header) => (
                <TableHead
                  key={header}
                  className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-center py-8 font-sans text-xs text-text-secondary"
                >
                  沒有符合條件的 Stripe 日誌紀錄
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                if (variant === "payout") {
                  const payout = row as StripePayoutLog;
                  return (
                    <TableRow
                      key={payout.id}
                      className="border-b border-[rgba(237,232,224,0.06)] hover:bg-bg-elevated/40 transition-colors"
                    >
                      <TableCell className="py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-[11px] text-text-disabled truncate max-w-[140px] block"
                          title={payout.id}
                        >
                          {payout.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                        {payout.recipient}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[13px] text-text-primary py-3 whitespace-nowrap">
                        HK$ {payout.amount.toLocaleString("zh-TW")}
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STRIPE_LOG_STATUS_CLASSES[payout.status]}`}
                        >
                          {STRIPE_LOG_STATUS_LABELS[payout.status]}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                        {payout.createdAt}
                      </TableCell>
                    </TableRow>
                  );
                }
                const transfer = row as StripeTransferLog;
                return (
                  <TableRow
                    key={transfer.id}
                    className="border-b border-[rgba(237,232,224,0.06)] hover:bg-bg-elevated/40 transition-colors"
                  >
                    <TableCell className="py-3 whitespace-nowrap">
                      <span
                        className="font-mono text-[11px] text-text-disabled truncate max-w-[140px] block"
                        title={transfer.id}
                      >
                        {transfer.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                      {transfer.merchantName}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[13px] text-text-primary py-3 whitespace-nowrap">
                      HK$ {transfer.splitAmount.toLocaleString("zh-TW")}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                      HK$ {transfer.platformCommission.toLocaleString("zh-TW")}
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STRIPE_LOG_STATUS_CLASSES[transfer.status]}`}
                      >
                        {STRIPE_LOG_STATUS_LABELS[transfer.status]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                      {transfer.createdAt}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
          <div className="font-mono text-[12px] text-text-secondary">
            顯示第{" "}
            <span className="font-bold text-text-primary">
              {(page - 1) * STRIPE_LOG_PAGE_SIZE + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-text-primary">
              {Math.min(page * STRIPE_LOG_PAGE_SIZE, filteredRows.length)}
            </span>{" "}
            筆，共{" "}
            <span className="font-bold text-brand">{filteredRows.length}</span>{" "}
            筆資料
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
            >
              上一頁
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
                  page === p
                    ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                    : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPayoutsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"fps" | "stripe">("fps");
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRequest[]>(initialWithdrawals);
  const [merchantFlows] = useState<MerchantStripeFlow[]>(initialMerchantFlows);

  // Search and Filter state
  const [fpsSearch, setFpsSearch] = useState("");
  const [fpsFilter, setFpsFilter] = useState<FpsFilter>("incomplete");
  const [fpsSort, setFpsSort] = useState<FpsSortValue>("none");

  const [stripeSearch, setStripeSearch] = useState("");
  const [stripeSort, setStripeSort] = useState<StripeSortValue>("none");

  // Pagination State
  const [fpsPage, setFpsPage] = useState(1);
  const [stripePage, setStripePage] = useState(1);
  const pageSize = 10;

  // Checkbox multi-select state
  const [selectedFpsIds, setSelectedFpsIds] = useState<Set<string>>(new Set());
  const [selectedStripeIds, setSelectedStripeIds] = useState<Set<string>>(
    new Set(),
  );

  // ── FPS Counts (from unfiltered source) ────────────────────────────────────
  const fpsCounts = useMemo(() => {
    return {
      all: withdrawals.length,
      incomplete: withdrawals.filter(
        (w) => w.status === "pending" || w.status === "processing",
      ).length,
      completed: withdrawals.filter((w) => w.status === "completed").length,
      failed: withdrawals.filter((w) => w.status === "failed").length,
    };
  }, [withdrawals]);

  // ── FPS Data Pipeline: filter chip → search → sort → paginate ──────────────
  const filteredWithdrawals = useMemo(() => {
    let list = withdrawals;

    if (fpsFilter === "incomplete") {
      list = list.filter(
        (w) => w.status === "pending" || w.status === "processing",
      );
    } else if (fpsFilter !== "all") {
      list = list.filter((w) => w.status === fpsFilter);
    }

    const q = fpsSearch.toLowerCase().trim();
    if (!q) return list;

    return list.filter(
      (w) =>
        w.userName.toLowerCase().includes(q) ||
        w.fpsId.includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.orderNumber.toLowerCase().includes(q),
    );
  }, [withdrawals, fpsFilter, fpsSearch]);

  const sortedWithdrawals = useMemo(() => {
    if (fpsSort === "none") return filteredWithdrawals;
    const [key, direction] = fpsSort.split("-") as [
      "userName" | "submittedAt",
      SortDirection,
    ];
    return [...filteredWithdrawals].sort((a, b) => {
      if (key === "userName") {
        return direction === "asc"
          ? a.userName.localeCompare(b.userName, "zh-HK")
          : b.userName.localeCompare(a.userName, "zh-HK");
      }
      if (key === "submittedAt") {
        return direction === "asc"
          ? parseLocalDate(a.submittedAt) - parseLocalDate(b.submittedAt)
          : parseLocalDate(b.submittedAt) - parseLocalDate(a.submittedAt);
      }
      return 0;
    });
  }, [filteredWithdrawals, fpsSort]);

  const totalFpsPages = Math.ceil(sortedWithdrawals.length / pageSize) || 1;
  const paginatedWithdrawals = useMemo(() => {
    const start = (fpsPage - 1) * pageSize;
    return sortedWithdrawals.slice(start, start + pageSize);
  }, [sortedWithdrawals, fpsPage]);

  // ── Stripe Data Pipeline: search → sort → paginate ─────────────────────────
  const filteredMerchantFlows = useMemo(() => {
    const q = stripeSearch.toLowerCase().trim();
    if (!q) return merchantFlows;

    return merchantFlows.filter(
      (m) =>
        m.merchantName.toLowerCase().includes(q) ||
        m.stripeTransferId.toLowerCase().includes(q) ||
        m.orderNumber.toLowerCase().includes(q) ||
        m.subAccountId.toLowerCase().includes(q),
    );
  }, [merchantFlows, stripeSearch]);

  const sortedMerchantFlows = useMemo(() => {
    if (stripeSort === "none") return filteredMerchantFlows;
    const [key, direction] = stripeSort.split("-") as [
      "merchantName" | "createdAt",
      SortDirection,
    ];
    return [...filteredMerchantFlows].sort((a, b) => {
      if (key === "merchantName") {
        return direction === "asc"
          ? a.merchantName.localeCompare(b.merchantName, "zh-HK")
          : b.merchantName.localeCompare(a.merchantName, "zh-HK");
      }
      if (key === "createdAt") {
        return direction === "asc"
          ? parseLocalDate(a.createdAt) - parseLocalDate(b.createdAt)
          : parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt);
      }
      return 0;
    });
  }, [filteredMerchantFlows, stripeSort]);

  const totalStripePages =
    Math.ceil(sortedMerchantFlows.length / pageSize) || 1;
  const paginatedMerchantFlows = useMemo(() => {
    const start = (stripePage - 1) * pageSize;
    return sortedMerchantFlows.slice(start, start + pageSize);
  }, [sortedMerchantFlows, stripePage]);

  // ── Sort / Filter / Search Handlers (always reset page + selection) ────────
  const handleFpsSort = (value: FpsSortValue) => {
    setFpsSort(value);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

  const handleFpsFilterChange = (filter: FpsFilter) => {
    setFpsFilter(filter);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

  const handleFpsSearchChange = (value: string) => {
    setFpsSearch(value);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

  const handleStripeSort = (value: StripeSortValue) => {
    setStripeSort(value);
    setStripePage(1);
    setSelectedStripeIds(new Set());
  };

  const handleStripeSearchChange = (value: string) => {
    setStripeSearch(value);
    setStripePage(1);
    setSelectedStripeIds(new Set());
  };

  // ── Multi-select Handlers ──────────────────────────────────────────────────
  const toggleSelectAllFps = () => {
    if (selectedFpsIds.size === filteredWithdrawals.length) {
      setSelectedFpsIds(new Set());
    } else {
      setSelectedFpsIds(new Set(filteredWithdrawals.map((w) => w.id)));
    }
  };

  const toggleSelectFpsRow = (id: string) => {
    const next = new Set(selectedFpsIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFpsIds(next);
  };

  const toggleSelectAllStripe = () => {
    if (selectedStripeIds.size === filteredMerchantFlows.length) {
      setSelectedStripeIds(new Set());
    } else {
      setSelectedStripeIds(
        new Set(filteredMerchantFlows.map((m) => m.stripeTransferId)),
      );
    }
  };

  const toggleSelectStripeRow = (id: string) => {
    const next = new Set(selectedStripeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStripeIds(next);
  };

  // ── FPS Actions ─────────────────────────────────────────────────────────────
  const handleAction = (
    id: string,
    newStatus: "completed" | "processing" | "failed",
  ) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)),
    );
    // 該筆狀態一改就可能被當前 filter 濾走，必須同步取消選取，避免批次操作／導出到看不見的紀錄。
    setSelectedFpsIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const actionLabel =
      newStatus === "completed"
        ? "手動銷帳成功"
        : newStatus === "processing"
          ? "已開始處理"
          : "已標記失敗";
    toast.success(`提現單 ${id} ${actionLabel}`);
  };

  const handleBatchComplete = () => {
    if (selectedFpsIds.size === 0) return;
    setWithdrawals((prev) =>
      prev.map((w) =>
        selectedFpsIds.has(w.id) ? { ...w, status: "completed" } : w,
      ),
    );
    toast.success(`已批量完成 ${selectedFpsIds.size} 筆提現單銷帳！`);
    setSelectedFpsIds(new Set());
  };

  const handleExportFpsCSV = (exportSelectedOnly = false) => {
    const targetList = exportSelectedOnly
      ? withdrawals.filter((w) => selectedFpsIds.has(w.id))
      : sortedWithdrawals; // 全量導出＝跟隨當前 filter / search / sort 結果，避免與畫面不一致

    if (targetList.length === 0) {
      toast.warning("沒有可導出的提現紀錄！");
      return;
    }

    const headers =
      "提現單號,訂單號,用戶名稱,提現金額(HK$),FPS ID,提交時間,狀態\n";
    const rows = targetList
      .map(
        (w) =>
          `${w.id},"${w.orderNumber}","${w.userName}",${w.amount},"${w.fpsId}","${w.submittedAt}",${STATUS_LABELS[w.status]}`,
      )
      .join("\n");
    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `HKCV_FPS_Payout_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`已成功導出 ${targetList.length} 筆 FPS Payout CSV 文件！`);
  };

  // ── Merchant Stripe CSV Export ─────────────────────────────────────────────
  const handleExportMerchantCSV = (exportSelectedOnly = false) => {
    const targetList = exportSelectedOnly
      ? merchantFlows.filter((m) => selectedStripeIds.has(m.stripeTransferId))
      : sortedMerchantFlows;

    if (targetList.length === 0) {
      toast.warning("沒有可導出的商戶流水紀錄！");
      return;
    }

    const headers =
      "Stripe流水號,訂單號,商戶名稱,Stripe帳戶ID,帳戶餘額(HK$),分賬總額(HK$),平台分成(HK$),建立日期\n";
    const rows = targetList
      .map(
        (m) =>
          `"${m.stripeTransferId}","${m.orderNumber}","${m.merchantName}","${m.subAccountId}",${m.balance},${m.totalPayout},${m.platformCommission},"${m.createdAt}"`,
      )
      .join("\n");

    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `HKCV_Merchant_Stripe_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`已成功導出 ${targetList.length} 筆商戶流水 CSV 文件！`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <h1 className="font-sans font-bold text-[20px] text-text-primary">
          財務與結算管控台
        </h1>
        <p className="font-sans text-[12px] text-text-secondary mt-0.5">
          人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與佣金收益監控
        </p>
      </div>

      {/* ── Stripe 平台帳戶餘額 ─────────────────────────────────────────────── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 relative overflow-hidden">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-text-primary">
              Stripe 平台帳戶餘額
            </h2>
            <p className="font-sans text-[12px] text-text-secondary mt-0.5">
              平台 Stripe Connect 主帳戶即時資金狀況
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.success("已重新整理 Stripe 帳戶餘額")}
            className="min-h-[44px] h-9 px-3 border border-brand/30 text-brand font-sans text-[12px] rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新整理
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
              可用餘額 (Available)
            </span>
            <span className="font-mono font-bold text-[24px] text-brand tracking-tight leading-none block mt-1">
              HK$ {stripePlatformBalance.available.toLocaleString("zh-TW")}
            </span>
          </div>
          <div>
            <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
              待結算 (Pending)
            </span>
            <span className="font-mono font-bold text-[24px] text-text-primary tracking-tight leading-none block mt-1">
              HK$ {stripePlatformBalance.pending.toLocaleString("zh-TW")}
            </span>
          </div>
          <div>
            <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
              今日入賬 (Today In)
            </span>
            <span className="font-mono font-bold text-[24px] text-success tracking-tight leading-none block mt-1">
              HK$ {stripePlatformBalance.todayIn.toLocaleString("zh-TW")}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)] font-mono text-[11px] text-text-secondary">
          最後同步：{stripePlatformBalance.lastSyncedAt}
        </div>
      </div>

      {/* ── Full-Width Segmented Tab Selector ───────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab("fps")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "fps"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">🏦 FPS 批次處理</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {withdrawals.filter((w) => w.status === "pending").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stripe")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">💳 商戶流水 (Stripe)</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {merchantFlows.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Data Table Container (Full Height Flex) ────────────────── */}
      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {/* ── Tab 1: FPS 批次處理 View ──────────────────────────────────── */}
        {activeTab === "fps" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar Row 1: Search + Clean Toggleable Batch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋用戶名稱、FPS ID 或單號..."
                  value={fpsSearch}
                  onChange={(e) => handleFpsSearchChange(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-2.5 text-text-disabled"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Action Cluster (Toggle between Selection Mode & Full Mode) */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedFpsIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      已選 {selectedFpsIds.size} 筆
                    </span>
                    <button
                      onClick={() => handleExportFpsCSV(true)}
                      className="h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-primary hover:text-brand font-sans text-xs rounded-xl hover:bg-bg-hover transition-colors whitespace-nowrap flex items-center gap-1.5"
                    >
                      📥 導出已選 ({selectedFpsIds.size})
                    </button>
                    <button
                      onClick={handleBatchComplete}
                      className="h-9 px-3.5 bg-success text-[#111] font-sans font-bold text-xs rounded-xl hover:bg-success/90 transition-transform whitespace-nowrap flex items-center gap-1 shadow-md shadow-success/10"
                    >
                      ✓ 批量銷帳
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExportFpsCSV(false)}
                    className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    全量導出 Payout CSV
                  </button>
                )}
              </div>
            </div>

            {/* Toolbar Row 2: Filter Chips + Sort Select */}
            <div className="flex flex-wrap items-center gap-3">
              <FilterChips
                options={[
                  { key: "all", label: "全部", count: fpsCounts.all },
                  {
                    key: "incomplete",
                    label: "未完成",
                    count: fpsCounts.incomplete,
                  },
                  {
                    key: "completed",
                    label: "已完成",
                    count: fpsCounts.completed,
                  },
                  { key: "failed", label: "已駁回", count: fpsCounts.failed },
                ]}
                active={fpsFilter}
                onSelect={handleFpsFilterChange}
              />

              <SortSelect
                value={fpsSort}
                options={FPS_SORT_OPTIONS}
                onChange={handleFpsSort}
              />
            </div>

            {/* High-Density Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredWithdrawals.length > 0 &&
                          selectedFpsIds.size === filteredWithdrawals.length
                        }
                        onChange={toggleSelectAllFps}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      提現單號
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      訂單號
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      用戶名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      提現金額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      FPS ID
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      提交時間
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      狀態
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWithdrawals.map((w) => {
                    const isSelected = selectedFpsIds.has(w.id);
                    const isPending = w.status === "pending";
                    return (
                      <TableRow
                        key={w.id}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors ${
                          isSelected
                            ? "bg-[rgba(212,165,116,0.08)]"
                            : "hover:bg-bg-elevated/40"
                        }`}
                      >
                        <TableCell className="w-10 text-center py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFpsRow(w.id)}
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          #{w.id}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {w.orderNumber}
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {w.userName}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                          HK$ {w.amount.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-brand font-bold py-3 whitespace-nowrap">
                          {w.fpsId}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {w.submittedAt}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STATUS_BADGES[w.status]}`}
                          >
                            {STATUS_LABELS[w.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/profile/user/orderDetail/${w.orderNumber}`,
                                )
                              }
                              className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap"
                            >
                              查看訂單
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(w.id, "completed")
                                  }
                                  className="min-h-[44px] h-9 px-2.5 bg-success text-[#111] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform"
                                >
                                  ✓ 銷帳
                                </button>
                                <button
                                  onClick={() => handleAction(w.id, "failed")}
                                  className="min-h-[44px] h-9 px-2.5 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[10px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform"
                                >
                                  ✕ 駁回
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── FPS Table Pagination ─────────────────────────────────── */}
            {sortedWithdrawals.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(fpsPage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(fpsPage * pageSize, sortedWithdrawals.length)}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {sortedWithdrawals.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={fpsPage === 1}
                    onClick={() => setFpsPage((prev) => Math.max(prev - 1, 1))}
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from({ length: totalFpsPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFpsPage(p)}
                        className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                          fpsPage === p
                            ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                            : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={fpsPage === totalFpsPages}
                    onClick={() =>
                      setFpsPage((prev) => Math.min(prev + 1, totalFpsPages))
                    }
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stripe payout log (outside main table container, sibling) */}
        {activeTab === "fps" && <StripeLogPanel variant="payout" />}

        {/* ── Tab 2: 商戶流水 (Stripe) View ──────────────────────── */}
        {activeTab === "stripe" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar: Search + Export CSV Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋商戶名稱、Stripe 流水號或訂單號..."
                  value={stripeSearch}
                  onChange={(e) => handleStripeSearchChange(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-2.5 text-text-disabled"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Action Cluster (Merchant CSV Export) */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedStripeIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      已選 {selectedStripeIds.size} 筆
                    </span>
                    <button
                      onClick={() => handleExportMerchantCSV(true)}
                      className="h-9 px-3 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                    >
                      📥 導出已選流水 CSV ({selectedStripeIds.size})
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExportMerchantCSV(false)}
                    className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    全量導出商戶 CSV
                  </button>
                )}
              </div>
            </div>

            {/* Toolbar Row 2: Sort Select (Stripe 分頁無狀態篩選，故只有排序) */}
            <div className="flex flex-wrap items-center gap-3">
              <SortSelect
                value={stripeSort}
                options={STRIPE_SORT_OPTIONS}
                onChange={handleStripeSort}
              />
            </div>

            {/* High-Density Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredMerchantFlows.length > 0 &&
                          selectedStripeIds.size ===
                            filteredMerchantFlows.length
                        }
                        onChange={toggleSelectAllStripe}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe 流水號
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      訂單號
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      商戶名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe 帳戶 ID
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      帳戶餘額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      分賬總額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      平台分成
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      建立日期
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMerchantFlows.map((flow) => {
                    const isSelected = selectedStripeIds.has(
                      flow.stripeTransferId,
                    );
                    return (
                      <TableRow
                        key={flow.stripeTransferId}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors ${
                          isSelected
                            ? "bg-[rgba(212,165,116,0.08)]"
                            : "hover:bg-bg-elevated/40"
                        }`}
                      >
                        <TableCell className="w-10 text-center py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleSelectStripeRow(flow.stripeTransferId)
                            }
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-brand font-bold py-3 whitespace-nowrap">
                          {flow.stripeTransferId}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.orderNumber}
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {flow.merchantName}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.subAccountId}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                          HK$ {flow.balance.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-success text-right py-3 whitespace-nowrap">
                          HK$ {flow.totalPayout.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                          HK$ {flow.platformCommission.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.createdAt}
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/profile/merchant/orderDetail/${flow.orderNumber}`,
                              )
                            }
                            className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap"
                          >
                            查看訂單
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Stripe Table Pagination ─────────────────────────────────── */}
            {sortedMerchantFlows.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(stripePage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(
                      stripePage * pageSize,
                      sortedMerchantFlows.length,
                    )}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {sortedMerchantFlows.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={stripePage === 1}
                    onClick={() =>
                      setStripePage((prev) => Math.max(prev - 1, 1))
                    }
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from(
                    { length: totalStripePages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStripePage(p)}
                      className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                        stripePage === p
                          ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                          : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={stripePage === totalStripePages}
                    onClick={() =>
                      setStripePage((prev) =>
                        Math.min(prev + 1, totalStripePages),
                      )
                    }
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stripe transfer log (outside main table container, sibling) */}
        {activeTab === "stripe" && <StripeLogPanel variant="transfer" />}
      </div>
    </div>
  );
}
