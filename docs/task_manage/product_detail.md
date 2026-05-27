# 📂 Document 2: Task 2 - 強制實物條件存證與技術規格詳情頁 (Product Detail Exhibit)

本文件詳細定義 PokéTrade JP 平台之商品詳情頁（Product Detail Page）的結構排列、業務邏輯與交互體驗。此頁面是將買家的「尋寶多巴胺」轉化為「實體信任感」的核心轉化中樞，必須兼具金融終端的高級感與嚴謹的存證邏輯。

---

## 🧭 1. 基於實體檔案樹之佈局對齊 (Codebase Layout Alignment)

* **新增動態路由路徑 (File Path)**：**你需要先手動建立資料夾與檔案** ➔ `app/marketplace/[id]/page.tsx`
* **PC 端版面 (Desktop Layout)**：
  - 採用黃金比例不對稱雙欄佈局。
  - 左側（佔 `col-span-5` 寬度）為**強制實物條件存證展台 (Sticky Photo Gallery)**，採用黏性定位緊隨視窗，確保高價值實物細節永遠外顯。
  - 右側（佔 `col-span-7` 寬度）為高資訊密度的**金融級交易終端規格面板 (Terminal Panel)**，承載價格走勢與核心 CTA 動作。
* **行動端版面 (Mobile Layout)**：
  - 轉化為垂直上下堆疊結構。
  - 實物展台置頂，隨後依序為賣家身份、金流中樞。核心交易 CTA 按鈕（直接購買/即時出價）必須全寬滿鋪、固定於手機底部大拇指熱區之內。

---

## 🛠️ 2. 核心子模組功能與 UI 細節 (Component Specs)

### A. 強制 4-6 張實物相冊展台 (Live Photos Gallery)
* **主圖放大展示器 (Main Display)**：
  - 中央配置高畫質實物圖片容器。
  - **存證標籤 (font-mono)**：大圖左上角 absolute 定位常駐一個羊皮紙灰底、帶有極細白邊框的存證標籤，由 `font-mono` 渲染顯示：`【美品 S】實物品相存證`。
* **微型縮圖導航列 (Thumbnails Grid)**：
  - 主圖下方橫向排布 4-6 張由私人賣家上傳、展示卡牌四角（Corners）、邊緣（Edges）及微距表面刮痕細節的縮圖。
  - **交互與防閃爍**：滑鼠 Hover 縮圖時，主圖需透過 Framer Motion 實現無縫、不帶任何白閃或布局抖動（Layout Shift）的流暢切換。

### B. 認證商家與遊戲化身份模組 (Seller Identity Module)
* **賣家認證名片**：展示賣家頭像、自訂店名、以及雙向評分系統累積的好評率（例 `⭐ 4.9 (120+ 筆成交)`）。
* **遊戲化身份徽章**：在賣家名字後方，根據其成交實績掛載具備黃金 3D 質感的頭銜徽章：**`🏅 專業道館主`** 或 **`資深收藏家`**，利用官方身份背書建立鋼鐵般的 C2C 實體信任感。

### C. 卡牌標準數據庫技術規格矩陣 (Specs Matrix Grid)
* **既有 Badge 整合**：必須直接 Import 並調用你現有的 `app/components/cards/RarityBadge.tsx` 與 `app/components/cards/GradeBadge.tsx` 來渲染稀有度與品相，確保全站視覺規範絕對統一。
* **技術網格表格 (Bordered Grid Table)**：
  - 採用高密度、邊框分明的極簡網格設計（外框 `border-[rgba(237,232,224,0.08)]`）。
  - **數據連通展示**：完整展示與日版 Pokémon 官方數據庫交叉校驗後的標準規格數據，嚴格禁止 AI 亂填：
    * `【名稱】噴火龍 ex` | `【稀有度】<RarityBadge type="SAR" />` | `【編號】SV8a-123/094`
    * `【屬性】火` | `【階段】Stage 2` | `【弱點】水 x2`
    * `【撤退成本】◆◆` | `【招式/傷害】爆裂燃燒 330` | `【畫師】AKIRA EGAWA`

### D. 金融交易中樞與大數據走勢 (Market Financial Center)
* **港幣現貨價面板**：使用比大背景更深的極簡區塊 `bg-[#17130f]` 作為數值底層。頂部以大字體 `font-mono font-bold text-3xl text-[#eae1da]` 渲染當前香港賣家設定的最低現貨港幣價（例 `HK$ 1,480`），下方標註小字體建立日期 `2026-05-27`。
* **Mercari JP 歷史走勢圖 (Price History Chart)**：
  - 內置一條由 `recharts` 繪製、背景完全透明融入 `--bg-card` 的 **30天日版真實已成交歷史折線圖 (Sparkline)**。
  - 滑鼠 Hover 節點時，Tooltip 以 `font-mono` 彈出當日換算為港幣後的歷史成交均價。
* **實時成交牆 (Transaction History)**：
  - 垂直排列展示該款卡牌在全平台最近 3 筆已售出記錄的微型清單（由 `font-mono` 渲染成交時間、品相等級與港幣價，例 `2026-05-26 14:22 | 【美品 S】 | HK$ 1,420`）。

### E. 核心電商交易按鈕組件 (Execution Actions)
* **直接購買按鈕**：絕對亮眼的核心 CTA 動作，高度 `h-12`，滿鋪品牌溫金棕色 `bg-[#d4a574] text-[#1A1612]`。
* **即時出價按鈕**：次要動作，採用金色細邊框 `border-[#d4a574] text-[#d4a574]`，無滿鋪背景。

---

## 🛡️ 3. 首席架構師前端防禦線

* **數據載入骨架微光 (Skeleton Shimmer)**：
  - 在純前端 Mock 狀態轉換或頁面初次載入、切換卡牌 ID 時，**嚴禁出現任何通用灰色或亮白色的骨架屏（Anti-Pattern）**。
  - 必須使用符合暗金調性的棕金卡牌脈衝過渡（基底：`bg-[#26211C]`，微光中間層：`bg-[#2e2925]`），維持平台視覺個性與數據驅動的精確感。