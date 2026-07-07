# Transaction Reviews — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired on trading list + chat completion card — `ReviewModal` + `UserOrderRow` / `GlobalChatConsole` triggers
- **Your focus:** Profile review history UI, styling polish on `ReviewModal`

## Changelog (2026-07-04)

| Area | What changed |
|------|----------------|
| **`ReviewModal`** | Dark-mode modal, 1–5 stars, quick tags, 200-char comment, `isLoading` anti-double-submit |
| **Double-blind toasts** | `revealed === false` → `待對方評價後將互相公開`; `revealed === true` → `雙方評價已公開，感謝您的回饋！` |
| **Trading page** | Single page-level `ReviewModal` instance; `activeReview` state; `onOpenReview` callback |
| **`UserOrderRow`** | Track A: complete → open review; Track B: completed + `!hasReviewedByMe` → 「✍️ 給予對手評價」 |
| **`hasReviewedByMe`** | From `getUserTradingOrders` — hides补評 button after submit |
| **Chat `SYSTEM_ORDER_COMPLETED`** | `SystemOrderCompletedMessage` card; review CTA when `!hasReviewedByMe` via `getUserReviewedMemberOrderIds`; page-level `ReviewModal` in `GlobalChatConsole` |
| **`ReviewModal.onSubmitted`** | Optional callback — chat hides review CTA optimistically after submit |

## UI touchpoints

### Modal: `app/components/trading/ReviewModal.tsx`

| Prop | Type | Purpose |
|------|------|---------|
| `isOpen` | `boolean` | Visibility |
| `onClose` | `() => void` | Close + parent refresh |
| `orderId` | `string` | `member_orders.id` |
| `revieweeId` | `string` | Counterparty `profiles.id` |
| `onSubmitted?` | `(orderId: string) => void` | Fired on successful submit (chat optimistic hide) |

| Feature | Detail |
|---------|--------|
| Star rating | `lucide-react` `Star`, hover preview |
| Quick tags | 4 capsule buttons append to textarea |
| Submit | `submitTransactionReview` → dual toast by `result.revealed` → `onClose()` |
| Loading | Locks all controls while submitting |

### Trading page: `app/profile/user/(dashboard)/trading/page.tsx`

```tsx
const [activeReview, setActiveReview] = useState<{
  orderId: string;
  revieweeId: string;
} | null>(null);

<ReviewModal
  isOpen={activeReview !== null}
  onClose={handleCloseReview}  // clears state + refreshKey++
  orderId={activeReview?.orderId ?? ""}
  revieweeId={activeReview?.revieweeId ?? ""}
/>
```

`handleOpenReview(orderId, revieweeId)` passed to `UserOrderRow`.

### Row: `app/components/user/UserOrderRow.tsx`

| Trigger | When | Action |
|---------|------|--------|
| **A — 主動完結** | `dbStatus === 'pending'` && buyer | 「確認完成交易」→ `MemberOrderCompleteConfirmDialog` → `completeMemberOrder` → `onOpenReview` |
| **B — 歷史補評** | `completed` && `!hasReviewedByMe` | 「✍️ 給予對手評價」→ `onOpenReview` |
| **取消** | `pending` && seller (`canCancel`) | `cancelMemberOrder` only |

Props: `onOpenReview`, `dbOrderContext` (`orderId`, `revieweeId`, `dbStatus`, `hasReviewedByMe`, `canCancel`, `onRefresh`).

### Chat: `app/components/chat/SystemOrderCompletedMessage.tsx`

| Feature | Detail |
|---------|--------|
| Trigger | `SYSTEM_ORDER_COMPLETED` mapped to `type: "system_order_completed"` in `mapDbChats.ts` / `realtimeChatMessages.ts` |
| Review CTA | Shown when `getUserReviewedMemberOrderIds([orderId])` returns empty for current user |
| **查看我的訂單** | Navigates to `/profile/user/trading` and closes chat (`setIsChatOpen(false)`) |
| Modal | `GlobalChatConsole` mounts shared `ReviewModal` with `onSubmitted` → `submittedReviewOrderIds` |

## API usage

```ts
import { submitTransactionReview } from "@/app/actions/reviews";

// Inside ReviewModal handleSubmit:
const result = await submitTransactionReview({
  orderId,
  revieweeId,
  rating,
  comment: comment.trim() || undefined,
});
// result.revealed === true when both parties have now rated (mutual reveal)
```

List data (includes review state):

```ts
import { getUserTradingOrders } from "@/app/actions/orders";

const result = await getUserTradingOrders({ persona, tabStatus });
// result.data[n].hasReviewedByMe
// result.data[n].counterparty.id → revieweeId
```

Chat review-state lookup:

```ts
import { getUserReviewedMemberOrderIds } from "@/app/actions/reviews";

const result = await getUserReviewedMemberOrderIds([orderId]);
// result.data includes orderId when current user already reviewed
```

## Acceptance checklist

### Done (baseline)

- [x] Page-level single `ReviewModal` mount
- [x] Complete order → review modal opens immediately (Track A)
- [x] Completed tab shows 补評 button when `!hasReviewedByMe` (Track B)
- [x] Submit success toast reflects double-blind state (`revealed` true/false)
- [x] Submit error toast (RPC message surfaced)
- [x] Double-submit blocked via `isLoading`
- [x] Cancel order (seller only) does not open review modal
- [x] Chat: `SYSTEM_ORDER_COMPLETED` renders completion card (not raw content)
- [x] Chat: review CTA when `!hasReviewedByMe`; hidden after submit or if already reviewed
- [x] Chat: **查看我的訂單** closes overlay

### Remaining (frontend)

- [x] **Profile rating list** — `/profile/[id]/rating` wired with `getPublicProfileReviews` + `?persona=`
- [ ] **Profile page** — display `rating_score` + **public only** reviews (`is_public = true`) on `[id]/page.tsx` preview strip
- [ ] **Order detail** — wire `/profile/user/orderDetail/[id]` with review entry point
- [ ] **Design pass** — align `ReviewModal` tokens with Stitch / design system
- [ ] **Merchant (B2C)** — review flow when merchant order list ships

### Manual test

1. Apply migrations through **`20260707130000`** (see [backend.md](./backend.md)).
2. Log in as **buyer** → **確認完成交易** → handover confirm dialog → complete order → submit review in modal → toast **待對方評價後將互相公開**.
3. Log in as **seller** → **已完成** tab → **✍️ 給予對手評價** → submit → toast **雙方評價已公開**.
4. Buyer cannot see seller's review before step 3 (no profile/list UI for counterparty private reviews yet).
5. Try duplicate submit → error toast `您已評價過此筆交易`.
6. **確認完成交易** flow (Track A): buyer-only; handover dialog → complete + modal still works for first reviewer.
7. Complete order → reopen chat → completion card + review CTA (if not reviewed) → submit → CTA hides.
8. **查看我的訂單** from chat card → chat closes, lands on trading list.

## Related flows

| Flow | Link |
|------|------|
| Order complete / cancel | [user-trading-orders/backend.md](../user-trading-orders/backend.md) |
| Trading list UI | [user-trading-orders/frontend.md](../user-trading-orders/frontend.md) |
| Accept offer → pending order | [offers-negotiation/backend.md](../offers-negotiation/backend.md) |
