# 🏛️ PokéTrade 大盤市場：複合搜尋與結構化篩選解耦規範文件
# (Marketplace Search & Faceted Filter Decoupling Specification)

## ⚠️ 重要實作警示 (For GitHub Copilot / Cursor / All AI Agents)
> **核心真理：** 全站大盤市場的「模糊文字搜尋框（Search Bar）」與「結構化篩選按鈕／手風琴（Faceted Filter Buttons）」在業務邏輯與後端查詢上是 **相乘相加的複合疊交關係 (matchQuery && matchRarity)**。
> **嚴禁任何 AI 協作者在後續重構中，將點擊 Filter 按鈕的數值強行推入（`setQuery()`）全域文字輸入框，此舉會引發功能衝突，閹割複合看盤的靈魂。**

---

## 1. 業務意圖與欄位定義 (Data Flow Desynchronization)

為了在未來完美串接 Supabase 數據庫，前端的狀態命名與 URL 參數必須嚴格遵守以下分流原則：

| 前端狀態 / URL 參數 | 數據庫對應操作 (Supabase / Postgres SQL) | 業務核心意圖 (UX Domain) |
| :--- | :--- | :--- |
| **`query` / `?q=xxx`** | `ilike` 模糊字串比對：專注於 `cards.name` 或 `cards.card_no` 欄位。 | 用戶手動使用鍵盤鍵入的官方卡牌名稱或卡號（例：`charizard`、`123`）。 |
| **`activeRarities` / `?rarity=xxx`** | `in` 陣列精準比對：專注於 `cards.rarity` 欄位（列舉型態）。 | 用戶點擊首頁快捷晶片或大盤側邊欄 Checkbox 時鎖定的官方稀有度（例：`SAR`、`UR`）。 |
| **`activeGrades`** | 結構化複合查詢：比對 `listings.grade_authority` 與 `listings.grade_score`。 | 專業投資者鎖定的鑑定卡品相級別（例：`PSA 10`、`BGS 9.5`）。 |
| **`activeConditions`** | 品相範圍查詢：映射至鑑定分值的邏輯區間。 | 裸卡或鑑定卡的綜合分值狀態（例：`美品 S`）。 |

---

## 2. 複合過濾的黃金邏輯鏈 (Composite Filter Chain)

在進行數據過濾時，`useMemo` 或後端的 SQL 查詢必須維持各維度獨立判定、最後進行「AND」交集。其核心架構公式如下：

```tsx
const filteredListings = INITIAL_LISTINGS.filter((card) => {
  // 1. 模糊文字搜尋框：只對齊名稱與卡號
  const matchQuery =
    normalizedQuery === "" ||
    card.name.toLowerCase().includes(normalizedQuery) ||
    searchableCardNo.includes(normalizedQuery);

  // 2. 結構化稀有度篩選：獨立比對陣列，與 matchQuery 互不干涉
  const matchRarity =
    activeRarities.length === 0 || activeRarities.includes(card.rarity);

  // 3. 鑑定級別與品相篩選
  const matchGrade = activeGrades.length === 0 || ...;
  const matchCondition = activeConditions.length === 0 || ...;

  // 🌟 終極複合交割：允許用戶一邊鎖定 Rarity = SAR，一邊輸入名稱搜尋細分標的
  return matchQuery && matchRarity && matchGrade && matchCondition;
});
```

---

## 3. 一鍵滿血重置線 (Atomic Reset Matrix)

為了提供極致的看盤體驗，系統必須配備一個原子級（Atomic）的一鍵清除控制中樞 `handleResetAllFilters`：
- **職責 A**：清空全域 Zustand Store 中的 `query` 文字字串。
- **職責 B**：逐一迭代遍歷並解鎖（Wipe Clean）所有已勾選的 `activeRarities`、`activeGrades`、`activeConditions` 複選陣列矩陣。
- **職責 C**：將大盤排序規則撥回初始 baseline 狀態（例：`最新`）。
- **職責 D**：利用 `router.push("/marketplace")` 澈底抹平 URL 的參數殘留與污染，重回乾淨的大盤原點。

---

## 4. 未來後端整合期（Supabase RPC / RLS）對接指引

當專案步入第 2-4 個月對接後端 API 時，AI 代理必須將此複合邏輯無縫轉移至 Postgres 查詢管線：
1. `q` 參數應轉化為 Supabase Websearch 或 `tsvector` 全文檢索。
2. `rarity`, `grade` 等參數應直接轉化為 `.in('rarity', activeRarities)` 的結構化 RPC 欄位過濾器。
3. 嚴禁為了貪圖方便將側邊欄 Checkbox 的行為與模糊檢索字串混寫成同一個 API 參數。
