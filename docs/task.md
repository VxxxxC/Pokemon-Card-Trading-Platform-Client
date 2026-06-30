# Pokémon PWA - Phase 1 (MVP) 完整開發任務清單

## Epic 1: 專案基礎建設與架構 (Foundation & Architecture)

### Story 1.1: 作為一個開發者，我需要一個設定好嘅 Next.js 專案環境，以便開始開發。

**Task 1.1.1: 初始化 Next.js 與核心套件**

- [x] Ticket 1: 使用 `create-next-app` 初始化 App Router 專案，設定 TypeScript、ESLint。✅ DONE
- [x] Ticket 2: 安裝及設定 Tailwind CSS，建立基礎嘅 Design Token (顏色、字體)。✅ DONE (暗金色主題)
- [x] Ticket 3: 設定 Prettier 同埋 Git Hooks (Husky) 以確保程式碼風格統一。✅ DONE

**Task 1.1.2: 設定 PWA 基礎 (@serwist/next)**

- [x] Ticket 4: 安裝 `@serwist/next` 及相關依賴。✅ DONE
- [x] Ticket 5: 設定 `next.config.mjs` 包裝 Serwist 配置。✅ DONE
- [x] Ticket 6: 建立 `app/serwist/[path]/route.ts` 處理 Service Worker 編譯。✅ DONE
- [x] Ticket 7: 設定基本嘅 `manifest.json` 並於 `layout.tsx` 加入 Metadata。✅ DONE

### Story 1.2: 作為一個開發者，我需要利用 Supabase 建立穩定嘅資料庫與權限架構。

**Task 1.2.1: 設定 Supabase Database 及 RLS**

- [ ] Ticket 8: 喺 Supabase 開新 Project，設定好 `.env.local` 嘅 URL 同 Keys。
- [ ] Ticket 9: 撰寫 SQL 建立 `profiles` Table (加入 `role` 欄位預設為 `USER`)、`listings` Table、`orders` Table。🔄 TODO [BACKEND]
  - _驗收標準（對齊前端真理源）：_
    - `listings` 必須包含 `item_type` 欄位，映射前端 `AddAssetModal.tsx` / `NewListingForm.tsx` 的 `itemType` 狀態，型別為 Postgres `ENUM('card', 'box_set')`（對應 BOX 橙色／SET 紫色徽章渲染）。
    - `listings` 必須包含 `condition` 欄位，映射前端 `selectedCondition` 狀態，型別為 `CHAR(1)` 並加上 `CHECK (condition IN ('A', 'B', 'C', 'D'))`（重構後的純字母品相分級）。
    - `listings` 必須包含級聯分級欄位 `grader`（`'RAW' | 'PSA' | 'CGC' | 'BGS' | 'ARS' | 'OTHER'`）與 `grade_score`（`TEXT`，容納 `10 (Black Label)` 等複合分數），映射前端 `selectedGrader` / `selectedScore`。
    - `listings.photos` 須以 `JSONB` 儲存 6 槽相片緩衝 `{ url, remark }[]`（新增商品強制 ≥ 2 張，最多 6 張）。
    - 完整 DDL 詳見 `docs/dev/database.md`。
- [ ] Ticket 10: 建立 Supabase Storage Bucket 名為 `listing-images` 供上載實物圖用。
- [ ] Ticket 11: 為 `listings` 設定 RLS：所有人可 SELECT，只有 `role = MERCHANT` 可 INSERT/UPDATE。
- [ ] Ticket 12: 為 `orders` 設定 RLS：只有買家本人，或該訂單對應嘅 MERCHANT 可 SELECT/UPDATE。🔄 TODO [BACKEND]
  - _驗收標準（全額付訖 Full Pay 鐵律）：_
    - `orders` 嚴禁設立任何 `deposit_paid` / `deposit_amount` / 成數定金欄位；全站 100% 全額託管。
    - 訂單狀態機 `escrow_status` 採用 Postgres `ENUM('payment', 'custody', 'shipped', 'grading', 'released', 'cancelled')`，精準映射前端 `app/lib/types/trading.ts` 的 `OrderStatus` 與 `ESCROW_STEPS` 5 階水平步進器。
    - RLS：`SELECT/UPDATE` 僅允許 `auth.uid() = buyer_id` 或 `auth.uid() = seller_id`；其餘角色一律 fail-closed 拒絕。
    - 訂單須記錄 `auth_fee`（可選 HK$150 鑑定增值費，由前端 `authServiceEnabled` toggle 帶入）作為獨立行項目，不得併入商品本金。
- [ ] Ticket 13: 為 Storage 設定 RLS：所有人可讀取圖片，只有 `role = MERCHANT` 可上載圖片。

---

## Epic 2: 卡牌數據庫串接 (Card Database Integration)

### Story 2.1: 作為一個賣家，我希望系統能自動帶出卡牌資料，節省我上架的輸入時間。

**Task 2.1.1: 串接外部日版卡牌 API 及快取至 Supabase**

- [ ] Ticket 14: 閱讀 TCGdex / JustTCG API 文件，使用 `fetch` 封裝基礎 API Client。🔄 TODO [API]
  - _驗收標準：_ Client 須同時支援單卡（`item_type='card'`）與盒組（`item_type='box_set'`）兩條查詢線，回傳格式需區分卡牌編號與擴充包系列，**不得**在多分類查詢時互相覆寫全域參數。
- [ ] Ticket 15: 撰寫根據「卡牌編號」(Card ID) 獲取卡牌詳細資料的函數。🔄 TODO [API]
  - _驗收標準：_ 函數簽章須接受 `itemType` 維度（對齊前端 `HeroSearch.tsx` 毫秒級 `card_number` 索引搜尋），盒組查詢回退至系列名稱模糊匹配。
- [ ] Ticket 16: 撰寫資料 mapping 邏輯，將外部 API 格式轉換為自家 Supabase `card_catalog` Table 格式。🔄 TODO [BACKEND]
  - _驗收標準：_ mapping 須寫入 `item_type` 分類欄位，並保留 `rarity`（`SAR | UR | SR | AR | CSR`）原生標籤，不得在寫入單卡時污染盒組快取列。

**Task 2.1.2: 實作 Supabase 快取機制與搜尋**

- [ ] Ticket 17: 搜尋卡牌時，先查詢自家 `card_catalog` Table (Cache) 🔄 TODO [BACKEND]。
  - _驗收標準：_ 快取查詢須以 `(item_type, card_number)` 複合鍵命中，多分類（card / box_set）查詢各自獨立分片，**嚴禁**單一全域 `query` 參數覆寫他類結果（對齊 `HeroSearch.tsx` 模糊搜尋與結構化篩選解耦線）。
- [ ] Ticket 18: 若自家無資料，Call 外部 API，並將結果 `insert` 落自家 `card_catalog` Table 後回傳 🔄 TODO [BACKEND]。
  - _驗收標準：_ 回填 (write-back) 時須帶 `item_type` 標記與 `needs_review` flag；多分類並發回填須以 `ON CONFLICT (item_type, card_number)` upsert，確保不同分類快取列互不踐踏。
- [x] Ticket 19: 建立前端「卡牌搜尋框」UI Component (包含輸入防抖 Debounce) ✅ DONE。
- [x] Ticket 20: 將搜尋結果以列表形式 (Dropdown) 呈現於前端，供表單選取 ✅ DONE。
- [x] **Ticket 20a [架構優化]: 實作大盤「模糊搜尋」與「結構化篩選」徹底解耦線** ✅ DONE
  - _驗收標準：_ 點擊首頁晶片或大盤側邊欄時，Filter 的 `query` 參數（如 `rarity=SAR`）直接與 Supabase 欄位映射對齊，**嚴禁污染或覆寫**前端全域輸入框字串 `query`。
- [x] **Ticket 20b [架構優化]: 實作全維度一鍵滿血重置（Reset All Filters）按鈕** ✅ DONE
  - _驗收標準：_ 點擊重置按鈕時，同步抹平前端文字框、清空多維 Checkbox 陣列矩陣、還原 URL 參數，使大盤秒速重回純淨 baseline 狀態。

---

## Epic 3: 賣家發佈與商品目錄 (Listing & Catalog)

### Story 3.1: 作為一個商戶，我希望能夠上傳實物照片並設定價格來發佈我的卡牌。

**Task 3.1.1: 建立上架商品表單 (Listing Form)**

- [ ] Ticket 21: 使用 `react-hook-form` + `zod` 建立上架表單（價格、卡牌狀態、備註）。🔄 TODO [FRONTEND] (UI 視覺存在於 `app/profile/merchant/inventory/page.tsx`，但未接 react-hook-form/zod)
- [ ] Ticket 22: 將「卡牌搜尋組件」整合入表單中，讓賣家綁定卡牌。🔄 TODO [FRONTEND] (視覺搜尋欄存在，但未真正綁定卡牌數據)
- [x] Ticket 23: 開發前端圖片選擇 Component（限制 0-6 張，新增商品強制最少上載 2 張，支援原生多圖預覽及一鍵刪除）。✅ DONE (`app/components/shared/AddAssetModal.tsx` 已內建完成，滿足收藏與上架圖片分流校準)

**Task 3.1.2: 處理商品發佈邏輯**

- [ ] Ticket 24: 撰寫邏輯使用 Supabase Client (`supabase.storage`) 將圖片上傳至 Bucket 並獲取 URLs。🔄 TODO [BACKEND]
- [ ] Ticket 25: 撰寫 Server Action 接收表單資料，**驗證用戶是否具備 MERCHANT 權限**，然後 `insert` 入 `listings`。🔄 TODO [BACKEND]
  - _驗收標準（對齊前端 payload 真理源）：_
    - Server Action 須接收並寫入 `item_type`（`'card' | 'box_set'`）、`condition`（`'A' | 'B' | 'C' | 'D'`）、`grader`、`grade_score`，以及 6 槽 `photos` JSONB（強制 ≥ 2 張）。
    - 寫入前須以 RLS 與 Server 端雙重驗證 `role = 'MERCHANT'` 且 `kyc_status = 'verified'`，fail-closed 拒絕越權上架。
    - 草稿與上架以 `status ENUM('draft', 'active', 'sold', 'pending')` 分流（對齊 `NewListingForm.tsx` 的「儲存草稿」/「立即上架」）。
- [ ] Ticket 26: 撰寫前端提交表單後的成功與失敗提示 (Toast) 及跳轉邏輯。🔄 TODO [FRONTEND] (2026-06-03：成功提交 toast 已於 `app/profile/user/inventory/page.tsx` 接入 Sonner；失敗提示與 redirect handler 仍待補完)
- [x] Ticket 27: 開發平台首頁與商品詳情頁，讀取 `listings` 表格並展示商品。✅ DONE (`app/marketplace/page.tsx` + `app/marketplace/[id]/page.tsx`，現接 mock 資料；2026-06-05 補完私域 storefront 與公共 marketplace 100% parity、私域篩選隔離及 `/marketplace/[id]/product/[productId]` 路由閉環)

---

## Epic 4: 用戶系統與認證 (Authentication & Roles)

### Story 4.1: 作為一個用戶，我希望可以安全咁註冊同登入，以便開始買賣。

**Task 4.1.1: 設定 Supabase Auth 初始化**

- [ ] Ticket 28: 安裝 `@supabase/ssr`，建立 Supabase Client Utility (Server/Client/Middleware)。
- [ ] Ticket 29: 寫 SQL Trigger：新用戶註冊時自動 insert 紀錄落 `profiles`，`role` 預設為 `USER`。
- [ ] Ticket 30: 設定 Google OAuth Provider (獲取 Client ID/Secret 並填入 Supabase)。

**Task 4.1.2: 前端登入介面與 Auth 邏輯**

- [x] Ticket 31: 製作「登入 / 註冊」頁面 UI (包含 Google 及 Email/密碼登入)。✅ DONE (`app/auth/page.tsx`)
- [x] Ticket 32a [前端]: 製作 signUp / signIn / 登出嘅前端表單 UI，含 loading state、error message 顯示、模擬提交流程。✅ DONE (`app/auth/AuthForm.tsx`，含 `setTimeout` 模擬)
- [ ] Ticket 32b [後端]: 將前端 handlers 接駁真實 Supabase `signUp`、`signInWithPassword` 及登出 Server Actions。🔄 TODO [BACKEND]
- [ ] Ticket 33: 撰寫 `middleware.ts` 攔截未登入用戶存取受保護路由 (如 `/dashboard`)。🔄 TODO [BACKEND]

### Story 4.2: 作為一般會員，我希望申請成為商戶 (KYC)。

**Task 4.2.1: 商戶入駐申請 (Merchant Application)**

- [x] Ticket 34: 製作「我的帳號」設定頁面 UI，允許用戶修改名稱與聯絡方式。✅ DONE (`app/profile/user/settings/page.tsx`)
- [x] Ticket 35a [前端]: 製作「個人資料編輯」表單 UI，含所有欄位 (姓名、電話等) 及 client-side 視覺。✅ DONE (`app/profile/user/settings/page.tsx`，含完整表單 UI)
- [ ] Ticket 35b [後端]: 撰寫 Server Action 去讀取及 `update` Supabase 嘅 `profiles` Table，替換現有硬碼 `defaultValue`。🔄 TODO [BACKEND]
- [x] Ticket 36: 喺 Profile 加入「申請成為商戶」表單 (收集店名、基本 KYC 證明文件上載)。✅ PARTIAL (UI 框架, KYC banner @ `app/profile/[id]/page.tsx` + KYC 申請表 @ `app/profile/user/settings/page.tsx`)
- [x] Ticket 37a [前端]: 製作 KYC 申請表單 UI，含店名輸入、文件上載視覺介面、申請狀態 banner。✅ DONE (`app/profile/user/settings/page.tsx` KYC section)
- [ ] Ticket 37b [後端]: 撰寫 Server Action 將用戶 `role` 轉為 `PENDING_MERCHANT` 並提交 KYC 資料至 Supabase。🔄 TODO [BACKEND]

---

## Epic 5: 購物金流 (Stripe Connect Integration)

### Story 5.1: 作為一個已審核商戶，我希望可以綁定 Stripe 戶口接收款項。

**Task 5.1.1: Stripe Connect 賣家入駐 (僅限 MERCHANT)**

- [ ] Ticket 38: 註冊 Stripe 帳號獲取 API Keys，安裝 `stripe-node`。🔄 TODO [API]
- [ ] Ticket 39: 寫 API：幫賣家建立 Express Account 並產生 Account Link (需驗證 `role === 'MERCHANT'`)。🔄 TODO [API]
- [x] Ticket 40: 製作前端 UI：若用戶是 `MERCHANT` 但未綁定 Stripe，顯示「綁定收款戶口」按鈕。✅ DONE (`app/profile/merchant/settings/page.tsx`)
- [x] Ticket 41a [前端]: 製作 Stripe Return URL 着陸頁 UI，顯示綁定成功／失敗狀態及下一步指引。✅ DONE (`app/marketplace/payment-status/page.tsx` 含成功/失敗雙態 UI)
- [ ] Ticket 41b [後端]: 處理 Stripe Return URL 回調，更新 Supabase `profiles` 嘅 `stripe_account_id`。🔄 TODO [API]

### Story 5.2: 作為一個買家，我希望可以安全地用信用卡畀錢買卡。

**Task 5.2.1: 結帳流程與 Webhook**

- [x] Ticket 42a [前端]: 製作結帳流程 UI，包含商品確認 Slide-over、價格明細展示、付款跳轉觸發按鈕。✅ DONE (`app/components/transactions/ExecutionSlideOver.tsx` + `app/marketplace/payment-status/page.tsx`；2026-06-07 已補強自動盲開房與實時交割狀態卡片追蹤技術)
- [x] **Ticket 42a-1 [前端]: Pre-Checkout 流程重大改版 — 啟用鑑定服務與多優惠券系統** ✅ DONE (2026-06-09)
  - _驗收標準：_
    - ✅ 安裝 shadcn/base UI `select` 與 `switch` 組件
    - ✅ 重新排序並重新編號 Pre-Checkout 表單左側 5 大步驟：(1) 核對現貨資產品相, (2) 選擇配送渠道, (3) 啟用鑑定服務 [NEW - Switch Toggle], (4) 使用優惠券 [NEW - Multi-Select Dropdown + Badge Tags], (5) 給賣家的特殊交割備註
    - ✅ 實作鑑定服務開關：開啟時自動加入 HK$150 鑑定費，並於訂單明細中單獨顯示「官方第三方鑑定費」行項目
    - ✅ 實作優惠券多選系統：從 3 張可用券證庫（`WELCOME-TCG-50`, `SF-FREE-DUANWU`, `VIP-DISCOUNT-100`）中選擇，已選券證以高對比黃金邊框 Badge Pills 形式渲染於下拉框下方，每張 Badge 配有 X 移除按鈕，並支援動態累加折扣總額
    - ✅ 右側財務明細動態同步：新增「官方第三方鑑定費」行、「券證及優惠碼折扣扣減」行精準反映當前選擇，最終總額公式更新為：`Math.max(itemSubtotal + shippingFee + authFee - totalDiscount, 0)`
    - ✅ 移除舊的單一優惠券輸入框（原右側 `套用全域平台優惠券` 區塊已完全移除並遷移至左側流程）
    - ✅ TypeScript 嚴格模式編譯通過：`bunx tsc --noEmit` 無 error
    - ✅ ESLint 審核通過：`bun run lint` 無 warning
  - _核心技術棧：_ shadcn/ui Base UI primitives (Select, Switch), React 19 controlled components, TypeScript strict mode
  - _檔案路徑：_ `app/checkout/[id]/page.tsx` (完整重寫 +204 lines)
- [ ] Ticket 42b [後端]: 於結帳頁整合真實 Stripe Payment Element，替換現有 mock 跳轉邏輯。🔄 TODO [API]
- [ ] Ticket 43: 寫 API 產生 PaymentIntent，計算平台抽佣，指定轉帳去賣家嘅 Stripe Account。🔄 TODO [API]
- [ ] Ticket 44: 建立 API Endpoint 接收 Stripe Webhook (設定 Raw Body 解析及驗證 Signature)。🔄 TODO [API]
- [ ] Ticket 45: Webhook 處理 `payment_intent.succeeded`：建立 `orders` 紀錄，update `listings` 狀態為已售出。🔄 TODO [API]
  - _驗收標準（全額付訖 Full Pay）：_
    - Webhook 收到全額 `payment_intent.succeeded` 後，原子化建立 `orders` 列並將 `escrow_status` 初始化為 `'custody'`（資金 100% 鎖定託管，無訂金分段）。
    - 同一交易內以 `FOR UPDATE` 行鎖將對應 `listings.status` 切換為 `'sold'`，RLS 阻擋重複付款。
    - 訂單金額須完整還原前端結算公式 `Math.max(itemSubtotal + shippingFee + authFee - totalDiscount, 0)`，並分列 `auth_fee`（HK$150 可選）與 `coupon_discount`。
- [x] Ticket 46: 製作前端「付款成功」及「付款失敗」嘅跳轉頁面。✅ DONE (`app/marketplace/payment-status/page.tsx`，含倒數自動跳轉、mock Stripe log，現接 mock 資料)

---

## Epic 6: 訂單狀態管理 (Order Management)

### Story 6.1: 作為買家/商戶，我希望可以睇到訂單進度，並提供物流追蹤。

**Task 6.1.1: 商戶出貨管理**

- [x] Ticket 47: 製作「我的銷售」頁面，讀取關聯該商戶嘅 orders (加入權限保護，僅 MERCHANT 可入)。✅ DONE (`app/profile/merchant/(dashboard)/trading/page.tsx`，含 Escrow 狀態欄、需要行動警示 banner，現接 mock 資料)
  - _後端對齊（全額付訖 Full Pay）：_ 讀取查詢須 `WHERE seller_id = auth.uid()`，Escrow 狀態欄直接綁定 `orders.escrow_status` 5 階 ENUM（`payment → custody → shipped → grading → released`，外加 `cancelled`），不得渲染任何訂金／分段付款欄位。
- [x] Ticket 48: 喺 UI 加入「輸入速遞單號 (Tracker Number) 並發貨」嘅表單。✅ DONE (`app/profile/merchant/sales/page.tsx` 內含追蹤單號輸入欄 UI)
- [x] Ticket 49a [前端]: 製作出貨動作按鈕 UI（「確認並準備發貨」、「確認發貨」）及追蹤單號輸入表單。✅ DONE (`app/profile/merchant/sales/page.tsx`)
- [ ] Ticket 49b [後端]: 撰寫 Server Action `update` `orders` Table 嘅出貨狀態及追蹤單號。🔄 TODO [BACKEND]

**Task 6.1.2: 買家訂單追蹤**

- [x] Ticket 50: 製作「我的購買」頁面，讀取買家本人嘅 orders。✅ DONE (`app/profile/user/(dashboard)/trading/page.tsx`，含三 Tab 訂單管理、EscrowStepper、SF 收件表單，現接 mock 資料)
  - _後端對齊（全額付訖 Full Pay）：_ 進行中查詢 `WHERE buyer_id = auth.uid() AND escrow_status NOT IN ('released', 'cancelled')`；已完成查詢 `WHERE escrow_status = 'released'`。EscrowStepper 嚴格映射全額託管 5 階 ENUM，杜絕訂金催付欄位。
- [x] Ticket 51: UI 顯示訂單狀態及商戶提供嘅 Tracker Number。✅ DONE (`app/profile/user/orders/page.tsx` 內 `OrderCard` 顯示狀態及單號欄位)

---

## Epic 7: 管理員後台 (Admin Panel)

### Story 7.1: 作為平台管理員，我需要監察數據、審核商戶同管理違規用戶。

**Task 7.1.1: Admin 權限與審核系統**

- [ ] Ticket 52: 更新 Middleware，確保 `/admin` 路由只有 `role === 'ADMIN'` 可以進入。🔄 TODO [BACKEND]
- [x] Ticket 53: 製作 Admin Dashboard UI，顯示基本總訂單數、總用戶數。✅ DONE (`app/admin/page.tsx` + mobile responsive，現接 mock 數據)
- [x] Ticket 54: 製作「商戶申請審核 (KYC)」頁面，列出所有 `PENDING_MERCHANT` 嘅用戶。✅ DONE (`app/admin/approvals/page.tsx`，含狀態 badges、查看文件按鈕，現接 mock 資料)
- [x] Ticket 55a [前端]: 製作「批准」及「拒絕」按鈕 UI，含確認 modal 及視覺 loading state。✅ DONE (`app/admin/approvals/page.tsx` 內批准/拒絕 CTA 存在)
- [ ] Ticket 55b [後端]: 撰寫 Server Action 允許 Admin 點擊「批准」，將該用戶 `role` 升級為 `MERCHANT`。🔄 TODO [BACKEND]

**Task 7.1.2: 用戶管理**

- [x] Ticket 56: 製作「全局用戶列表」頁面。✅ DONE (`app/admin/users/page.tsx` + mobile responsive，含搜尋欄、角色 badges、封禁按鈕 UI，現接 mock 資料)
- [x] Ticket 57a [前端]: 製作用戶「封禁」及「解封」按鈕 UI，含視覺狀態切換。✅ DONE (`app/admin/users/page.tsx` 內封禁/解封 CTA 存在)
- [ ] Ticket 57b [後端]: 撰寫 Server Action 允許 Admin 將用戶停權 (標記 `is_banned` = true)。🔄 TODO [BACKEND]

---

## Epic 8: PWA 與 UI 完善 (PWA & Polish)

### Story 8.1: 作為手機用戶，我希望體驗流暢而且可以裝喺主畫面。

**Task 8.1.1: 響應式與 PWA 安裝**

- [x] Ticket 58a [前端]: 準備並放入 `192x192` 及 `512x512` PWA App Icons。✅ DONE (`public/icons/icon-192.svg` + `icon-512.svg` 已存在)
- [ ] Ticket 58b [資源]: 補充 Apple Touch Icon (`apple-touch-icon.png`) 並更新 `manifest.json` 加入所有圖示路徑。🔄 TODO [ASSETS]
- [x] Ticket 59: 實作自訂「安裝到主畫面」按鈕 (監聽 `beforeinstallprompt`)。✅ DONE (`app/lib/hooks/usePwaInstall.ts` singleton hook + `app/components/pwa/PwaHeroInstallButton.tsx`)
- [x] Ticket 60: 調整全站 Bottom Navigation Bar，確保手機操作體驗接近原生 App。✅ DONE (重構為黃金 5 欄位對稱大底座，正中央高亮實心錨定「＋」號上架快捷掣，並加入「交易管理」導航完美對齊比例)
- [x] Ticket 61: 修正 iOS Safari 點擊表單輸入框意外放大的問題 (`user-scalable=no`)。✅ DONE (`app/layout.tsx`)

---

## Epic 9: 測試與上線 (Testing & Deployment)

### Story 9.1: 作為產品擁有者，我需要確保平台穩定先推畀公眾用。

**Task 9.1.1: 部署與正式環境準備**

- [ ] Ticket 62: 連結 GitHub 儲存庫至 Vercel 進行自動化部署。
- [ ] Ticket 63: 於 Supabase 建立 Production 專案，轉移 Database Schema，並設定 Vercel 環境變數。

**Task 9.1.2: E2E 驗收測試 (UAT)**

- [ ] Ticket 64: UAT 流程 A：註冊帳號 -> 申請成為商戶 -> Admin 審核 -> 綁定 Stripe -> 上架卡牌。
- [ ] Ticket 65: UAT 流程 B：另一帳號登入 -> 搜尋商品 -> Stripe 結帳 -> Webhook 更新訂單 -> 商戶發貨。
- [ ] Ticket 66: 修復測試階段發現的 Critical Bugs，準備正式上線。
