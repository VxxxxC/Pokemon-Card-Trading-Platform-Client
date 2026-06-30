"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useUIStore } from "@/app/store/useUIStore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 嚴格定義全域資產數據合約
export interface GlobalAssetPayload {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW" | "OTHER" | string;
  purchasePrice: number; // 僅收藏愛好使用
  currentValue: number; // 僅收藏愛好使用
  sellingPrice: number; // 僅新增商品使用
  status: "holding" | "listed" | "grading";
  isHobbyOnly: boolean;
  images: string[]; // 實時相片快照陣列
  condition?: string;
  conditionDesc?: string;
  photosRemark?: string[];
}

export function AddAssetModal() {
  const isOpen = useUIStore((state) => state.isAddAssetOpen);
  const globalMode = useUIStore((state) => state.addAssetMode);
  const closeAddAssetModal = useUIStore((state) => state.closeAddAssetModal);

  // 模式 Toggle 狀態
  const [mode, setMode] = useState<"hobby" | "merch">("hobby");

  // 🟢 核心對齊：整合統一的單一 SKU 搜尋狀態，消除個別欄位
  const [cardQuery, setCardQuery] = useState("");
  const [set, setSet] = useState(""); // 擴充包系列仍為選填欄位

  // 🟢 核心對齊：雙端級聯等級與品相分級
  const [selectedGrader, setSelectedGrader] = useState<string>("PSA"); // "RAW", "PSA", "CGC", "BGS", "ARS"
  const [selectedScore, setSelectedScore] = useState<string>("10"); // "1" through "10"
  const [selectedCondition, setSelectedCondition] = useState<string>("A"); // "A", "B", "C", "D"

  const isScoreDisabled = selectedGrader === "RAW";

  // 🟢 核心對齊：動態評級分數範圍矩陣 (Enterprise-Grade Grading Scale Matrix)
  const graderScoreOptions = useMemo(() => {
    if (selectedGrader === "RAW") return [];
    if (selectedGrader === "PSA") return ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
    if (selectedGrader === "ARS") return ["10+", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
    if (selectedGrader === "BGS") {
      return ["10 (Black Label)", "10 (Pristine)", "9.5", "9.0", "8.5", "8.0", "7.5", "7.0", "6.5", "6.0", "5.0", "4.0", "3.0", "2.0", "1.0"];
    }
    if (selectedGrader === "CGC") {
      return ["10 (Pristine)", "10 (Gem Mint)", "9.5", "9.0", "8.5", "8.0", "7.5", "7.0", "6.5", "6.0", "5.0", "4.0", "3.0", "2.0", "1.0"];
    }
    return ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
  }, [selectedGrader]);

  // 🟢 核心對齊：自動初始化分數防線
  const getFirstScoreForGrader = (grader: string): string => {
    if (grader === "RAW") return "";
    if (grader === "PSA") return "10";
    if (grader === "ARS") return "10+";
    if (grader === "BGS") return "10 (Black Label)";
    if (grader === "CGC") return "10 (Pristine)";
    return "10";
  };

  // 收藏愛好專屬欄位
  const [purchasePrice, setPurchasePrice] = useState("");

  // 新增商品專屬欄位
  const [sellingPrice, setSellingPrice] = useState("");

  // 圖片上載緩衝矩陣 (Hobby)
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🟢 Merchant Mode Onboarding States
  const [merchPhotos, setMerchPhotos] = useState<
    { url: string; remark: string }[]
  >(Array.from({ length: 6 }, () => ({ url: "", remark: "" })));
  const [isActiveListing, setIsActiveListing] = useState(true);
  const [conditionDesc, setConditionDesc] = useState("");
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // 🟢 記憶體時空守衛
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  const displayMode = mode === "hobby" ? "收藏愛好" : "新增商品";

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMode(globalMode);
      setCardQuery("");
      setSet("");
      setSelectedGrader("PSA");
      setSelectedScore("10");
      setSelectedCondition("A");
      setPurchasePrice("");
      setSellingPrice("");
      setImages([]);
      setMerchPhotos(
        Array.from({ length: 6 }, () => ({ url: "", remark: "" })),
      );
      setIsActiveListing(true);
      setConditionDesc("");
      setActiveSlotIndex(null);
    }
  }

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newUrl = URL.createObjectURL(file);

    if (mode === "merch" && activeSlotIndex !== null) {
      setMerchPhotos((prev) => {
        const next = [...prev];
        next[activeSlotIndex] = { ...next[activeSlotIndex], url: newUrl };
        return next;
      });
      setActiveSlotIndex(null);
    } else {
      if (images.length >= 6) {
        toast.error("⚠️ 抱歉，實體相片上載上限為 6 張！");
        return;
      }
      setImages((prev) => [...prev, newUrl]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveMerchImage = (indexToRemove: number) => {
    setMerchPhotos((prev) => {
      const next = [...prev];
      next[indexToRemove] = { ...next[indexToRemove], url: "" };
      return next;
    });
  };

  const handleCloseAndReset = () => {
    closeAddAssetModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardQuery) {
      toast.error("⚠️ 請填寫欲搜尋及上架的卡牌型號或名稱！");
      return;
    }

    if (mode === "merch") {
      if (!sellingPrice || Number(sellingPrice) <= 0) {
        toast.error("⚠️ 請輸入有效的商品放售售價！");
        return;
      }
      const validPhotosCount = merchPhotos.filter((p) => p.url).length;
      if (validPhotosCount < 4) {
        toast.error(
          "⚠️ 新增商品失敗！大盤為保證品相真實性，強制規定必須至少上載 4 張卡牌相片（正面與背面）。",
        );
        return;
      }
    }

    const payload: GlobalAssetPayload = {
      id: `c-asset-${Date.now()}`,
      name: cardQuery,
      set: set || "PBR-Compiled",
      cardNo: "PBR-Compiled",
      grade: isScoreDisabled ? "RAW" : `${selectedGrader} ${selectedScore}`.trim(),
      grader: selectedGrader,
      purchasePrice: mode === "hobby" ? Number(purchasePrice) || 0 : 0,
      currentValue: mode === "hobby" ? Number(purchasePrice) || 0 : 0, // 🟢 移除當前估值欄位，預設與入手成本一致
      sellingPrice: mode === "merch" ? Number(sellingPrice) : 0,
      status:
        mode === "hobby" ? "holding" : isActiveListing ? "listed" : "holding",
      isHobbyOnly: mode === "hobby",
      images:
        mode === "merch"
          ? merchPhotos.map((p) => p.url).filter(Boolean)
          : images.length > 0
            ? images
            : ["https://picsum.photos/seed/placeholder/600/420"],
      condition: selectedCondition,
      conditionDesc: mode === "merch" ? conditionDesc : undefined,
      photosRemark:
        mode === "merch" ? merchPhotos.map((p) => p.remark) : undefined,
    };

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
        <div className="font-sans font-bold text-xl text-brand mb-4">
          {displayMode}
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none pb-1 text-[13px]"
        >
          {/* === 1. CARD QUERY CONVERGENCE (Both Modes Share This Unified Box) === */}
          <div className="space-y-1.5">
            <label className="font-mono text-[12px] text-[#d4c4b7] block">
              卡牌官方型號搜尋 <span className="text-warning">*</span>
            </label>
            <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-10 overflow-hidden">
              <input
                type="text"
                required
                placeholder="sv2a-182 或 Charizard ex SAR"
                value={cardQuery}
                onChange={(e) => setCardQuery(e.target.value)}
                className="flex-1 h-full bg-transparent px-3 font-sans text-[13px] text-[#eae1da] placeholder-[#50453b] focus:outline-none"
              />
              <button
                type="button"
                className="px-4 h-full font-mono text-[12px] text-brand hover:bg-[rgba(212,165,116,0.08)] transition-colors border-l border-white/5 cursor-pointer focus:outline-none"
              >
                搜尋
              </button>
            </div>
          </div>

          {/* === 2. OPTIONAL EXPANSION SET === */}
          <div className="space-y-1.5">
            <label className="font-sans font-bold text-[#d4c4b7]">
              擴充包系列 <span className="text-text-disabled font-normal text-[11px]">(選填)</span>
            </label>
            <input
              type="text"
              placeholder="擴充包系列 (選填)"
              value={set}
              onChange={(e) => setSet(e.target.value)}
              className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl px-3 text-[#eae1da] placeholder-[#50453b] focus:outline-none"
            />
          </div>

          {/* === 3. SYMMETRICAL CASCADING SELECTS GRID === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#1e1a17] p-3.5 rounded-xl border border-white/[0.04]">
            <div className="space-y-1">
              <label className="font-mono text-[11px] text-[#d4c4b7]">
                鑑定機構
              </label>
              <Select
                value={selectedGrader}
                onValueChange={(val) => {
                  const safeVal = val ?? "RAW";
                  setSelectedGrader(safeVal);
                  if (safeVal === "RAW") {
                    setSelectedScore("");
                  } else {
                    setSelectedScore(getFirstScoreForGrader(safeVal));
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-lg px-2 text-[#eae1da] focus:ring-0 text-[12px]">
                  <SelectValue placeholder="選擇機構" />
                </SelectTrigger>
                <SelectContent className="bg-[#26211C] border border-white/10 text-[#eae1da]">
                  <SelectGroup>
                    <SelectLabel>認證鑑定機構 (Grader)</SelectLabel>
                    <SelectItem value="RAW">RAW</SelectItem>
                    <SelectItem value="PSA">PSA</SelectItem>
                    <SelectItem value="CGC">CGC</SelectItem>
                    <SelectItem value="BGS">BGS</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] text-[#d4c4b7]">
                鑑定分數
              </label>
              <Select
                value={selectedScore}
                onValueChange={(val) => setSelectedScore(val ?? "")}
                disabled={isScoreDisabled}
              >
                <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-lg px-2 text-[#eae1da] focus:ring-0 text-[12px] disabled:opacity-40">
                  <SelectValue
                    placeholder={isScoreDisabled ? "裸卡無分數" : "選擇分數"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#26211C] border border-white/10 text-[#eae1da]">
                  <SelectGroup>
                    <SelectLabel>鑑定評級</SelectLabel>
                    {graderScoreOptions.map((score) => (
                      <SelectItem key={score} value={score}>
                        {score}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[11px] text-[#d4c4b7]">
                品相指標
              </label>
              <Select
                value={selectedCondition}
                onValueChange={(val) => setSelectedCondition(val ?? "A")}
              >
                <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-lg px-2 text-[#eae1da] focus:ring-0 text-[12px]">
                  <SelectValue placeholder="選擇品相" />
                </SelectTrigger>
                <SelectContent className="bg-[#26211C] border border-white/10 text-[#eae1da]">
                  <SelectGroup>
                    <SelectLabel>品相分級</SelectLabel>
                    <SelectItem value="A">美品 A</SelectItem>
                    <SelectItem value="B">微傷 B</SelectItem>
                    <SelectItem value="C">有傷 C</SelectItem>
                    <SelectItem value="D">重傷 D</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* === 4. PHOTO UPLOAD SECTION === */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans font-bold text-[#d4c4b7]">
                實體品相相片{" "}
                {mode === "merch" ? `(必須 4–6 張)` : `(${images.length}/6)`}{" "}
                {mode === "merch" && <span className="text-brand">*</span>}
              </label>
              <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
                Max 6 Photos
              </span>
            </div>

            {mode === "hobby" ? (
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
                    onClick={() => {
                      setActiveSlotIndex(null);
                      fileInputRef.current?.click();
                    }}
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
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {merchPhotos.map((photo, i) => (
                  <div key={i} className="flex flex-col">
                    <div
                      className={`relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                        photo.url
                          ? "border-brand/30 bg-[#17130f]"
                          : i < 4
                            ? "border-brand/40 bg-[rgba(212,165,116,0.06)]"
                            : "border-[rgba(237,232,224,0.12)] bg-[#17130f] hover:border-brand/30"
                      }`}
                      onClick={() => {
                        if (photo.url) return;
                        setActiveSlotIndex(i);
                        fileInputRef.current?.click();
                      }}
                    >
                      {photo.url ? (
                        <>
                          <Image
                            src={photo.url}
                            alt={`實體照 ${i + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMerchImage(i);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white hover:bg-brand hover:text-[#1A1612] flex items-center justify-center font-sans text-[10px] font-black cursor-pointer transition-colors focus:outline-none"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={i < 4 ? "#d4a574" : "#50453b"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span className="font-mono text-[9px] text-text-disabled mt-1">
                            {i < 4 ? "必填" : "選填"}
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="照片備註"
                      value={photo.remark}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMerchPhotos((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], remark: val };
                          return next;
                        });
                      }}
                      className="w-full bg-[#17130f] border border-white/5 rounded-lg h-7 px-2 font-sans text-[10px] text-[#eae1da] placeholder-[#50453b] focus:outline-none mt-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === 5. MODE-SPECIFIC VALUE FIELDS === */}
          {mode === "hobby" ? (
            <div className="space-y-1.5 animate-fadeIn">
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
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="font-sans font-bold text-[#d4c4b7]">
                  詳細品相描述{" "}
                  <span className="text-text-disabled font-normal text-[11px]">
                    選填
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="詳細描述卡面狀況、印刷品質、角落細節等..."
                  value={conditionDesc}
                  onChange={(e) => setConditionDesc(e.target.value)}
                  className="bg-[#17130f] border border-white/5 rounded-xl text-[#eae1da] px-3 py-2.5 font-sans text-[13px] w-full focus:outline-none placeholder-[#50453b] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="modal-is-active"
                  checked={isActiveListing}
                  onChange={(e) => setIsActiveListing(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand cursor-pointer"
                />
                <label
                  htmlFor="modal-is-active"
                  className="font-mono text-[12px] text-[#eae1da] cursor-pointer"
                >
                  商品上架
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans font-bold text-[#d4a574] flex items-center gap-1">
                  💰 交易所掛牌放售售價 (Selling Price) *
                </label>
                <div className="flex items-center h-10 bg-[#17130f] border border-white/5 rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                  <span className="px-3.5 font-mono text-[12px] font-black text-[#8a8680] bg-[#26211C] border-r border-white/5 h-full flex items-center shrink-0">
                    HK$
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="一口價放售金額..."
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Submission Buttons */}
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
