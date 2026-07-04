# Offers & Negotiation Chat — Backend Handoff

> **Superseded in part by** [chat-offers-inbox/backend.md](../chat-offers-inbox/backend.md) (Scheme B + modify + inbox RPC).  
> This file retained for historical RPC reference.

## Status

- **Backend:** ✅ `makeOffer` · ✅ `modifyOffer` · ✅ `acceptOffer` · ✅ `getOfferCardContext` · ✅ `getUserChatInbox`
- **See:** [chat-offers-inbox/backend.md](../chat-offers-inbox/backend.md) for current handoff

## Quick links

| Action | File |
|--------|------|
| All offer actions | `app/actions/offers.ts` |
| Inbox load | `app/actions/chat.ts` → `get_user_chat_inbox()` RPC |
| Migrations | `20260704130000` – `20260704200000` |

```bash
bunx supabase db push
```
