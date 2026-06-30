# API 整合 TODO 追蹤器（RESTful 與 RPC 端點登記冊）

> 本文件為 HKCardVault 後端 **API 路由單一真理源 (SSOT)**，由前端 payload 提交處理器逆向校準。
> 所有路由均標註精確 HTTP 動詞、請求結構與強型別 JSON 回應圖譜。
>
> **慣例：**
> - Next.js Route Handlers 置於 `app/api/**/route.ts`；Server Actions 標註 `[Server Action]`。
> - 寫入端點一律於伺服器端 fail-closed 驗證角色（`USER` / `MERCHANT` / `ADMIN`）。
> - 金額一律遵循全額付訖（Full Pay），回應中嚴禁出現 `deposit_*` 欄位。

---

## 0. 通用回應信封 (Envelope)

```jsonc
// 成功
{ "ok": true, "data": { /* 端點專屬 payload */ } }
// 失敗（fail-closed）
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "需要 MERCHANT 權限" } }
```

---

## 1. 身份驗證與會員 (Auth & Profile)

| 方法 | 路徑 / Action | 請求 Payload | 回應圖譜 | 權限 |
|------|---------------|--------------|----------|------|
| `POST` | `[Server Action] signUp` | `{ email, password, displayName }` | `{ userId, role: 'USER' }` | GUEST |
| `POST` | `[Server Action] signInWithPassword` | `{ email, password }` | `{ session, role }` | GUEST |
| `POST` | `[Server Action] signOut` | `{}` | `{ ok: true }` | USER+ |
| `GET` | `/api/profile/[pktId]` | — | `Profile`（見下） | GUEST |
| `PATCH` | `[Server Action] updateProfile` | `Partial<Pick<Profile,'displayName'\|'handle'\|'bio'\|'email'>>` | `Profile` | 本人 |
| `POST` | `[Server Action] submitKyc` | `{ shopName, documentPath }` | `{ status: 'pending' }` | USER → PENDING_MERCHANT |

```ts
interface Profile {
  id: string; pktId: string; displayName: string; handle: string;
  avatarSeed: string; role: 'USER'|'PENDING_MERCHANT'|'MERCHANT'|'ADMIN';
  kycStatus: 'pending'|'approved'|'rejected'|null;
  rating: number; reviewCount: number; levelTier: number;
  xpCurrent: number; xpRequired: number; pointsBalance: number;
  shopName: string|null; stripeConnected: boolean;
}
```

---

## 2. 卡牌目錄與搜尋 (Catalog & Search)

| 方法 | 路徑 | 請求 | 回應圖譜 | 權限 |
|------|------|------|----------|------|
| `GET` | `/api/catalog/search?q=&itemType=card\|box_set` | query string | `CatalogEntry[]` | GUEST |
| `GET` | `/api/catalog/[itemType]/[cardNumber]` | — | `CatalogEntry` | GUEST |
| `POST` | `/api/catalog/sync` | `{ cardNumber, itemType }` | `CatalogEntry`（外部 API 回填 + upsert） | ADMIN / 系統 |

```ts
interface CatalogEntry {
  id: string; itemType: 'card'|'box_set'; cardNumber: string;
  name: string; jpName: string|null; seriesSet: string|null;
  rarity: 'SAR'|'UR'|'SR'|'AR'|'CSR'|null; heroImage: string|null;
  needsReview: boolean; cachedAt: string;
}
```

> **解耦鐵律：** 模糊關鍵字 `q` 與結構化 `itemType` / `rarity` 為獨立維度（對齊 `HeroSearch.tsx`）。多分類查詢以 `(itemType, cardNumber)` 命中，**嚴禁** 全域 `q` 覆寫其他分類結果。

---

## 3. 商品上架與大盤 (Listings & Marketplace)

| 方法 | 路徑 / Action | 請求 Payload | 回應圖譜 | 權限 |
|------|---------------|--------------|----------|------|
| `GET` | `/api/listings?itemType=&rarity=&status=active&page=` | query | `{ items: Listing[], total: number }` | GUEST |
| `GET` | `/api/listings/[id]` | — | `Listing` | GUEST |
| `POST` | `[Server Action] createListing` | `CreateListingInput` | `Listing` | MERCHANT (KYC approved) |
| `PATCH` | `[Server Action] updateListing` | `{ id, ...Partial<CreateListingInput> }` | `Listing` | 上架者本人 |
| `POST` | `[Server Action] uploadListingImage` | `multipart/form-data`（≤ 6 張） | `{ urls: string[] }` | MERCHANT |

```ts
// 對齊 AddAssetModal.GlobalAssetPayload + NewListingForm 提交
interface CreateListingInput {
  itemType: 'card' | 'box_set';
  name: string;
  cardNo?: string;                 // box_set 可省略
  seriesSet?: string;
  grader: 'RAW'|'PSA'|'CGC'|'BGS'|'ARS'|'OTHER';
  gradeScore?: string;             // 例 '10 (Black Label)'
  condition: 'A'|'B'|'C'|'D';
  conditionDesc?: string;
  sellingPrice: number;
  photos: { url: string; remark: string }[];  // active 時強制 >= 2 張
  status: 'draft' | 'active';
}

interface Listing extends CreateListingInput {
  id: string; sellerId: string; rarity: string|null;
  status: 'draft'|'active'|'sold'|'pending';
  createdAt: string; updatedAt: string;
}
```

---

## 4. 議價聊天與要約 (Messaging & Offers)

| 方法 | 路徑 / Action | 請求 Payload | 回應圖譜 | 權限 |
|------|---------------|--------------|----------|------|
| `GET` | `/api/chat/rooms` | — | `ChatRoom[]` | 本人 |
| `GET` | `/api/chat/rooms/[roomId]/messages` | — | `Message[]` | 房間成員 |
| `POST` | `[Server Action] sendMessage` | `{ roomId, body }` | `Message` | 房間成員 |
| `POST` | `[Server Action] injectOffer` | `OfferInput` | `Message`（`type:'special_transaction'`） | 買家 |
| `PATCH` | `[Server Action] respondOffer` | `{ messageId, action: 'accept'\|'reject'\|'counter', counterPrice? }` | `{ offerStatus }` | 賣家／買家 |

```ts
// 對齊 useHkCardVaultStore.SpecialTransactionData
interface OfferInput {
  buyerId: string; buyerName: string;
  sellerId: string; sellerName: string;
  cardId: string; cardName: string;
  offerPrice: number; isInstantTake: boolean;
}

interface Message {
  id: string; roomId: string;
  senderRole: 'me'|'them'|'system';
  type: 'text'|'special_transaction';
  body: string; createdAt: string;
  offer?: {
    cardId: string; cardName: string; offerPrice: number;
    status: 'pending'|'accepted'|'rejected'|'countered';
  };
}
```

> **狀態機：** `pending → accepted | rejected | countered`。`accepted` 後觸發直購跳轉至 `/checkout/[listingId]`（對齊 `SpecialTransactionMessage` 的 accept 後直結帳閉環）。房號採確定性雙向對稱雜湊 `generateDeterministicRoomId(buyerId, sellerId)`。

---

## 5. 託管結帳與金流 (Escrow Checkout & Settlement)

| 方法 | 路徑 | 請求 Payload | 回應圖譜 | 權限 |
|------|------|--------------|----------|------|
| `POST` | `/api/checkout/quote` | `QuoteInput` | `QuoteResult` | USER+ |
| `POST` | `/api/checkout/create-payment-intent` | `{ listingId, ...QuoteInput }` | `{ clientSecret, ledgerCode }` | USER+ |
| `GET` | `/api/orders/[id]` | — | `Order` | 買賣雙方 |
| `GET` | `/api/orders?role=buyer\|seller&scope=active\|completed` | query | `Order[]` | 本人 |
| `PATCH` | `[Server Action] shipOrder` | `{ orderId, trackingNo }` | `Order` | 賣家 |

```ts
// 對齊 checkout/[id]/page.tsx 計算引擎
interface QuoteInput {
  shippingMethod: 'sf' | 'meetup';      // sf → shippingFee=30；meetup → 0
  authServiceEnabled: boolean;          // true → authFee=150
  couponCodes: string[];                // 可多選累加
}

interface QuoteResult {
  itemSubtotal: number;
  shippingFee: number;                  // 30 | 0
  authFee: number;                      // 150 | 0
  couponDiscount: number;               // Σ coupon.discount
  totalAmount: number;                  // max(subtotal + shipping + auth - discount, 0)
}

interface Order {
  id: string; ledgerCode: string;       // TXN-HKCV-{id}-{seq}
  listingId: string; buyerId: string; sellerId: string;
  orderType: 'B2C'|'C2C';
  escrowStatus: 'payment'|'custody'|'shipped'|'grading'|'released'|'cancelled';
  itemSubtotal: number; shippingFee: number; authFee: number;
  couponDiscount: number; totalAmount: number;
  shippingMethod: 'sf'|'meetup'; trackingNo: string|null;
  hasAuthentication: boolean; createdAt: string;
  // ❌ 全額付訖：絕無 depositPaid / depositAmount 欄位
}
```

---

## 6. Stripe Connect（見 `server.md` 完整 Webhook 生命週期）

| 方法 | 路徑 | 請求 | 回應 | 權限 |
|------|------|------|------|------|
| `POST` | `/api/stripe/connect/onboard` | `{}` | `{ accountLinkUrl }` | MERCHANT |
| `GET` | `/api/stripe/connect/return` | `?account=` | `302 → /marketplace/payment-status` | MERCHANT |
| `POST` | `/api/stripe/connect/login-link` | `{}` | `{ dashboardUrl }` | MERCHANT (已綁定) |
| `POST` | `/api/webhooks/stripe` | Stripe raw body（驗簽） | `200 OK` | Stripe 簽章 |

---

## 7. 遊戲化與願望清單 (Gamification & Wishlist)

| 方法 | 路徑 / Action | 請求 | 回應 | 權限 |
|------|---------------|------|------|------|
| `POST` | `[Server Action] executeCheckIn` | `{}` | `{ streakDay, pointsAwarded, pointsBalance }` | USER+ |
| `GET` | `/api/wishlist` | — | `WishlistEntry[]` | 本人 |
| `POST` | `[Server Action] addWishlist` | `{ cardRef, trackedPrice }` | `WishlistEntry` | USER+ |
| `DELETE` | `[Server Action] removeWishlist` | `{ cardRef }` | `{ ok: true }` | 本人 |
| `GET` | `/api/portfolio/networth` | — | `{ totalValueHkd, itemCount }` | USER+ |

```ts
// 對齊 CheckInCard CHECK_IN_STEPS：7 日積分 10/15/20/25/30/40/100
// 對齊 WishlistTable.WISHLIST_REGISTRY
interface WishlistEntry {
  id: string; cardRef: string; name: string; cardCode: string;
  rarity: 'SAR'|'UR'|'SR'|'AR'|'CSR';
  trackedPrice: number; currentPrice: number; trend30d: number;
}
```

> **Guest 守衛：** `portfolio/networth`、`wishlist`、`executeCheckIn` 對 `GUEST` 一律回 `401`（對齊 `PortfolioRewards.tsx` 登入閘門與 `HeroSearch.tsx` 簽到顯隱：`showCheckIn = USER | ADMIN`）。

---

## 8. 管理後台 (Admin)

| 方法 | 路徑 / Action | 請求 | 回應 | 權限 |
|------|---------------|------|------|------|
| `GET` | `/api/admin/metrics` | — | `{ gmv, commission, activeUsers, liveOrders }` | ADMIN |
| `GET` | `/api/admin/kyc?status=pending` | query | `KycApplication[]` | ADMIN |
| `PATCH` | `[Server Action] reviewKyc` | `{ applicationId, decision: 'approve'\|'reject' }` | `{ status, newRole? }` | ADMIN |
| `GET` | `/api/admin/users?q=&role=` | query | `Profile[]` | ADMIN |
| `PATCH` | `[Server Action] toggleBan` | `{ userId, isBanned }` | `Profile` | ADMIN |
| `POST` | `[Server Action] upsertPlatformSetting` | `{ key, value }` | `{ ok: true }` | ADMIN |
| `POST` | `[Server Action] triggerScraperJob` | `{ jobType: 'mercari'\|'skunk' }` | `{ jobId }` | ADMIN |

---

## 9. 外部數據 API（價格與行情）

| 來源 | 用途 | 對應前端 |
|------|------|----------|
| TCGdex / JustTCG | 卡牌官方資料、稀有度標籤 | `card_catalog` 回填 |
| Mercari JP（Apify / SKUNK 爬蟲） | 已成交歷史價、行情走勢 | `PriceTicker`、市場走勢圖 |
| 匯率 API（HKD ⇌ JPY） | 身家估值換算 | `portfolio/networth` |

> 更新頻率（對齊 `requirement.md`）：Top 100 熱門卡每日 4 次、普通卡每日 1 次、非熱門卡每週 1 次。
