# Coupon Skeletons 任務工作匯報

## 任務目標
為 `app/profile/user/rewards/page.tsx` 內兩個高結構化會員權益模組建立 skeleton loading templates：

1. 平台活動任務清冊（missions）
2. 三態折價券 / voucher grid（redeemable / redeemed / expired）

重點要求：

- 使用 shadcn/ui `Skeleton`
- 對齊原有 `grid-cols-1 md:grid-cols-3` 及任務卡片結構
- 保持 voucher ticket geometry 與區塊高度穩定
- 避免 rewards tab 切換或初始資料拉取時出現 CLS / layout pop

---

## 完成內容

### 1. 驗證 Skeleton primitive
已確認專案可以正常使用：

```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

---

### 2. 新增 Rewards 專用 skeleton 檔案
新增檔案：

- `app/components/shared/CouponSkeletons.tsx`

包含兩個 export：

#### `MissionListSkeleton`
- 對應平台活動任務區塊
- 使用：
  - `grid-cols-1 md:grid-cols-2`
- 每張任務卡骨架包含：
  - 任務編號 / points stub
  - 標題 stub
  - 描述 stub
  - 右側 progress / action stubs

#### `CouponGridSkeleton`
- 對應三欄折價券 grid
- 使用：
  - `grid-cols-1 md:grid-cols-3`
- 模擬 voucher 幾何結構：
  - 左側剪票式 accent strip
  - 主 value / token header 區塊
  - 下方 coupon code / expiry 區塊

這樣可以保留券證式 UI 的外型邊界，在 loading 狀態時避免整塊 collapse。

---

## 3. 接入 Member Rewards 頁面

### 修改檔案
- `app/profile/user/rewards/page.tsx`

### 新增 loading 判斷
```tsx
const isMissionLoading = missions.length === 0;
const isCouponLoading = MOCK_COUPONS[activeTab] === undefined;
```

### Missions 區塊接入
原本：
- 直接 render `missions.map(...)`

現在：
- 若 `isMissionLoading === true`
  - render `<MissionListSkeleton />`
- 否則 render 真實 missions grid

### Coupon Grid 區塊接入
原本：
- 直接 render `MOCK_COUPONS[activeTab]...`

現在：
- 若 `isCouponLoading === true`
  - render `<CouponGridSkeleton />`
- 否則 render 真實 coupon grid / empty state

同時保留原本 tab navigation、voucher 三態視覺差異與 empty state 行為。

---

## 型別與工程策略

### 嚴格 TypeScript
本次無引入 `any`。

沿用現有型別：
- `PlatformMission`
- `UserCoupon`

Skeleton file 亦為純型別安全 React component。

### 結構對齊 / CLS 防護
本次 skeleton 特別針對以下幾個幾何元素做對齊：

- 任務卡片高度與右側控制列
- voucher 左側 ticket strip
- voucher value 區塊與底部 code / expiry 區
- `md:grid-cols-3` coupon layout 寬度邊界

因此在 rewards tab 切換或未來接 API 時，可以最大程度減少 layout shift。

---

## 驗證結果

### Diagnostics
以下檔案均無 errors / warnings：

- `app/components/shared/CouponSkeletons.tsx`
- `app/profile/user/rewards/page.tsx`

### Build 驗證
已成功執行：

```bash
bun run build
```

結果：✅ 成功

重點：
- Next.js production build compiled successfully
- TypeScript passed
- `/profile/user/rewards` route 正常生成

---

## 本次涉及檔案

### 新增
- `app/components/shared/CouponSkeletons.tsx`
- `COUPON_SKELETONS_REPORT.md`

### 修改
- `app/profile/user/rewards/page.tsx`

---

## 總結
本次已完成 rewards mission 與 coupon voucher system 的 skeleton loading 第一階段，使會員權益專區在未來串接任務 API、coupon inventory、voucher state machine 時，仍然可以保持穩定、專業、金融終端風格一致的載入體驗。

### 下一步建議
如果你仲有第五個 task，我建議可以延伸做：

1. rewards empty state 與 loading state 更細分（per tab）
2. coupon redemption modal skeleton
3. mission claim feedback / toast loading state
4. `/profile/user/rewards/loading.tsx` route-level fallback
