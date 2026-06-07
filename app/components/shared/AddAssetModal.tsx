"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
// 訂閱全域 UI 狀態機
import { useUIStore } from "@/app/store/useUIStore";

// 嚴格定義全域資產數據合約
export interface GlobalAssetPayload {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  purchasePrice: number; // 僅收藏愛好使用
  currentValue: number; // 僅收藏愛好使用
  sellingPrice: number; // 僅新增商品使用
  status: "holding" | "listed" | "grading";
  isHobbyOnly: boolean;
  images: string[]; // 實時相片快照陣列
}

export function AddAssetModal() {
  // 從狀態機精準抽取開關、預設模式同埋關閉 Action
  const isOpen = useUIStore((state) => state.isAddAssetOpen);
  const globalMode = useUIStore((state) => state.addAssetMode);
  const closeAddAssetModal = useUIStore((state) => state.closeAddAssetModal);

  // 模式 Toggle 狀態
  const [mode, setMode] = useState<"hobby" | "merch">("hobby");

  // 公共必填欄位
  const [name, setName] = useState("");
  const [set, setSet] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [grade, setGrade] = useState("");
  const [grader, setGrader] = useState<"PSA" | "BGS" | "CGC" | "RAW">("RAW");

  // 收藏愛好專屬欄位
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");

  // 新增商品專屬欄位
  const [sellingPrice, setSellingPrice] = useState("");

  // 圖片上載緩衝矩陣
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🟢 記憶體時空守衛：儲存上一次的開窗狀態，用作 Render 階段比對基準
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  // 🟢 核心修正：消滅 useEffect！直接在 Render 體內執行時空同步與表單大掃除
  // 這屬於 React 官方首推的「 stashed render pattern」，能將兩次重繪壓縮為單次高性能重繪
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      // 每次開窗時，實時同步全域設定的 Toggle 模式
      setMode(globalMode);
      // 順手大掃除：徹底洗淨上一次關窗留下來的任何殘留舊數據，確保表單絕對純淨！
      setName("");
      setSet("");
      setCardNo("");
      setGrade("");
      setGrader("RAW");
      setPurchasePrice("");
      setCurrentValue("");
      setSellingPrice("");
      setImages([]);
    }
  }

  if (!isOpen) return null;

  // 圖片變更處理（HTML5 原生客戶端沙盒渲染）
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // 規格限制：上限 6 張
    if (images.length + files.length > 6) {
      toast.error("⚠️ 抱歉，實體相片上載上限為 6 張！");
      return;
    }

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newUrls]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 圖片單張點擊刪除
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCloseAndReset = () => {
    closeAddAssetModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !set || !cardNo) {
      toast.error("⚠️ 請至少填寫卡牌名稱、系列與官方卡號！");
      return;
    }

    if (mode === "merch") {
      if (!sellingPrice || Number(sellingPrice) <= 0) {
        toast.error("⚠️ 請輸入有效的商品放售售價！");
        return;
      }
      if (images.length < 2) {
        toast.error(
          "⚠️ 新增商品失敗！大盤為保證品相真實性，強制規定必須至少上載 2 張卡牌相片（正面與背面）。",
        );
        return;
      }
    }

    const payload: GlobalAssetPayload = {
      id: `c-asset-${Date.now()}`,
      name,
      set,
      cardNo,
      grade: grader === "RAW" ? "Raw Card" : grade || "None",
      grader,
      purchasePrice: mode === "hobby" ? Number(purchasePrice) || 0 : 0,
      currentValue:
        mode === "hobby"
          ? Number(currentValue) || Number(purchasePrice) || 0
          : 0,
      sellingPrice: mode === "merch" ? Number(sellingPrice) : 0,
      status: mode === "hobby" ? "holding" : "listed",
      isHobbyOnly: mode === "hobby",
      images:
        images.length > 0
          ? images
          : ["https://picsum.photos/seed/placeholder/600/420"],
    };

    // 廣播真理源
    window.dispatchEvent(
      new CustomEvent("global-asset-successfully-added", { detail: payload }),
    );

    toast.success(
      mode === "hobby"
        ? "★ 已成功收錄進您的私藏愛好清單"
        : "🏪 商品已成功錄入並直接上架交易所大盤",
    );

    handleCloseAndReset();
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        onClick={handleCloseAndReset}
      />

      <div className="relative bg-[#2e2925] border border-[rgba(237,232,224,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl text-left flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
        {/* Toggle 模式雙夾選單 */}
        <div className="bg-[#17130f] p-1 rounded-xl grid grid-cols-2 gap-1 mb-4 shrink-0 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("hobby")}
            className={`h-9 rounded-lg font-sans font-black text-[12.5px] transition-all cursor-pointer ${mode === "hobby" ? "bg-[#d4a574] text-[#1A1612] shadow-md" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
          >
            ★ 收藏愛好
          </button>
          <button
            type="button"
            onClick={() => setMode("merch")}
            className={`h-9 rounded-lg font-sans font-black text-[12.5px] transition-all cursor-pointer ${mode === "merch" ? "bg-[#d4a574] text-[#1A1612] shadow-md" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
          >
            🏪 新增商品
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none pb-1 text-[13px]"
        >
          {/* 圖片上載專區 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans font-bold text-[#d4c4b7]">
                實體品相相片 ({images.length}/6){" "}
                {mode === "merch" && (
                  <span className="text-brand">* (最少2張)</span>
                )}
              </label>
              <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
                Max 6 Photos
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-[#17130f] p-3 rounded-xl border border-white/5 min-h-[76px]">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-[3/4] bg-[#26211C] rounded-lg border border-white/10 overflow-hidden group"
                >
                  <Image
                    src={url}
                    alt="實體特寫"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white hover:bg-brand hover:text-[#1A1612] flex items-center justify-center font-sans text-[9px] font-black cursor-pointer transition-colors focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {images.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-lg border border-dashed border-white/10 hover:border-brand/40 bg-[#26211C]/30 hover:bg-[#26211C]/60 flex flex-col items-center justify-center gap-1 text-[#8A8680] hover:text-brand transition-all cursor-pointer focus:outline-none"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="text-[9px] font-bold">上載</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* 卡牌基本欄位 */}
          <div className="space-y-1.5">
            <label className="font-sans font-bold text-[#d4c4b7]">
              卡牌官方型號/名稱 *
            </label>
            <input
              type="text"
              required
              placeholder="例如: Charizard ex SAR (噴火龍)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] placeholder-[#50453b] focus:outline-none focus:border-brand/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-sans font-bold text-[#d4c4b7]">
                擴充包系列 *
              </label>
              <input
                type="text"
                required
                placeholder="例如: Pokémon 151"
                value={set}
                onChange={(e) => setSet(e.target.value)}
                className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-sans font-bold text-[#d4c4b7]">
                官方卡號 *
              </label>
              <input
                type="text"
                required
                placeholder="例如: sv2a-182"
                value={cardNo}
                onChange={(e) => setCardNo(e.target.value)}
                className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-sans font-bold text-[#d4c4b7]">
                鑑定機構 (Grader)
              </label>
              <select
                value={grader}
                onChange={(e) =>
                  setGrader(e.target.value as "PSA" | "BGS" | "CGC" | "RAW")
                }
                className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-2 text-[#eae1da] focus:outline-none cursor-pointer"
              >
                <option value="RAW">裸卡 (RAW)</option>
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="CGC">CGC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-sans font-bold text-[#d4c4b7]">
                品相分數 (Grade)
              </label>
              <input
                type="text"
                disabled={grader === "RAW"}
                placeholder={grader === "RAW" ? "裸卡美品" : "例如: 10 / 9.5"}
                value={grader === "RAW" ? "" : grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] placeholder-[#50453b] focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>

          {/* 核心戰術分流區 */}
          {mode === "hobby" ? (
            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="font-sans font-bold text-[#d4c4b7]">
                  入手成本 (HK$)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-brand focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-sans font-bold text-[#d4c4b7]">
                  當前估值 (HK$)
                </label>
                <input
                  type="number"
                  placeholder="未填則同成本價"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-brand focus:outline-none font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="font-sans font-bold text-[#d4a574] flex items-center gap-1">
                💰 交易所掛牌放售售價 (Selling Price) *
              </label>
              <div className="flex items-center h-11 bg-[#17130f] border border-brand/20 rounded-xl overflow-hidden focus-within:border-brand/50 transition-colors">
                <span className="px-4 font-mono text-[13px] font-black text-brand bg-[#26211C] border-r border-white/5 h-full flex items-center">
                  HK$
                </span>
                <input
                  type="number"
                  required
                  placeholder="請輸入您預期在交易所大盤放售的一口價金額..."
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-brand focus:outline-none font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 shrink-0">
            <button
              type="submit"
              className="flex-1 h-11 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-black rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-md focus:outline-none"
            >
              {mode === "hobby" ? "★ 收錄至私藏愛好" : "🚀 立即發佈商品上架"}
            </button>
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="px-4 h-11 bg-transparent border border-white/10 text-[#d4c4b7] font-sans font-bold rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 快捷全域派發器
export const triggerGlobalAddAssetModal = (
  defaultMode: "hobby" | "merch" = "hobby",
) => {
  useUIStore.getState().openAddAssetModal(defaultMode);
};
