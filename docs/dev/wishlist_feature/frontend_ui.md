# Coding Agent Prompt: Part 1 - Frontend UI & Interactions Only (Wishlist Feature)

## 🎯 Role & Context
You are an expert frontend developer specializing in Next.js (App Router), Tailwind CSS, and TypeScript.
Your task is to implement the **Frontend UI and client-side interactions** for the new member feature: **"Card Wishlist & Live HKD Price Trend Tracking"**. 
*Note: We are in Frontend-First mode. Do NOT write backend, database, or API logic yet. Use Mock Data for all states.*

## 🎨 Design System Constraints (Strictly Follow)
- **Theme**: Dark Mode Only (Warm dark tones, absolutely NO cold blue/light tech aesthetics).
- **Colors**: 
  - `--bg-page`: `#17130f` (Main background)
  - `--bg-card`: `#26211C` (Card background)
  - `--brand`: `#d4a574` (Warm Gold for active stars, primary buttons)
  - `--text-primary`: `#eae1da` (Ivory white)
  - `--text-secondary`: `#d4c4b7` (Secondary metadata)
  - `--success`: `#10b981` (Bullish Green ▲)
  - `--warning`: `#ef4444` (Bearish Crimson ▼)
- **Typography**: `font-sans` for text; **`font-mono` (JetBrains Mono) for ALL HKD prices, trends, and card numbers** to ensure perfect alignment.
- **Currency**: **Strictly HKD (港幣)**. Format as `HK$ 1,080`.

---

## 🛠️ Implementation Tasks (Frontend Only)

### Task 1: Create Interactive Star Wishlist Button
- **File Path**: `components/market/WishlistButton.tsx`
- **Requirements**:
  - Create a Client Component (`'use client'`).
  - **Props**: `listingId: string`, `initialIsFavored?: boolean`.
  - **Internal State**: Manage local `isFavored` boolean state toggle.
  - **UI States**:
    - `Default (Unfavored)`: Outline star SVG (`text-[#d4c4b7]`). Hover: `hover:text-[#d4a574] hover:scale-110`.
    - `Active (Favored)`: Solid star SVG (`text-[#d4a574]`) with a subtle gold glow `shadow-[0_0_10px_rgba(212,165,116,0.3)]`.
  - **Animation**: Implement a smooth spring scaling effect on click (`active:scale-90 transition-all duration-200`).

### Task 2: Implement Home Dashboard Wishlist Ticker
- **File Path**: `components/shared/WishlistTicker.tsx` (Incorporate into Home Page)
- **Requirements**:
  - Render a horizontal scroll view (`flex overflow-x-auto gap-4 scrollbar-none`).
  - Create high-quality **Mock Data** representing 3-4 tracked Pokémon cards (include images, card names like "摩魯蛾 SAR", card codes like "SV8a-123", and price stats).
  - Each Card Item must show:
    - Current lowest market price in `font-mono` (e.g., `HK$ 450`).
    - 24h price trend badge (`▲ +4.5%` or `▼ -2.1%`).
    - A simple decorative inline SVG line chart (Sparkline) mimicking price trends (Green line for up, Red line for down).
  - **Skeleton Loading**: Create an alternative state layout using Tailwind's `animate-pulse` gradient (`from-[#26211C] via-[#2e2925] to-[#26211C]`) to mimic data loading.

### Task 3: Implement Member Wishlist Table Component
- **File Path**: `app/(user)/collection/components/WishlistTable.tsx`
- **Requirements**:
  - Design a high-density, financial-terminal styled table (`Bordered Table`) using the theme colors.
  - Columns: `Card Info` (with thumbnail), `Rarity`, `Tracked Price`, `Current Market Price`, `30D Trend (Mini SVG Chart)`, `Action (Remove Button)`.
  - Force `font-mono` on all prices to ensure values align vertically.

---

## 🤖 Coding Instructions for Copilot
1. Look at existing component styles to ensure the `WishlistButton` can be absolute-positioned nicely in the top-right corner of card item grids.
2. Ensure everything compiles with clean TypeScript interfaces (`interface TrackedCardProps`).
3. Double check that ALL currency formatting explicitly uses `HK$` and matches the dark-gold terminal palette.