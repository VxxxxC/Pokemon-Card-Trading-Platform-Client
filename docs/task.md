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
- [ ] Ticket 9: 撰寫 SQL 建立 `profiles` Table (加入 `role` 欄位預設為 USER)、`listings` Table、`orders` Table。
- [ ] Ticket 10: 建立 Supabase Storage Bucket 名為 `listing-images` 供上載實物圖用。
- [ ] Ticket 11: 為 `listings` 設定 RLS：所有人可 SELECT，只有 `role = MERCHANT` 可 INSERT/UPDATE。
- [ ] Ticket 12: 為 `orders` 設定 RLS：只有買家本人，或該訂單對應嘅 MERCHANT 可 SELECT/UPDATE。
- [ ] Ticket 13: 為 Storage 設定 RLS：所有人可讀取圖片，只有 `role = MERCHANT` 可上載圖片。

---

## Epic 2: 卡牌數據庫串接 (Card Database Integration)

### Story 2.1: 作為一個賣家，我希望系統能自動帶出卡牌資料，節省我上架的輸入時間。
**Task 2.1.1: 串接外部日版卡牌 API 及快取至 Supabase**
- [ ] Ticket 14: 閱讀 TCGdex / JustTCG API 文件，使用 `fetch` 封裝基礎 API Client。
- [ ] Ticket 15: 撰寫根據「卡牌編號」(Card ID) 獲取卡牌詳細資料的函數。
- [ ] Ticket 16: 撰寫資料 mapping 邏輯，將外部 API 格式轉換為自家 Supabase `cards` Table 格式。

**Task 2.1.2: 實作 Supabase 快取機制與搜尋**
- [ ] Ticket 17: 撰寫 API Route：搜尋卡牌時，先查詢自家 `cards` Table (Cache)。
- [ ] Ticket 18: 若自家無資料，Call 外部 API，並將結果 `insert` 落自家 `cards` Table 後回傳。
- [ ] Ticket 19: 建立前端「卡牌搜尋框」UI Component (包含輸入防抖 Debounce)。
- [ ] Ticket 20: 將搜尋結果以列表形式 (Dropdown) 呈現於前端，供表單選取。

---

## Epic 3: 賣家發佈與商品目錄 (Listing & Catalog)

### Story 3.1: 作為一個商戶，我希望能夠上傳實物照片並設定價格來發佈我的卡牌。
**Task 3.1.1: 建立上架商品表單 (Listing Form)**
- [ ] Ticket 21: 使用 `react-hook-form` + `zod` 建立上架表單（價格、卡牌狀態、備註）。
- [ ] Ticket 22: 將「卡牌搜尋組件」整合入表單中，讓賣家綁定卡牌。
- [ ] Ticket 23: 開發前端圖片選擇 Component（限制 4-6 張，支援預覽）。

**Task 3.1.2: 處理商品發佈邏輯**
- [ ] Ticket 24: 撰寫邏輯使用 Supabase Client (`supabase.storage`) 將圖片上傳至 Bucket 並獲取 URLs。
- [ ] Ticket 25: 撰寫 Server Action 接收表單資料，**驗證用戶是否具備 MERCHANT 權限**，然後 `insert` 入 `listings`。
- [ ] Ticket 26: 撰寫前端提交表單後的成功與失敗提示 (Toast) 及跳轉邏輯。
- [ ] Ticket 27: 開發平台首頁與商品詳情頁，讀取 `listings` 表格並展示商品。

---

## Epic 4: 用戶系統與認證 (Authentication & Roles)

### Story 4.1: 作為一個用戶，我希望可以安全咁註冊同登入，以便開始買賣。
**Task 4.1.1: 設定 Supabase Auth 初始化**
- [ ] Ticket 28: 安裝 `@supabase/ssr`，建立 Supabase Client Utility (Server/Client/Middleware)。
- [ ] Ticket 29: 寫 SQL Trigger：新用戶註冊時自動 insert 紀錄落 `profiles`，`role` 預設為 `USER`。
- [ ] Ticket 30: 設定 Google OAuth Provider (獲取 Client ID/Secret 並填入 Supabase)。

**Task 4.1.2: 前端登入介面與 Auth 邏輯**
- [x] Ticket 31: 製作「登入 / 註冊」頁面 UI (包含 Google 及 Email/密碼登入)。✅ DONE (app/auth/page.tsx)
- [ ] Ticket 32: 撰寫 Server Actions 處理 `signUp`、`signInWithPassword` 及登出。🔄 TODO [BACKEND]
- [ ] Ticket 33: 撰寫 `middleware.ts` 攔截未登入用戶存取受保護路由 (如 `/dashboard`)。🔄 TODO [BACKEND]

### Story 4.2: 作為一般會員，我希望申請成為商戶 (KYC)。
**Task 4.2.1: 商戶入駐申請 (Merchant Application)**
- [x] Ticket 34: 製作「我的帳號」設定頁面 UI，允許用戶修改名稱與聯絡方式。✅ DONE (app/profile/user/settings/page.tsx)
- [ ] Ticket 35: 撰寫 Server Action 去讀取及 `update` Supabase 嘅 `profiles` Table。🔄 TODO [BACKEND]
- [x] Ticket 36: 喺 Profile 加入「申請成為商戶」表單 (收集店名、基本 KYC 證明文件上載)。✅ PARTIAL (UI 框架, KYC banner @ app/profile/[id]/page.tsx)
- [ ] Ticket 37: 撰寫 Server Action 將用戶 `role` 轉為 `PENDING_MERCHANT`，並提交 KYC 資料。🔄 TODO [BACKEND]

---

## Epic 5: 購物金流 (Stripe Connect Integration)

### Story 5.1: 作為一個已審核商戶，我希望可以綁定 Stripe 戶口接收款項。
**Task 5.1.1: Stripe Connect 賣家入駐 (僅限 MERCHANT)**
- [ ] Ticket 38: 註冊 Stripe 帳號獲取 API Keys，安裝 `stripe-node`。🔄 TODO [API]
- [ ] Ticket 39: 寫 API：幫賣家建立 Express Account 並產生 Account Link (需驗證 `role === 'MERCHANT'`)。🔄 TODO [API]
- [x] Ticket 40: 製作前端 UI：若用戶是 `MERCHANT` 但未綁定 Stripe，顯示「綁定收款戶口」按鈕。✅ DONE (app/profile/merchant/settings/page.tsx)
- [ ] Ticket 41: 處理 Stripe Return URL，更新 Supabase `profiles` 嘅 `stripe_account_id`。🔄 TODO [API]

### Story 5.2: 作為一個買家，我希望可以安全地用信用卡畀錢買卡。
**Task 5.2.1: 結帳流程與 Webhook**
- [ ] Ticket 42: 製作結帳頁面 UI，整合 Stripe Payment Element。
- [ ] Ticket 43: 寫 API 產生 PaymentIntent，計算平台抽佣，指定轉帳去賣家嘅 Stripe Account。
- [ ] Ticket 44: 建立 API Endpoint 接收 Stripe Webhook (設定 Raw Body 解析及驗證 Signature)。
- [ ] Ticket 45: Webhook 處理 `payment_intent.succeeded`：建立 `orders` 紀錄，update `listings` 狀態為已售出。
- [ ] Ticket 46: 製作前端「付款成功」及「付款失敗」嘅跳轉頁面。

---

## Epic 6: 訂單狀態管理 (Order Management)

### Story 6.1: 作為買家/商戶，我希望可以睇到訂單進度，並提供物流追蹤。
**Task 6.1.1: 商戶出貨管理**
- [ ] Ticket 47: 製作「我的銷售」頁面，讀取關聯該商戶嘅 orders (加入權限保護，僅 MERCHANT 可入)。
- [ ] Ticket 48: 喺 UI 加入「輸入速遞單號 (Tracker Number) 並發貨」嘅表單。
- [ ] Ticket 49: 撰寫 Server Action `update` `orders` Table 嘅出貨狀態及單號。

**Task 6.1.2: 買家訂單追蹤**
- [ ] Ticket 50: 製作「我的購買」頁面，讀取買家本人嘅 orders。
- [ ] Ticket 51: UI 顯示訂單狀態及商戶提供嘅 Tracker Number。

---

## Epic 7: 管理員後台 (Admin Panel)

### Story 7.1: 作為平台管理員，我需要監察數據、審核商戶同管理違規用戶。
**Task 7.1.1: Admin 權限與審核系統**
- [ ] Ticket 52: 更新 Middleware，確保 `/admin` 路由只有 `role === 'ADMIN'` 可以進入。🔄 TODO [BACKEND]
- [x] Ticket 53: 製作 Admin Dashboard UI，顯示基本總訂單數、總用戶數。✅ DONE (app/admin/page.tsx + mobile responsive)
- [x] Ticket 54: 製作「商戶申請審核 (KYC)」頁面，列出所有 `PENDING_MERCHANT` 嘅用戶。✅ DONE (app/admin/approvals/page.tsx)
- [ ] Ticket 55: 撰寫 Server Action 允許 Admin 點擊「Approve」，將該用戶 `role` 升級為 `MERCHANT`。🔄 TODO [BACKEND]

**Task 7.1.2: 用戶管理**
- [x] Ticket 56: 製作「全局用戶列表」頁面。✅ DONE (app/admin/users/page.tsx + mobile responsive)
- [ ] Ticket 57: 撰寫 Server Action 允許 Admin 將用戶停權 (標記 `is_banned` = true)。🔄 TODO [BACKEND]

---

## Epic 8: PWA 與 UI 完善 (PWA & Polish)

### Story 8.1: 作為手機用戶，我希望體驗流暢而且可以裝喺主畫面。
**Task 8.1.1: 響應式與 PWA 安裝**
- [ ] Ticket 58: 準備並放入所有尺寸嘅 PWA App Icons (`192x192`, `512x512`, Apple Touch Icon)。🔄 TODO [ASSETS]
- [ ] Ticket 59: 實作自訂「安裝到主畫面」按鈕 (監聽 `beforeinstallprompt`)。🔄 TODO [PWA]
- [x] Ticket 60: 調整全站 Bottom Navigation Bar，確保手機操作體驗接近原生 App。✅ DONE (浮動液體玻璃選項卡欄)
- [x] Ticket 61: 修正 iOS Safari 點擊表單輸入框意外放大的問題 (`user-scalable=no`)。✅ DONE (app/layout.tsx)

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