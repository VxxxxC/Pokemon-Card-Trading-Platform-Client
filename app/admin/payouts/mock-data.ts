// Phase A: mock FPS data until payout_requests schema is wired (Phase C).

export interface WithdrawalRequest {
  id: string;
  userName: string;
  amount: number;
  fpsId: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
  orderId: string;
  orderNumber: string;
}

export interface MerchantStripeFlow {
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

export type SortDirection = "asc" | "desc";

export type FpsFilter = "all" | "incomplete" | "completed" | "failed";

/** 排序下拉選單的組合值：`${欄位}-${方向}`，"none" 代表維持資料原始順序。 */
export type FpsSortValue =
  | "none"
  | "userName-asc"
  | "userName-desc"
  | "submittedAt-desc"
  | "submittedAt-asc";

export type StripeSortValue =
  | "none"
  | "merchantName-asc"
  | "merchantName-desc"
  | "createdAt-desc"
  | "createdAt-asc";

export const FPS_SORT_OPTIONS: { value: FpsSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "userName-asc", label: "用戶名稱：A → Z" },
  { value: "userName-desc", label: "用戶名稱：Z → A" },
  { value: "submittedAt-desc", label: "提交時間：最新優先" },
  { value: "submittedAt-asc", label: "提交時間：最舊優先" },
];

export const STRIPE_SORT_OPTIONS: { value: StripeSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "merchantName-asc", label: "商戶名稱：A → Z" },
  { value: "merchantName-desc", label: "商戶名稱：Z → A" },
  { value: "createdAt-desc", label: "建立日期：最新優先" },
  { value: "createdAt-asc", label: "建立日期：最舊優先" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export const parseLocalDate = (s: string) => new Date(s.replace(/\//g, "-")).getTime();

// Deterministic UUID-lookalike so the mock data is SSR-safe.
export const mockUuid = (seq: number) => {
  const suffix = String(seq).padStart(12, "0");
  return `00000000-0000-4000-8${suffix.slice(0, 3)}-${suffix.slice(3, 7)}-${suffix.slice(7, 19)}`;
};

export const STATUS_LABELS: Record<WithdrawalRequest["status"], string> = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  failed: "已駁回",
};

export const STATUS_BADGES = {
  pending: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  processing: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  completed: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
};

// ── Initial Mock Data ────────────────────────────────────────────────────────
// 每一筆提現申請嚴格對應唯一一筆 member_orders 訂單（1:1），以符合反洗錢追蹤要求。
// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: payout_requests, member_orders | View / RPC: list_payout_requests
export const initialWithdrawals: WithdrawalRequest[] = [
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

export const initialMerchantFlows: MerchantStripeFlow[] = [
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

export type StripeLogStatus = "paid" | "pending" | "in_transit" | "failed";

export type StripeLogVariant = "payout" | "transfer";

export interface StripePayoutLog {
  id: string;
  recipient: string;
  amount: number;
  status: StripeLogStatus;
  createdAt: string;
}

export interface StripeTransferLog {
  id: string;
  merchantName: string;
  splitAmount: number;
  platformCommission: number;
  status: StripeLogStatus;
  createdAt: string;
}

export type StripeLogRow = StripePayoutLog | StripeTransferLog;

export const STRIPE_LOG_PAGE_SIZE = 15;

export const STRIPE_LOG_STATUS_LABELS: Record<StripeLogStatus, string> = {
  paid: "已到賬",
  pending: "處理中",
  in_transit: "轉賬中",
  failed: "失敗",
};

export const STRIPE_LOG_STATUS_CLASSES: Record<StripeLogStatus, string> = {
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

export const MOCK_PAYOUT_LOGS: StripePayoutLog[] = Array.from(
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

export const MOCK_TRANSFER_LOGS: StripeTransferLog[] = Array.from(
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
