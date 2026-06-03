# Lazy Loading Skeleton UI 工作匯報

## 任務目標
為 PokéTrade JP 建立一套高保真、零版面跳動（Zero Layout Shift）的金融行情 skeleton loading 元件，並接入以下三個核心市場模組：

- `PriceTicker`
- `TokyoMarketIndex`
- `ProductDetailPage` 的 30 天歷史走勢圖

同時確保整體視覺語言符合專案既有 `.stitch/designs/DESIGN.md`：

- 深色金融終端風格
- `#17130f` / `#26211C` / `#2e2925` 暗金棕層次
- `font-mono` 對齊市場數據語意
- 使用 shadcn/ui 官方 `Skeleton` component 作為骨架基底

---

## 完成內容

### 1. 安裝 shadcn/ui Skeleton
已使用 bun 安裝：

```bash
bunx --bun shadcn@latest add skeleton
```

新增檔案：

- `components/ui/skeleton.tsx`

---

### 2. 建立統一市場骨架元件
新增共用檔案：

- `app/components/shared/MarketSkeletons.tsx`

內含 3 個子元件：

- `PriceTickerSkeleton`
- `MarketChartSkeleton`
- `TokyoIndexSkeleton`

這三個 skeleton 皆以 shadcn `Skeleton` 為核心，並用深色金融盤口視覺風格做客製化。

---

### 3. 接入對應市場模組

#### A. `PriceTicker`
修改檔案：

- `app/components/ticker/PriceTicker.tsx`

調整內容：

- 新增 `PriceTickerItem` 型別
- 新增可選 props：
  - `data?: PriceTickerItem[]`
  - `isLoading?: boolean`
- 當 `isLoading === true` 或 `data.length === 0` 時，自動回傳：

```tsx
<PriceTickerSkeleton />
```

這樣可直接作為將來 realtime feed fetch / suspense fallback 的接入點。

#### B. `TokyoMarketIndex`
修改檔案：

- `app/components/home/TokyoMarketIndex.tsx`

調整內容：

- 新增 `TokyoMarketRef` 型別
- 新增可選 props：
  - `records?: TokyoMarketRef[]`
  - `isLoading?: boolean`
- 當 `isLoading === true` 或 `records.length === 0` 時，自動回傳：

```tsx
<TokyoIndexSkeleton />
```

#### C. `ProductDetailPage` 走勢圖區塊
修改檔案：

- `app/marketplace/[id]/page.tsx`

調整內容：

- 引入 `MarketChartSkeleton`
- 建立 `hasChartData` guard
- 將 `minPrice` / `maxPrice` / `points` / `pathD` / `areaD` 計算改為安全條件式
- 當 `chartPoints` 為空時，走勢圖區塊改渲染：

```tsx
<MarketChartSkeleton />
```

這避免未來 async chart payload 未就緒時出現空白卡片或錯誤 SVG 計算。

---

## 型別與實作策略

### 嚴格 TypeScript
本次沒有引入任何 `any`。

新增型別：

- `PriceTickerItem`
- `TokyoMarketRef`

### 零 Layout Shift 考量
所有 skeleton 高度與區塊尺寸都對齊實際最終版面：

- Ticker bar：`h-9`
- Chart skeleton：`h-[120px]`
- Tokyo market panel：保留 card 容器尺寸與 grid 密度

### 可持續擴展
本次接法不是只做靜態假 loading，而是為未來真實 async fetch 預留接口：

- `PriceTicker`：支援 `isLoading` / `data`
- `TokyoMarketIndex`：支援 `isLoading` / `records`
- `ProductDetailPage`：支援空 chart data fallback

---

## 驗證結果

### Build 驗證
已成功執行：

```bash
bun run build
```

結果：✅ 通過

重點輸出：

- Next.js production build 成功
- TypeScript 檢查成功
- `marketplace/[id]`、首頁、profile routes 均正常生成

### Diagnostics
相關檔案均無 TypeScript 或路徑錯誤：

- `app/components/shared/MarketSkeletons.tsx`
- `app/components/ticker/PriceTicker.tsx`
- `app/components/home/TokyoMarketIndex.tsx`
- `app/marketplace/[id]/page.tsx`
- `components/ui/skeleton.tsx`

---

## 本次涉及檔案

### 新增
- `components/ui/skeleton.tsx`
- `app/components/shared/MarketSkeletons.tsx`
- `LAZY_LOADING_SKELETON_REPORT.md`

### 修改
- `app/components/ticker/PriceTicker.tsx`
- `app/components/home/TokyoMarketIndex.tsx`
- `app/marketplace/[id]/page.tsx`

---

## 總結
本次已完成一套針對金融行情區塊的 skeleton lazy-loading UX 升級，效果包括：

- 消除行情區塊初始空白感
- 預先穩定版面高度，減少 CLS
- 提升首頁與商品詳情頁數據載入前的專業感
- 為未來 Supabase Realtime / API fetch / Suspense fallback 預留乾淨接入點

如果下一步要再進一步 fine tune，我建議可以繼續做：

1. 將首頁 `PriceTicker`、`TokyoMarketIndex` 改成真正 async data source 並串接 skeleton
2. 幫 `ProductDetailPage` 加 route-level `loading.tsx`
3. 為其他市場模組（如 `TransactionWall`、`WishlistTicker`、`NewArrivals`）建立同級 skeleton 系列
