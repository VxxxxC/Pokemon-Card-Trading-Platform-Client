# HKCardVault 管理員後台評估與實作藍圖 (Admin Backend Assessment & Blueprint)

> 產出日期：2026-07-20 · 分支：`aaron-backend-wired`
> 文件性質：純評估報告 + 詳細實作規格 (DDL / Server Action / RLS) + UI/UX 藍圖
> 適用對象：全端工程師、Master Planner、Supabase BaaS Agent

---

## 目錄

1. [執行摘要 (Executive Summary)](#1-執行摘要-executive-summary)
2. [平台全功能總覽 (Platform Feature Landscape)](#2-平台全功能總覽-platform-feature-landscape)
3. [現有 Admin 五大模組逐一拆解](#3-現有-admin-五大模組逐一拆解)
4. [需求達成度 Gap 表 (對齊 §1.9.5)](#4-需求達成度-gap-表對齊-195)
5. [缺口分析 (分級 P0 / P1 / P2)](#5-缺口分析分級-p0--p1--p2)
6. [進階功能建議 (BI / 風控 / 爭議 / 審計)](#6-進階功能建議bi--風控--爭議--審計)
7. [實作規格 A：資料庫 DDL / RLS 草案](#7-實作規格-a資料庫-ddl--rls-草案)
8. [實作規格 B：Server Actions 簽名契約](#8-實作規格-bserver-actions-簽名契約)
9. [UI/UX 藍圖 (Wireframe 級 + Chart 建議)](#9-uiux-藍圖wireframe-級--chart-建議)
10. [建議實作 Roadmap](#10-建議實作-roadmap)
11. [附錄：檔案路徑索引](#11-附錄檔案路徑索引)

---

## 1. 執行摘要 (Executive Summary)

**一句話定調：** 現時嘅 Admin 後台係一個「**設計 100% 完成、後端 0% 接駁**」嘅純 UI 骨架原型 (Zero-functional Prototype)。五個管理頁面全部像素級完成、深黑金風格統一，但所有數據皆為 hardcoded mock，25+ 個操作按鈕全部未綁定 handler。

**地基評估（好消息）：** 底層權限與資料契約已相當穩固 ——
- ✅ RBAC 型別齊備 (`UserRole = USER | PENDING_MERCHANT | MERCHANT | ADMIN`)
- ✅ Service-role Admin Client 已封裝 (`createAdminClient()`)
- ✅ Middleware `/admin/*` fail-closed 守衛設計已規劃
- ⚠️ 但 admin 專屬資料表 (`kyc_applications`, `platform_settings`, `audit_log`) **尚未有實體 migration**，僅存在於 `docs/dev/database.md` 規劃層。

**達成度儀表板：**

| 維度 | 完成度 | 說明 |
|---|---|---|
| UI / 設計 | 🟢 100% | 5 頁完整，導航齊備 |
| 前端互動 (handler) | 🔴 5% | 僅 tab 切換，操作鈕全空 |
| Server Actions | 🔴 0% | 生產級 admin action 為零（只有 dev-only escrow RPC）|
| 資料庫 Schema | 🟡 40% | 核心 enum/欄位有規劃，admin 專表未 migrate |
| 進階數據分析 (BI) | 🔴 0% | 完全未起步 |
| 爭議仲裁 / 審計 | 🔴 0% | 完全未起步 |

**核心結論：** 需求 `§1.9.5` 四大管理員職責（監控 GMV/佣金、審核卡牌條目、處理爭議訂單、封鎖違規用戶）目前**冇一項真正可運作**。要達到 MVP 上線標準，需完成 P0 清單；要達到「頂級金融科技管理體驗」，需納入 P1/P2 進階模組。

---

## 2. 平台全功能總覽 (Platform Feature Landscape)

此節建立 Admin 需要監管嘅「業務全景」，作為後續 oversight 缺口對照基準。

### 2.1 角色體系
| 角色 | DB Enum | 首頁 | 核心權限 |
|---|---|---|---|
| 一般會員 | `USER` | `/profile/user` | 瀏覽、收藏、下單、私人收藏、出售 |
| 待審核商戶 | `PENDING_MERCHANT` | `/profile/user`(gated) | 等待 KYC，未能上架 |
| 商戶 | `MERCHANT` | `/profile/merchant` | 上架、庫存、銷售分析、Stripe Connect |
| 管理員 | `ADMIN` | `/admin` | 全平台管控（桌面優先，隔離消費端）|

> 註：平台採「雙人格 (Dual Persona)」設計，同一用戶可切換買家 / 賣家身分，各自維護獨立訂單、評價、信譽。

### 2.2 面向消費端嘅核心業務域（Admin 監管標的）
| 業務域 | 代表 Server Actions / lib | Admin 需監管點 |
|---|---|---|
| 認證註冊 | `auth.ts` | 封禁、Session 撤銷 |
| 上架管理 | `listings.ts`、`lib/listings/*` | 違規下架、圖片審核、卡牌條目審批 |
| 市場搜尋 | `marketplace.ts`、`lib/marketplace/*` | 熱度/需求信號分析 |
| 議價協商 | `offers.ts` | 異常叫價、詐騙偵測 |
| 即時聊天 | `chat.ts`（Realtime）| 敏感資訊/AML 警示監察 |
| 交易託管 | `orders.ts`、`lib/member-order/*` | **爭議介入、退款、escrow override** |
| 私人收藏 | `collection.ts` | — |
| 心願單 | `wishlist.ts` | 需求熱力圖 |
| 評價系統 | `reviews.ts`（雙盲）| 惡意評價仲裁 |
| 舉報投訴 | `reports.ts` | **舉報工單 queue（現無 admin 端）** |
| 獎勵遊戲化 | `rewards.ts` | 刷分濫用偵測、coupon 發放 |
| 商戶分析 | `merchant-*.ts` | 平台級聚合對照 |
| 結帳金流 | `lib/payments/*`、Stripe Connect | 佣金核對、撥款監控 |

### 2.3 全額託管 (Full-Pay Escrow) 生命週期
Admin 監控嘅訂單狀態機（依 `ESCROW_STEPS`）：

```
付款 payment → 保管中 custody → 鑑定中 grading → 已發貨 shipped → 已釋放 released
                                                              ↘ 已取消 cancelled
```

> 全平台強制 **100% 全額付訖**，嚴禁訂金欄位。Admin 爭議介入必須在此狀態機任一節點提供 override / 退款能力。

---

## 3. 現有 Admin 五大模組逐一拆解

| 路由 | 模組 | 資料源狀態 | 未接駁項目 |
|---|---|---|---|
| `/admin` | 📈 平台監控 | 🔴 100% MOCK | GMV/佣金聚合、即時交易流訂閱、系統健康 ping |
| `/admin/approvals` | 🪪 KYC 審核中心 | 🔴 100% MOCK | 批准/拒絕 action、文件簽名 URL、Email 通知 |
| `/admin/users` | 👥 用戶管理 | 🔴 100% MOCK | 搜尋/過濾、封禁/解封 action、詳情頁 `[id]` |
| `/admin/database` | 🗃️ 卡牌資料庫 | 🔴 100% MOCK | 手動錄入 insert、快取刷新、審批工作流 |
| `/admin/settings` | ⚙️ 營運設定 | 🔴 100% MOCK | 運費補貼/佣金/爬蟲/API 金鑰/危險區 全部空 handler |

### 3.1 平台監控 `/admin/page.tsx`
- **UI 完整**：4 張 KPI 卡（GMV、Stripe 佣金、在線人數、每日成交）、即時交易流 (5 筆)、6 服務健康面板。
- **TODO manifest**：`[database]` 聚合 orders+stripe_payouts+sessions、`[database]` Realtime 訂閱、`[server]` 真實 HK 時區時間、`[API]` 服務健康 ping。

### 3.2 KYC 審核中心 `/admin/approvals/page.tsx`
- **UI 完整**：統計列（5 待審/2 通過/1 拒絕）、7 筆 mock 申請（申請人、店名、證件類型、交易數、評分）。
- **未接**：查看文件、批准（升級 MERCHANT）、拒絕（+ Email）。

### 3.3 用戶管理 `/admin/users/page.tsx`
- **UI 完整**：統計列、8 筆 mock 用戶、搜尋框、角色過濾、封禁鈕。
- **未接**：搜尋 ilike、`/admin/users/[id]` 詳情頁（**尚未建立**）、封禁 + Session 撤銷。

### 3.4 卡牌資料庫 `/admin/database/page.tsx`
- **UI 完整**：統計列、7 筆卡牌條目、手動錄入表單 (6 欄)、Top-100 快取刷新鈕。
- **未接**：`card_catalog` 查詢、手動 insert、TCGdex 重抓、編輯/審核 modal。

### 3.5 營運設定 `/admin/settings/page.tsx`
- **UI 完整**：運費補貼、爬蟲頻率 (Mercari/SKUNK)、4 組外部 API 金鑰、佣金費率 (5%)、危險區（暫停交易/清快取）。
- **未接**：全部 upsert `platform_settings`、爬蟲 job dispatch、金鑰更換 modal。

---

## 4. 需求達成度 Gap 表（對齊 §1.9.5）

> **§1.9.5 管理員面板：** 監控平台總成交額及佣金收入、審核用戶提交的新卡牌條目、處理爭議訂單及封鎖違規用戶。

| 職責 | 前端 | 後端 | DB | 綜合狀態 |
|---|---|---|---|---|
| 監控 GMV + 佣金收入 | ✅ | ❌ | 🟡 需聚合 | 🔴 未運作 |
| 審核用戶提交新卡牌條目 | 🟡 | ❌ | 🟡 需 `needs_review` | 🔴 未運作 |
| **處理爭議訂單** | ❌ | ❌ | 🟡 orders 有 | 🔴 **完全未起步** |
| 封鎖違規用戶 | ✅ | ❌ | ✅ `is_banned` | 🔴 未運作 |

**結論：** 四大職責達成度 0/4 可運作。其中「處理爭議訂單」連 UI 都未存在，屬最大空白。

---

## 5. 缺口分析（分級 P0 / P1 / P2）

### 🔴 P0 — MVP 上線必備（阻斷級）
1. **Middleware `/admin/*` 硬守衛落地** — 確認 `role === 'ADMIN'` fail-closed 已生效於生產。
2. **KYC 審批 Server Action** — `reviewKyc(approve/reject)` + 文件簽名 URL + Email。
3. **用戶封禁 Server Action** — `toggleUserBan` + Session 撤銷。
4. **平台監控真實聚合** — GMV / 佣金 / 活躍用戶 / 訂單量 SQL。
5. **`kyc_applications` / `platform_settings` migration 落地** — 現只存在於文檔。

### 🟠 P1 — 營運核心（強烈建議）
6. **爭議仲裁工作台** — `reports` 舉報工單 queue + 訂單級介入（退款 / mark complete / escrow override）。
7. **審計日誌 `audit_log`** — 所有 admin 高風險操作 append-only 記錄（fail-closed 治理要求）。
8. **營運設定 CRUD** — 佣金率 / 運費補貼 / 爬蟲頻率 upsert。
9. **用戶詳情頁 `/admin/users/[id]`** — 穿透審查單一會員全貌。
10. **卡牌條目審批工作流** — `needs_review` 審核 + 手動錄入。

### 🟡 P2 — 進階體驗（差異化）
11. **BI 數據分析中心** — 趨勢圖、留存、轉化漏斗、商戶排行、品類熱力。
12. **風控告警面板** — 異常叫價 / 刷分 / AML 敏感詞 即時告警。
13. **通知中心** — 待辦聚合（待審 KYC / 未處理爭議 / 系統異常）。
14. **聊天監察** — 敏感訊息審閱 / 警告下發。
15. **即時交易牆** — Supabase Realtime 訂閱直播成交。

---

## 6. 進階功能建議（BI / 風控 / 爭議 / 審計）

### 6.1 BI 數據分析中心 `/admin/analytics`（P2 旗艦）
建議獨立大盤，聚焦「決策級」指標而非虛榮指標：
- **財務健康**：GMV 趨勢（日/週/月）、淨佣金收入、平均客單價 (AOV)、退款率。
- **成長**：新註冊 / 活躍 (DAU/WAU/MAU)、次日/7日留存曲線、商戶轉化率。
- **交易漏斗**：瀏覽 → 加心願 → 出價 → 成交 → 完成託管（各級轉化%）。
- **供需信號**：心願單熱力榜（需求）、上架庫存分布（供給）、缺貨品類。
- **商戶排行**：GMV Top 商戶、履約率 / 回應時間 / 爭議率排行。

### 6.2 爭議仲裁工作台 `/admin/disputes`（P1 核心）
- 舉報工單 queue（狀態：待處理 / 調查中 / 已裁決）。
- 訂單時間軸還原（付款→託管→鑑定→發貨），一鍵拉取聊天記錄與金流憑證。
- 裁決動作：全額退款 / 部分退款 / 釋放款項給賣家 / 標記完成 / 封禁涉事方。
- 每項裁決強制寫入 `audit_log`（誰、何時、對哪張訂單、理由）。

### 6.3 審計日誌 `audit_log`（P1 治理防線）
- **Append-only、不可修改/刪除**（符合合規與可審計原則）。
- 記錄：admin_id、action、target_table、target_id、before/after 快照、reason、timestamp。
- 涵蓋：KYC 裁決、封禁、佣金調整、退款、危險區操作。

### 6.4 風控告警 `/admin/risk`（P2）
- 規則引擎（可配置 regex / 閾值）：短時間高頻叫價、異常刷簽到、AML 敏感詞。
- 信號降級信任分（trust score decay），高風險自動進 queue 待人工複核。

---

## 7. 實作規格 A：資料庫 DDL / RLS 草案

> 皆為草案，落地前須對照 `docs/dev/database.md` SSOT 及 `types/supabase.ts` 生成型別，避免 Interface Drift。所有 admin 讀寫皆 **fail-closed**。

### 7.1 共用守衛函式
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;
```

### 7.2 `kyc_applications`（P0）
```sql
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.kyc_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name     text NOT NULL,
  document_path text NOT NULL,          -- Supabase Storage 私有桶路徑
  document_type text NOT NULL,          -- passport | id_card | license | cert
  status        public.kyc_status NOT NULL DEFAULT 'pending',
  reviewed_by   uuid REFERENCES public.profiles(id),
  reviewed_at   timestamptz,
  reject_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_applications ENABLE ROW LEVEL SECURITY;

-- 申請人只讀自己；Admin 全權
CREATE POLICY kyc_owner_read ON public.kyc_applications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY kyc_admin_write ON public.kyc_applications
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### 7.3 `platform_settings`（P0，key-value 單例）
```sql
CREATE TABLE public.platform_settings (
  key         text PRIMARY KEY,           -- commission_rate | shipping_subsidy | scraper_freq_mercari ...
  value       jsonb NOT NULL,
  updated_by  uuid REFERENCES public.profiles(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 公開設定可讀（如佣金率供結帳試算）；只有 Admin 可寫
CREATE POLICY settings_public_read ON public.platform_settings
  FOR SELECT USING (true);
CREATE POLICY settings_admin_write ON public.platform_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### 7.4 `audit_log`（P1，append-only）
```sql
CREATE TABLE public.audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id     uuid NOT NULL REFERENCES public.profiles(id),
  action       text NOT NULL,             -- kyc.approve | user.ban | order.refund ...
  target_table text,
  target_id    text,
  before_snap  jsonb,
  after_snap   jsonb,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 只有 Admin 可讀；任何人不得 UPDATE/DELETE（無對應 policy = 全拒）
CREATE POLICY audit_admin_read ON public.audit_log
  FOR SELECT USING (public.is_admin());
CREATE POLICY audit_admin_insert ON public.audit_log
  FOR INSERT WITH CHECK (public.is_admin());
```

### 7.5 `profiles` / `listings` 補欄位
```sql
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.listings  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;
```

---

## 8. 實作規格 B：Server Actions 簽名契約

> 統一放置 `app/actions/admin.ts`（或按域拆檔）。所有 action 必須：(1) `getOptionalAuthUser()` 取身分 → 校驗 `role === 'ADMIN'`；(2) 使用 `createAdminClient()` service-role 執行；(3) 高風險操作寫 `audit_log`；(4) `revalidatePath` 相關頁。沿用現有 `admin-member-orders.ts` 之 fail-closed 模式。

```ts
// ── 型別 ──────────────────────────────────────────
export interface AdminActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── P0 KYC 審核 ───────────────────────────────────
export async function reviewKyc(
  applicationId: string,
  decision: 'approve' | 'reject',
  rejectReason?: string,
): Promise<AdminActionResult<{ newRole?: 'MERCHANT' }>>;

export async function getKycDocumentSignedUrl(
  applicationId: string,
): Promise<AdminActionResult<{ url: string }>>;

// ── P0 用戶管理 ───────────────────────────────────
export async function toggleUserBan(
  userId: string,
  isBanned: boolean,
  reason?: string,
): Promise<AdminActionResult>;

export async function searchAdminUsers(params: {
  q?: string;
  role?: UserRole;
  page?: number;
}): Promise<AdminActionResult<{ users: UserProfile[]; total: number }>>;

// ── P0 平台監控聚合 ───────────────────────────────
export async function getPlatformMetrics(): Promise<AdminActionResult<{
  gmv: number; commission: number; activeUsers: number; dailyOrders: number;
}>>;

// ── P1 營運設定 ───────────────────────────────────
export async function upsertPlatformSetting(
  key: string,
  value: unknown,
): Promise<AdminActionResult>;

// ── P1 爭議仲裁 ───────────────────────────────────
export async function listDisputes(status?: 'pending' | 'investigating' | 'resolved')
  : Promise<AdminActionResult<Dispute[]>>;

export async function resolveDispute(params: {
  reportId: string;
  orderId: string;
  action: 'refund_full' | 'refund_partial' | 'release_seller' | 'mark_complete';
  amount?: number;
  reason: string;
}): Promise<AdminActionResult>;

// ── P1 卡牌審批 ───────────────────────────────────
export async function reviewCardEntry(
  cardId: string,
  decision: 'approve' | 'reject',
): Promise<AdminActionResult>;

export async function createManualCardEntry(input: {
  cardNumber: string; nameEn: string; nameJa: string; setCode: string; rarity: string;
}): Promise<AdminActionResult<{ id: string }>>;

// ── P2 爬蟲 / 快取 ────────────────────────────────
export async function triggerScraperJob(jobType: 'mercari' | 'skunk')
  : Promise<AdminActionResult<{ jobId: string }>>;
```

---

## 9. UI/UX 藍圖（Wireframe 級 + Chart 建議）

> 全域須嚴守 `.stitch/designs/DESIGN.md`：不用 `#000000`、不用 `Inter`、彈簧物理動畫、高數據密度桌面優先。以下用 ASCII wireframe 表達佈局意圖。

### 9.1 平台監控大盤 `/admin`（升級版）
```
┌──────────────────────────────────────────────────────────────┐
│ 平台監控                              [今日▼] [7日] [30日] [自訂]│
├───────────────┬───────────────┬───────────────┬──────────────┤
│ GMV 總成交     │ 淨佣金收入     │ 活躍用戶 DAU   │ 今日成交筆數  │
│ HK$ 12.84M ▲8%│ HK$ 642K ▲5%  │ 284 ▲12       │ 63 ▼3        │
│ [稀疏走勢線]   │ [稀疏走勢線]   │ [稀疏走勢線]   │ [稀疏走勢線]  │
├───────────────┴───────────────┴───────┬───────────────────────┤
│ GMV 趨勢 (Area Chart, 30日)             │ 系統健康               │
│  ╱╲    ╱╲╱╲                            │ ● Supabase  42ms      │
│ ╱  ╲╱╲╱    ╲___                        │ ● Stripe    88ms      │
│ [面積漸層 · 品牌金]                      │ ● Mercari   210ms ⚠  │
├─────────────────────────────────────────┴───────────────────────┤
│ 即時交易牆 (Realtime)         │ 待辦聚合                        │
│ Pikachu AR   HK$1,200  剛剛   │ 🪪 待審 KYC        5           │
│ Charizard ex HK$8,900  1分前  │ ⚖️ 未處理爭議      2           │
│ ...                          │ 🗃️ 待審卡牌條目    3           │
└──────────────────────────────────────────────────────────────┘
```
**Chart 建議**：KPI 卡用 **Sparkline（稀疏走勢線）**；主圖用 **Area Chart（面積圖，品牌金漸層）**；用 `recharts`（專案已裝 `recharts@3.8.0`）。

### 9.2 BI 分析中心 `/admin/analytics`
```
┌──────────────────────────────────────────────────────────────┐
│ 交易漏斗 (Funnel)          │ 留存曲線 (Retention Cohort)        │
│ 瀏覽    ██████████ 100%    │  100%●                            │
│ 加心願  ██████     58%     │       ╲___                        │
│ 出價    ███        31%     │            ╲______                │
│ 成交    █▌         14%     │  [折線 · 7日/30日 cohort]         │
│ 完成    █          11%     │                                   │
├────────────────────────────┴───────────────────────────────────┤
│ 商戶 GMV 排行 (Horizontal Bar)   │ 品類熱力 (Treemap / Heatmap)  │
│ 卡魂堂    ████████████ 3.2M      │ [SR][UR][PROMO] 色塊比例      │
│ 逸品社    ████████ 2.1M          │                              │
└──────────────────────────────────────────────────────────────┘
```
**Chart 建議**：漏斗用 **FunnelChart**；留存用多線 **LineChart (cohort)**；商戶排行用 **水平 BarChart**；品類用 **Treemap / Heatmap**。

### 9.3 爭議仲裁工作台 `/admin/disputes`
```
┌── 工單 Queue ──────────┬── 訂單時間軸還原 ─────────────────────┐
│ ● #DSP-021 詐騙  待處理 │ 付款 ✓ 07-18 14:02                    │
│ ○ #DSP-020 未收 調查中 │ 保管 ✓ 07-19 09:30                    │
│ ○ #DSP-019 假貨 已裁決 │ 鑑定 ⏳ 進行中                         │
│                        │ ─────────────────────────────────    │
│                        │ [聊天記錄] [金流憑證] [雙方評價]       │
│                        │ ┌─ 裁決 ───────────────────────────┐ │
│                        │ │ ○全額退款 ○部分退款 ○釋放賣家     │ │
│                        │ │ 理由: [_______________]  [確認裁決]│ │
│                        │ └───────────────────────────────────┘ │
└────────────────────────┴───────────────────────────────────────┘
```
每次「確認裁決」→ 寫 `audit_log` + 觸發對應 escrow RPC + Email 雙方。

### 9.4 用戶詳情 `/admin/users/[id]`
```
┌── 身分卡 ──────────────┬── 交易/信譽 ──────────────────────────┐
│ 頭像 · 顯示名 · HKCV-ID │ 完成交易 42 · 評分 4.8 · 舉報 1        │
│ 角色 [USER▼] 狀態 正常  │ [封禁] [重設密碼] [升級商戶]           │
├────────────────────────┴───────────────────────────────────────┤
│ Tabs: [訂單] [上架] [評價] [舉報記錄] [審計軌跡]                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 10. 建議實作 Roadmap

> 對齊 `requirement.md` 開發時間表：第 2–4 月「系統開發與 API 整合」。採 BaaS-Native 三維防線（DDL → generated types → 前端）。

| 階段 | 目標 | 交付項目 |
|---|---|---|
| **Sprint 1 (P0-a)** | 權限與 KYC 打通 | Middleware 硬守衛、`kyc_applications` migration、`reviewKyc` + 文件簽名 URL + Email |
| **Sprint 2 (P0-b)** | 用戶治理 + 監控 | `toggleUserBan` + Session 撤銷、`searchAdminUsers`、`getPlatformMetrics` 聚合 SQL |
| **Sprint 3 (P1-a)** | 爭議 + 審計 | `audit_log` migration、`/admin/disputes` 工作台、`resolveDispute` + escrow override |
| **Sprint 4 (P1-b)** | 營運 + 卡牌 | `platform_settings` CRUD、`/admin/users/[id]`、卡牌審批工作流 |
| **Sprint 5 (P2)** | BI + 風控 | `/admin/analytics`（recharts）、Realtime 交易牆、風控告警 queue |

**每階段門檻（測試馬具）**：`bunx tsc --noEmit` + `bun run lint` 全綠；admin action 覆蓋 e2e（參考 `e2e/` 現有 spec 模式）。

---

## 11. 附錄：檔案路徑索引

### 現有 Admin 實作
- `app/admin/layout.tsx` · `app/admin/page.tsx`
- `app/admin/approvals/page.tsx` · `app/admin/users/page.tsx`
- `app/admin/database/page.tsx` · `app/admin/settings/page.tsx`
- `app/components/admin/AdminNav.tsx`

### RBAC / Auth 地基
- `app/lib/types/rbac.ts`（`UserRole` / `KycStatus` / `ESCROW_STEPS`）
- `lib/auth/session.ts` · `lib/auth/roles.ts`
- `lib/supabase/admin.ts`（`createAdminClient()`）· `lib/supabase/middleware.ts`
- `app/actions/admin-member-orders.ts`（dev-only escrow RPC 模式參考）

### 文檔 SSOT
- `docs/requirement.md`（§1.9.5 管理員面板）
- `docs/Role-Based-Access-Control.md`（§3 ADMIN）
- `docs/dev/database.md`（enum / RLS / admin 表規劃）
- `docs/dev/server.md`（§6.5 admin action stubs）
- `docs/dev/api.md`（§8 admin API 契約）
- `docs/task.md`（Epic 7 管理員後台 · Tickets 52–57）

### 尚未存在（需新建）
- ⛔ `app/admin/users/[id]/page.tsx` · `app/admin/disputes/` · `app/admin/analytics/`
- ⛔ `app/actions/admin.ts`（生產級 admin actions）
- ⛔ migrations: `kyc_applications` / `platform_settings` / `audit_log`

---

*本文件為評估與規劃藍圖，所有 DDL / Action 簽名皆為草案，實作前須以 `docs/dev/` SSOT 及 Supabase generated types 為唯一真理源做精準適配。*
