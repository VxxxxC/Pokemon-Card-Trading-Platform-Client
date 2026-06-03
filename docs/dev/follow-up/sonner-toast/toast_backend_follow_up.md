# PokéTrade JP - Post-Backend Real-time Toast Requirements

This document tracks the advanced, state-driven real-time toast architectures to be deployed once Supabase Realtime Channels, Scraper Webhooks, and Stripe Connect are integrated.

---

## ⚡ 1. Realtime Outbid Notification (Auction Radar)

- **Trigger Event**: A row insert/update occurs in the `auction_bids` table where `buyer_id != current_user_id` but the user is the previous top bidder.
- **UI Action**: Pop a persistent `error` or `warning` style toast across any active page route.
- **Code Spec**:

```tsx
toast.error("⚠️ 警告：最高出價已被超越！", {
  description: "您對【Charizard ex SAR】投標的最高金額已被其他買家壓制。",
  duration: 8000,
  action: {
    label: "即時加價 ⚡",
    onClick: () => (window.location.href = `/marketplace/cards/charizard-ex`),
  },
});
```

---

## 🔒 2. Escrow Milestone Lock Validation (Stripe Connect Protocol)

- **Trigger Event**: Stripe webhook triggers `payment_intent.succeeded` for an escrow purchase transaction, locking capital inside our platform storage.
- **UI Action**: Pop a reassuring `success` model toast to validate fund verification.
- **Code Spec**:

```tsx
toast.success("🔒 託管協定：資金已安全鎖定", {
  description:
    "買方資金已安全劃入中介安全賬戶。請賣方於 48 小時內通過順豐發貨。",
  duration: 6000,
});
```

---

## 📋 3. Copy-To-Clipboard Tactical Micro-Feedback

- **Trigger Event**: Client-side triggers `navigator.clipboard.writeText()` on any platform cryptographic identifier node (`pktId`, transaction hash, or discount voucher coupon codes).
- **UI Action**: Pop a standard single-line minimal toast utilizing `font-mono` spacing.
- **Code Spec**:

```tsx
toast("📋 識別碼已複製到剪貼簿", {
  description: "已安全將資產安全碼或優惠代碼寫入您的設備剪貼板。",
  className: "font-mono",
});
```

---

## 📈 4. Price Alert Threshold Breached (Wishlist Core Feed)

- **Trigger Event**: Mercari JP scraper updates the market median price in `card_series` or `card_prices`, crossing the user's pre-configured alert value in `user_wishlists`.
- **UI Action**: Pop an actionable telemetry alert toast.
- **Code Spec**:

```tsx
toast.info("📈 心水降價情報發佈！", {
  description: "您追蹤的【Pikachu AR】在大盤中出現低於目標價的極限漏網現貨！",
  action: {
    label: "立即狙擊 🎯",
    onClick: () => (window.location.href = "/marketplace?filter=wishlist"),
  },
});
```
