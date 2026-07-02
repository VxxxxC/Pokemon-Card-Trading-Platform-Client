# 🏛️ HKCardVault 後端整合大藍圖 (Backend Integration Masterplan)

> **文件性質：** 中央治理路線圖（Governance Roadmap）｜**狀態：** Phase 2 後端對接啟動前的單一真理源 (SSOT)
> **適用範圍：** 由前端沙盒 Mockup 過渡至 Supabase + Stripe Connect 生產環境
> **黃金鐵律：** 全額付訖（100% Full Pay，嚴禁訂金）｜品味字母品相（A/B/C/D）｜分類分片（card / box_set）｜Fail-Closed RLS
>
> **配套參考手冊：**
> - 資料庫 DDL 與 RLS → [`docs/dev/database.md`](docs/dev/database.md)
> - API 路由登記冊 → [`docs/dev/api.md`](docs/dev/api.md)
> - Stripe 託管生命週期 → [`docs/dev/server.md`](docs/dev/server.md)
> - MVP 任務清單 → [`docs/task.md`](docs/task.md)

---

## 📊 1. 模組化資料庫欄位映射大表 (Master Database Mapping Ledger)

下表將每個前端 state 變數，精準映射至其對應的 Supabase 資料表、欄位鍵、原生型別、可空性與外鍵關係。

### 1.1 商品上架分片（`AddAssetModal.tsx` / `NewListingForm.tsx` ➔ `listings`）

| 前端 State 變數 | Supabase 表.欄位 | 原生型別 | 可空 | 外鍵 / 約束 |
|-----------------|------------------|----------|:----:|-------------|
| `itemType` | `listings.item_type` | `ENUM('card','box_set')` | NO | — |
| `cardQuery` / `name` | `listings.name` | `TEXT` | NO | — |
| （單卡編號） | `listings.card_no` | `TEXT` | YES | box_set 可空 |
| `set` | `listings.series_set` | `TEXT` | YES | — |
| `selectedGrader` | `listings.grader` | `ENUM('RAW','PSA','CGC','BGS','ARS','OTHER')` | NO | 預設 `RAW` |
| `selectedScore` | `listings.grade_score` | `TEXT` | YES | 容納 `10 (Black Label)` |
| `selectedCondition` | `listings.condition` | `ENUM('A','B','C','D')` | NO | 預設 `A` |
| `conditionDesc` | `listings.condition_desc` | `TEXT` | YES | — |
| `sellingPrice` | `listings.selling_price` | `NUMERIC(12,2)` | NO | `CHECK >= 0` |
| `photos` / `merchPhotos` | `listings.photos` | `JSONB`（6 槽 `{url,remark}`） | NO | active 強制 ≥ 2 張 |
| `isActiveListing` | `listings.status` | `ENUM('draft','active','sold','pending')` | NO | — |
| （上架者） | `listings.seller_id` | `UUID` | NO | `→ profiles.id` |

### 1.2 收藏愛好模式（`AddAssetModal.tsx` hobby ➔ `user_collections`）

| 前端 State 變數 | Supabase 表.欄位 | 原生型別 | 可空 | 外鍵 / 約束 |
|-----------------|------------------|----------|:----:|-------------|
| `purchasePrice` | `user_collections.purchase_price` | `NUMERIC(12,2)` | NO | 收藏專屬 |
| `currentValue` | `user_collections.current_value` | `NUMERIC(12,2)` | NO | 市價快照 |
| `images` | `user_collections.photos` | `JSONB` | NO | — |
| `isHobbyOnly` | （分流寫入 `user_collections`） | — | — | — |

### 1.3 議價聊天艙（`useHkCardVaultStore.ts` ➔ `messages` / `chat_rooms`）

| 前端 State 變數 | Supabase 表.欄位 | 原生型別 | 可空 | 外鍵 / 約束 |
|-----------------|------------------|----------|:----:|-------------|
| `ChatRoom.id`（確定性房號） | `chat_rooms.id` | `TEXT` (PK) | NO | 雙向對稱雜湊 |
| `buyerId` | `chat_rooms.buyer_id` | `UUID` | NO | `→ profiles.id` |
| `sellerId` | `chat_rooms.seller_id` | `UUID` | NO | `→ profiles.id` |
| `Message.sender` | `messages.sender_role` | `ENUM('me','them','system')` | NO | — |
| `Message.type` | `messages.type` | `ENUM('text','special_transaction')` | NO | 預設 `text` |
| `Message.text` | `messages.body` | `TEXT` | NO | — |
| `SpecialTransactionData.cardId` | `messages.offer_card_id` | `TEXT` | YES | — |
| `SpecialTransactionData.cardName` | `messages.offer_card_name` | `TEXT` | YES | — |
| `SpecialTransactionData.offerPrice` | `messages.offer_price` | `NUMERIC(12,2)` | YES | — |
| `initialStatus` | `messages.offer_status` | `ENUM('pending','accepted','rejected','countered')` | YES | — |
| `room_id` | `messages.room_id` | `TEXT` | NO | `→ chat_rooms.id` |

### 1.4 託管結帳核心（`checkout/[id]/page.tsx` ➔ `orders`）

| 前端 State 變數 | Supabase 表.欄位 | 原生型別 | 可空 | 外鍵 / 約束 |
|-----------------|------------------|----------|:----:|-------------|
| `mockTxnCode` | `orders.ledger_code` | `TEXT` (UNIQUE) | NO | `TXN-HKCV-{id}-{seq}` |
| （訂單狀態） | `orders.escrow_status` | `ENUM('payment','custody','shipped','grading','released','cancelled')` | NO | 預設 `payment` |
| `itemSubtotal` | `orders.item_subtotal` | `NUMERIC(12,2)` | NO | `CHECK >= 0` |
| `shippingFee` | `orders.shipping_fee` | `NUMERIC(12,2)` | NO | SF=30 / meetup=0 |
| `authFee` | `orders.auth_fee` | `NUMERIC(12,2)` | NO | 可選 HK$150 |
| `totalDiscount` | `orders.coupon_discount` | `NUMERIC(12,2)` | NO | Σ 多券累加 |
| `finalTotal` | `orders.total_amount` | `NUMERIC(12,2)` | NO | `max(sub+ship+auth−disc, 0)` |
| `shippingType` | `orders.shipping_method` | `ENUM('sf','meetup')` | NO | — |
| `sfLockerCode` | `orders.sf_locker_code` | `TEXT` | YES | — |
| `sfAddress` | `orders.sf_address` | `TEXT` | YES | — |
| `buyerPhone` | `orders.buyer_phone` | `TEXT` | YES | — |
| `meetupDetail` | `orders.meetup_detail` | `TEXT` | YES | — |
| `buyerRemark` | `orders.buyer_remark` | `TEXT` | YES | — |
| `authServiceEnabled` | `orders.has_authentication` | `BOOLEAN` | NO | 預設 `FALSE` |
| `selectedCoupons[]` | `order_coupons.coupon_code` | `TEXT` | NO | `→ coupons.code`（多對多） |
| （買家） | `orders.buyer_id` | `UUID` | NO | `→ profiles.id` |
| （賣家） | `orders.seller_id` | `UUID` | NO | `→ profiles.id` |
| （商品） | `orders.listing_id` | `UUID` | NO | `→ listings.id` |
| ❌ **訂金** | **嚴禁存在** | — | — | Full Pay 鐵律 |

### 1.5 訪客守衛與遊戲化（`WishlistTable` / `HeroSearch` / `CheckInCard` / `PortfolioRewards`）

| 前端 State 變數 | Supabase 表.欄位 | 原生型別 | 可空 | 外鍵 / 約束 |
|-----------------|------------------|----------|:----:|-------------|
| `mockRole` (`useUIStore`) | `profiles.role` | `ENUM('USER','PENDING_MERCHANT','MERCHANT','ADMIN')` | NO | RLS 角色守衛 |
| `WISHLIST_REGISTRY.id` | `wishlists.card_ref` | `TEXT` | NO | `→ card_catalog`（UNIQUE `(user_id,card_ref)`） |
| `WISHLIST_REGISTRY.trackedPrice` | `wishlists.tracked_price` | `NUMERIC(12,2)` | NO | — |
| `consecutiveDays` | `user_check_ins.streak_day` | `INTEGER` | NO | `CHECK 1..7` |
| `userPoints` | `profiles.points_balance` | `INTEGER` | NO | 預設 0 |
| `CHECK_IN_STEPS[].points` | `user_check_ins.points_awarded` | `INTEGER` | NO | 10/15/20/25/30/40/100 |
| （簽到日） | `user_check_ins.check_in_date` | `DATE` | NO | UNIQUE `(user_id,date)` |
| `isBanned` | `profiles.is_banned` | `BOOLEAN` | NO | 預設 `FALSE` |
| `kycStatus` | `profiles.kyc_status` | `ENUM('pending','approved','rejected')` | YES | NULL=未申請 |
| `stripeConnected` | `profiles.stripe_connected` | `BOOLEAN` | NO | 預設 `FALSE` |

> **訪客顯隱矩陣（對齊前端閘門）：**
> | 角色 | 簽到卡 (`HeroSearch`) | 身家計算器 (`PortfolioRewards`) | 願望清單 | 上架 |
> |------|:---:|:---:|:---:|:---:|
> | `GUEST` | ❌（霧化引流登入） | ❌（frosted overlay + 登入 CTA） | ❌ 401 | ❌ |
> | `USER` | ✅ | ✅ | ✅ | ❌ |
> | `MERCHANT` | ❌ | ✅ | ✅ | ✅（KYC approved） |
> | `ADMIN` | ✅ | ✅（脫離消費端） | ✅ | — |

---

## 🔌 2. 全局 API 路由與通信檢核清單 (Unified API Endpoint Checklist)

依狀態域（Status Domain）索引，橋接所有前端組件所需的伺服器端路由。完整 payload 圖譜見 [`docs/dev/api.md`](docs/dev/api.md)。

### 🔐 Auth（身份驗證）
- [ ] `POST [Action] signUp` ➔ `{ userId, role:'USER' }`
- [ ] `POST [Action] signInWithPassword` ➔ `{ session, role }`
- [ ] `POST [Action] signOut`
- [ ] `GET /api/profile/[pktId]` ➔ `Profile`
- [ ] `PATCH [Action] updateProfile`
- [ ] `POST [Action] submitKyc` ➔ `USER → PENDING_MERCHANT`

### 🔍 Catalog（卡牌目錄與搜尋）
- [ ] `GET /api/catalog/search?q=&itemType=` ➔ `CatalogEntry[]`（模糊／結構化解耦）
- [ ] `GET /api/catalog/[itemType]/[cardNumber]` ➔ `CatalogEntry`
- [ ] `POST /api/catalog/sync` ➔ 外部 API 回填 upsert（`(item_type,card_number)`）

### 🏷️ Catalog Listing（上架與大盤）
- [ ] `GET /api/listings?itemType=&rarity=&status=active`
- [ ] `GET /api/listings/[id]`
- [ ] `POST [Action] createListing`（MERCHANT + KYC，帶 `item_type`/`condition`/`grader`/6 槽相片）
- [ ] `PATCH [Action] updateListing`
- [ ] `POST [Action] uploadListingImage`（≤ 6 張）

### 💬 Messaging（議價聊天）
- [ ] `GET /api/chat/rooms` ➔ `ChatRoom[]`
- [ ] `GET /api/chat/rooms/[roomId]/messages`
- [ ] `POST [Action] sendMessage`
- [ ] `POST [Action] injectOffer`（`type:'special_transaction'`）
- [ ] `PATCH [Action] respondOffer`（`accept`/`reject`/`counter` ➔ 直購跳轉）

### 💳 Escrow Settlement（託管結帳與交割）
- [ ] `POST /api/checkout/quote` ➔ `QuoteResult`（全額公式）
- [ ] `POST /api/checkout/create-payment-intent` ➔ `{ clientSecret, ledgerCode }`
- [ ] `GET /api/orders/[id]` / `GET /api/orders?role=&scope=`
- [ ] `PATCH [Action] shipOrder`（賣家上載 `trackingNo`）
- [ ] `POST /api/webhooks/stripe`（raw body 驗簽，冪等去重）
- [ ] `POST /api/stripe/connect/onboard` / `return` / `login-link`

### 🎮 Gamification（遊戲化與願望清單）
- [ ] `POST [Action] executeCheckIn` ➔ `{ streakDay, pointsAwarded, pointsBalance }`
- [ ] `GET /api/wishlist` / `POST addWishlist` / `DELETE removeWishlist`
- [ ] `GET /api/portfolio/networth` ➔ `{ totalValueHkd, itemCount }`

### 🛡️ Admin（管理後台）
- [ ] `GET /api/admin/metrics`（GMV / 佣金 / 在線數）
- [ ] `GET /api/admin/kyc?status=` + `PATCH [Action] reviewKyc`
- [ ] `GET /api/admin/users` + `PATCH [Action] toggleBan`
- [ ] `POST [Action] upsertPlatformSetting` / `triggerScraperJob`

---

## 🗺️ 3. 階段性後端實作與金流交割時間軸 (Step-by-Step Backend Integration Timeline)

對齊 `requirement.md` 開發時間表（第 2-4 個月：系統開發與 API 整合）。拆解為 3 個邏輯工程衝刺。

### 🟦 Sprint 1 — 資料庫基建與 RLS 強化 (DB Infrastructure & RLS Hardening)

> **目標：** 鋪設 10 張核心資料表的鋼筋骨架，建立 fail-closed 權限防線。
> **對應 Ticket：** 8, 9, 10, 11, 12, 13, 28, 29

| 步驟 | 交付物 | 驗收 |
|------|--------|------|
| 1.1 | 建立全部 ENUM 與 10 張表（`profiles`/`card_catalog`/`listings`/`orders`/`chat_rooms`/`messages`/`wishlists`/`user_check_ins`/`user_collections`/`kyc_applications`/`coupons`） | DDL 無誤執行 |
| 1.2 | 套用全表 RLS（GUEST/USER/MERCHANT/ADMIN 分流，fail-closed） | 越權請求一律被拒 |
| 1.3 | `auth.users → profiles` 自動 Trigger（`role='USER'`） | 新註冊自動建檔 |
| 1.4 | Storage Bucket：`listing-images`（公讀 MERCHANT 寫）、`kyc-docs`（私密簽名） | RLS 驗證 |
| 1.5 | `execute_daily_check_in()` RPC + `(user_id,check_in_date)` UNIQUE 防作弊 | 同日重複簽到被拒 |
| 1.6 | 灌入 `coupons` 種子（WELCOME-TCG-50 / SF-FREE-DUANWU / VIP-DISCOUNT-100） | 結帳可選券 |

### 🟨 Sprint 2 — 動態級聯 API 路由與聊天同步 (Dynamic Cascading API Routes & Chat Sync)

> **目標：** 接通 Auth、目錄搜尋、上架、訂單讀取與議價聊天的即時資料流。
> **對應 Ticket：** 14-18, 21, 22, 24, 25, 26, 32b, 33, 35b, 37b, 47, 49b, 50, 55b, 57b

| 步驟 | 交付物 | 驗收 |
|------|--------|------|
| 2.1 | 接駁 `supabase.auth`（signUp/signIn/signOut）取代 `setTimeout` mock | 真實 Session |
| 2.2 | `middleware.ts` 角色守衛（`/admin` 僅 ADMIN，fail-closed 重導） | 越權重導 |
| 2.3 | `card_catalog` 搜尋 API（模糊 `q` 與結構化 `itemType`/`rarity` 解耦，外部 API 回填 upsert） | 多分類不互污 |
| 2.4 | `createListing` Server Action（MERCHANT + KYC 驗證，寫入 `item_type`/`condition`/`grader`/6 槽相片） | 越權上架被拒 |
| 2.5 | 雙端訂單讀取 API（買家 `scope=active/completed`、賣家 `seller_id`，全額 5 階 Escrow 狀態） | 狀態映射正確 |
| 2.6 | 聊天 Realtime：`messages`/`chat_rooms` 訂閱、`injectOffer`/`respondOffer`、確定性房號 | 雙向對稱、accept 後直購跳轉 |
| 2.7 | KYC 與封禁 Admin Server Actions（`reviewKyc` 升級角色、`toggleBan`） | RLS 僅 ADMIN |

### 🟥 Sprint 3 — Stripe Connect Webhook 與託管金流上線 (Stripe Connect Webhooks & Escrow Gateways Launch)

> **目標：** 打通全額付訖託管金流閉環，自動分賬與爭議退款。
> **對應 Ticket：** 38, 39, 41b, 42b, 43, 44, 45, 49b

| 步驟 | 交付物 | 驗收 |
|------|--------|------|
| 3.1 | Stripe Express 入駐三端點（`onboard`/`return`/`login-link`，MERCHANT fail-closed） | `stripe_connected` 同步 |
| 3.2 | `create-payment-intent`（全額 `transfer_data` 分賬 + `application_fee_amount`） | 公式與結帳對齊 |
| 3.3 | `/api/webhooks/stripe`（raw body 驗簽、`stripe_event_id` 冪等去重） | 重送不重複建單 |
| 3.4 | `payment_intent.succeeded` ➔ 建立 `orders`（`custody`）+ `listings='sold'`（行鎖） | 防重複付款 |
| 3.5 | 出貨／釋放／退款狀態流轉（`shipped`/`released`/`cancelled`） | 5 階閉環 |
| 3.6 | 運費補貼分賬（免運券由平台佣金扣除補貼賣家）、鑑定費獨立行項 | 無訂金欄位 |
| 3.7 | 交易關鍵節點 Email / Push 通知管線 | 雙通道送達 |

---

## ✅ 4. 全域合規防線檢核 (Compliance Gates)

| 防線 | 指令 | 通過條件 |
|------|------|----------|
| TypeScript 結構安全 | `bunx tsc --noEmit` | Exit Code 0、零型別錯配 |
| Linter 一致性 | `bun run lint` | Exit Code 0、零 hook/解析警告 |

> 本藍圖為 **文件治理** 產物，未改動任何 `.ts` / `.tsx` 執行碼；上述防線僅驗證文件連結與註解未破壞現有建置。
