# Admin Panel Revamp — 工作匯報

**日期**：2026-07-25
**範圍**：純前端 Mock 重構 + Admin Override 唯讀權限
**驗證結果**：`tsc --noEmit` ✅ · `lint` ✅ 0 errors · `bun run build` ✅ Compiled successfully

---

## 一、核心背景發現

開工前經兩組 explore agent 全面偵察，確認以下事實（影響全部決策）：

| 發現 | 說明 |
|---|---|
| Admin 三頁 100% Mock | `initialWithdrawals` / `initialMerchantAccounts` / `initialStripeRecords` 全為硬編碼 array，**零 Supabase 接駁、零 server action** |
| 關鍵 DB Table 不存在 | `payout_requests` · `stripe_connect_accounts` · `kyc_applications` · `audit_logs` · `platform_settings` **全部無 migration、無 generated type** |
| 真實可用的替代表 | `kyc_records`（1:1，僅 `kyc_status` + `stripe_account_id`）、`merchant_ledgers`（有 `stripe_transfer_id` / `order_id` / `transaction_type`，但**全 repo 無人讀寫**） |
| 訂單分兩張表 | `member_orders`（P2P → `profile/user/orderDetail`）、`merchant_orders`（B2C → `profile/merchant/orderDetail`） |
| orderDetail 為真 Supabase | 但 resolve 邏輯 scoped 死（`participantFilter` / `.eq("merchant_id")`），Admin 進入必然 fetch 失敗 |
| 路由守衛已就緒 | `proxy.ts` + `isPathAllowedForRole` 已允許 ADMIN 進入 `/profile/**`，**毋須改 middleware** |

---

## 二、變更明細

```
 app/actions/orders.ts                   |   42 +-
 app/admin/dashboard/DashboardClient.tsx |  408 +--   (786 → 598 行)
 app/admin/merchants/page.tsx            | 1109 +--   (1457 → 788 行)
 app/admin/payouts/page.tsx              |  911 ++    (1069 → 1446 行)
 lib/member-order/resolve-order-id.ts    |   86 +-
 lib/merchant-order/resolve-order-id.ts  |   52 +-
 lib/supabase/admin.ts                   |    9 +     (僅 TODO 註解)
 lib/auth/require-admin.ts               |   NEW
```

### Phase 1｜數據總覽 `app/admin/dashboard/DashboardClient.tsx`

**核心營收與 GMV KPI — 橫向 scroll → 上下兩張卡**
- 移除 `overflow-x-auto` / `snap-x` 容器、`lg:grid-cols-2`、mobile「n / 2 卡片」分頁指示器及其 `useRef` + scroll handler
- 改為 `flex flex-col gap-6`（手機桌面一致）
- **卡 A 平台淨營收統計** → 上下兩層：**上＝佣金**（累計純佣金收入 hero + 佣金率 badge + 本月佣金）／**下＝鑑定費用**（鑑定費總額 + 已鑑定卡數 + 單件鑑定費），中間 `border-t border-white/[0.08]` 分隔
- 🗑️ 刪除「專項鎖定資金池總量」「流動結算資金池 / Payout Pool」及 `netPayoutPool` mock 欄位，TODO 註解已移除 `payout_requests` 參考
- **卡 B 交易量分析** → 扁平化為恰好 3 個指標：`總成交` / `成交量` / `現貨總數`
- 🗑️ 刪除 collapsible「賣方現貨池」按鈕與面板、`isPoolOpen` state、`ChevronDown/Up` / `Building2` import 及全部子指標

**用戶生態大盤**
- 🗑️ 刪除右欄 3 張 cohort 卡、`selectedCohort` state、`<Cell onClick>` selection 邏輯
- ✅ 保留 recharts donut PieChart（改 `max-w-2xl mx-auto` 置中放大）、Tooltip、中心標籤、分段進度條、pills
- ✅ 保留「商戶審核隊列：118 件待審核 → 前往審核商戶」
- 🔗 路由修正：`/admin/merchants?tab=onboarding` → `/admin/merchants`

**SECTION 3（系統運作狀態 + 緊急警報 banner）零改動。**

---

### Phase 2｜財務結算 `app/admin/payouts/page.tsx`

**共用基建（新增）**
- `SortableHeader` — 三態排序（none → asc → desc），`ChevronsUpDown` / `ChevronUp` / `ChevronDown`
- `FilterChips` — 樣式完全沿用原 merchants 頁 pill，帶筆數
- 資料鏈：`raw → filter chip → search → sort → paginate`（全 `useMemo`）
- 任何 filter / search / sort 變動 → `setPage(1)` **且**清空 selection Set（消除 stale-selection 誤批處理風險）

**FPS 批次處理**
- 模型擴充 `orderId`(UUID) + `orderNumber`(`ORD-2026-XXXXXX`)，20 筆 mock **嚴格 1:1 唯一**（反洗錢逐單追蹤）
- ➕ `[訂單號]` column（緊接提現單號）
- ➕ Sorting：`用戶名稱`(localeCompare zh-HK) · `提交時間`
- ➕ Filter Chips：`全部` / **`未完成`（default）** / `已完成` / `已駁回`
- ➕ `[查看訂單]` → `/profile/user/orderDetail/{orderNumber}`
- CSV 加入訂單號

**商戶流水 (Stripe)** — 改為「每條流水 ＝ 一張獨立訂單」
- 介面更名 `MerchantStripeFlow`，新增 `stripeTransferId` / `orderId` / `orderNumber` / `createdAt`
- ➕ `[Stripe流水號]`（第一個資料 column）、`[訂單號]`、`[建立日期]`、`[操作]`
- ➖ 移除 `[帳戶狀態]` column 及 `status` 欄位
- 🔤 `帳戶餘額 (Balance)` → `帳戶餘額`；`已分賬總額 (Payouts)` → `分賬總額`；`平台 5% 佣金分成` → `平台分成`
- ➕ Sorting：`商戶名稱` · `建立日期`（依你指示與 FPS 一致）
- ➕ `[查看訂單]` → `/profile/merchant/orderDetail/{orderNumber}`
- 依決定 (a)：`帳戶餘額 / 分賬總額 / 平台分成` 為**商戶層級**數值，同商戶多行刻意重複，mock 已確保同一商戶數值一致無衝突
- TODO 目標更新為 `merchant_ledgers, merchant_orders, profiles`，並註明 `stripe_transfer_id` / `order_id` **實際 schema 已存在**

---

### Phase 3｜商戶與 KYC 審查 `app/admin/merchants/page.tsx`

- ➖ **移除 Tab Switcher**：`activeTab` state、`useSearchParams`、`?tab=` deep-link、`MerchantsPageContentWithKey` remount wrapper、`<Suspense>`
- ➖ **完整移除「商戶入駐審核」**：interface / 20 筆 mock / approve·reject·batch handlers / 全部 JSX / filter pills / pagination
  > 理由註解：通過 Stripe KYC 即自動 trigger webhook 註冊商戶，故毋須人工入駐審核流程
- ✅ **「管理員特權覆寫面板」100% 原封保留**（依你指示）：`isOverrideOpen`、`OverrideAuditLog`、`initialAuditLogs`、`handleExecuteOverride`、framer-motion modal JSX、已 comment out 的 trigger — 全部未動
- ➕ Filter Chips：`全部` / **`待審核`（default）** / `已認證` / `已拒絕`
- 🔄 `kycStatus` 對齊 DB enum `kyc_state`：`restricted` → **`rejected`**（`"verified" | "pending" | "rejected"`），badge 綠/金/紅
- ➖ 移除 `提現權限`(`payoutStatus`) · `成交筆數 · 評分`(`totalTrades`/`rating`)
- ➕ `電郵` column（Handle 與 Stripe Account ID 之間），納入 search
- 副標題更新為「管理 Stripe KYC 認證狀態 — 通過 KYC 即自動註冊為認證商戶」

---

### Phase 4｜Admin Override 訂單查看權限

**新增** `lib/auth/require-admin.ts` → `isCurrentUserAdmin(supabase, userId)` 讀 `profiles.role === 'admin'`

**Resolver 加 admin bypass**
- `lib/member-order/resolve-order-id.ts`：新增 `withParticipantScope()` helper + `ResolveMemberOrderIdOptions.adminOverride`
- `lib/merchant-order/resolve-order-id.ts`：新增 `withMerchantScope()` helper + `ResolveMerchantOrderIdOptions.adminOverride`
- ⚠️ `adminOverride === false` 時查詢鏈與原版產生**完全相同的 SQL**（SA 已逐行驗證零回歸）

**Server Action 分支**（`app/actions/orders.ts`）
- `getMemberOrderDetail` / `getMerchantOrderDetail` 加入：
  ```ts
  const isAdminViewer = await isCurrentUserAdmin(supabase, user.id); // 用「使用者 RLS client」判定，無法偽造
  const db = isAdminViewer ? (createAdminClient() as unknown as typeof supabase) : supabase;
  ```
- ownership check 改為 `if (!isAdminViewer && ...)`
- **僅限唯讀**：`cancelMemberOrder` / `completeMemberOrder` / `submitInboundTracking` 等所有 mutation **維持原樣使用者 RLS**，service-role 未外洩

**留下的 TODO tag**
| 檔案 | Tag |
|---|---|
| `lib/supabase/admin.ts` | `TODO: [Admin RLS]` — 需 migration 補 `is_admin()` SECURITY DEFINER + `member_orders`/`merchant_orders` admin bypass policy |
| `app/actions/orders.ts` | `TODO: [Admin Override]` ×3 — service-role 暫代 RLS；另註 admin 非交易方會被視為賣方視角，日後應加獨立 admin 唯讀 persona |
| `lib/auth/require-admin.ts` | `TODO: [Admin Guard]` — 待統一 `requireAdmin()` 於所有 admin server action 強制執行 |

---

## 三、SA 審查結果（第 1 輪即通過）

| 維度 | 結果 |
|---|---|
| 功能完整性 | ✅ 100%，無遺漏需求 |
| 安全性 / Admin Override | ✅ 100% Pass |
| 設計系統符合度 | ⚠️ 3 項 should-fix（已全部 hotfix） |
| **🔴 Blocker** | **0 個** |

**安全稽核逐項通過**
- `createAdminClient` 經 import graph 追蹤 **絕無**被任何 `"use client"` 元件直接/間接引用
- Admin 分支嚴格唯讀，`db` 未洩漏入任何 mutation path
- `isCurrentUserAdmin` 使用使用者 JWT session client 判定，無法被非管理員偽造
- 非 admin 路徑行為與原版 byte-for-byte 一致
- Mock `orderNumber` 全數通過 `MEMBER_ORDER_NUMBER_RE` (`/^ORD-\d{4}-[A-Z0-9]{6}$/i`) 校驗 → 查看訂單跳轉可正確解析

**已套用的 3 項 hotfix**
1. **FPS CSV 導出過濾器不一致** — 全量導出原本硬編碼 `status === "pending"`，改為跟隨當前 `sortedWithdrawals`
2. **`100vh` → `100dvh`** — `payouts:873` 與 `merchants:325`，修正 iOS Safari 視窗災難（DESIGN.md 版面原則第 5 條）
3. **觸控目標 < 44px** — 銷帳/駁回按鈕(`h-7`)、兩頁 pagination 按鈕(`h-8`)、Filter Chips(`py-1`)、merchants 圖示按鈕，全部補上 `min-h-[44px]` / `min-w-[44px]`

---

## 四、待跟進事項

| # | 項目 | 優先級 |
|---|---|---|
| 1 | **建立 admin 相關 DDL + RLS**：`payout_requests`(FPS 提現單，需 FK 到 `member_orders`)、`platform_settings`、`audit_logs`；Stripe 流水應直接讀 `merchant_ledgers` | 高 |
| 2 | **落地 `is_admin()` SECURITY DEFINER + admin bypass policy**，移除 `app/actions/orders.ts` 的 service-role 暫代方案 | 高 |
| 3 | **統一 `requireAdmin()` 守衛**：目前 admin 保護僅靠 `proxy.ts` 路由層，server action 層無角色斷言 | 高 |
| 4 | **Admin 唯讀 persona**：admin 查看 member order 時 `mapMemberOrderDetailRow` 會誤判為賣方視角(`persona = "sell"`) | 中 |
| 5 | **Stripe SDK / webhook 完全缺失**：repo 無 `stripe` 依賴、無 `app/api/webhooks/**`，「KYC 通過自動註冊商戶」的 webhook 尚未存在 | 中 |
| 6 | **`merchants` 特權覆寫面板**：仍為 dead code（trigger 已 comment out），待你決定啟用或刪除 | 低 |
| 7 | **DashboardClient 語義色 token**：`text-emerald-400` / `bg-rose-600` 等原生 Tailwind 色（**改動前已存在**，非本次引入），可統一為 `text-success` / `text-warning` | 低 |
| 8 | **文件漂移**：`ADMIN_BACKEND_ASSESSMENT.md` 仍記載已不存在的 `/admin/approvals`、`/admin/users`、`/admin/database` 路由，且宣稱 `UserRole` 含 `PENDING_MERCHANT`（DB enum 實為 `admin \| merchant \| member`） | 低 |

---

## 五、注意

`opencode.json` 於工作區顯示為 modified（`claude-opus-4.8` → `claude-opus-5`）。**此改動並非本次任務產生**，請自行確認是否需要保留或還原。
