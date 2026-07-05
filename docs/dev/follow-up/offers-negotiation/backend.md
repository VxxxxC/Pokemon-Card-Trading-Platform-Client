# Offers & Negotiation Chat — Backend Handoff

> **Superseded in part by** [chat-offers-inbox/backend.md](../chat-offers-inbox/backend.md) (Scheme B + modify + inbox RPC + **buyer auth opt-in**).  
> This file retained for historical RPC reference.

## Status

- **Backend:** ✅ `makeOffer` (+ **`useAuthentication`**) · ✅ `modifyOffer` · ✅ `acceptOffer` (inherits offer auth) · ✅ `getOfferCardContext` · ✅ `getUserChatInbox`
- **See:** [chat-offers-inbox/backend.md](../chat-offers-inbox/backend.md) for current handoff

## Quick links

| Action | File |
|--------|------|
| All offer actions | `app/actions/offers.ts` |
| Inbox load | `app/actions/chat.ts` → `get_user_chat_inbox()` RPC |
| Migrations | `20260704130000` – `20260705140000` |

```bash
bunx supabase db push
```
