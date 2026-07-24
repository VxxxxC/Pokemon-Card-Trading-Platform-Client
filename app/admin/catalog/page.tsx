"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Accordion } from "@/app/components/ui/Accordion";

interface CardEntry {
  id: string;
  cardNo: string;
  name: string;
  nameJP: string;
  set: string;
  rarity: string;
  source: "tcgdex" | "snkrdunk" | "manual";
  cachedAt: string;
  needsReview: boolean;
  imageUrl?: string;
}

const ITEMS_PER_PAGE = 6;

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: card_catalog | View / RPC: list_card_catalog_entries
const initialCards: CardEntry[] = [
  {
    id: "DB-001",
    cardNo: "sv2a-182",
    name: "Charizard ex SAR",
    nameJP: "リザードン ex SAR",
    set: "151 (sv2a)",
    rarity: "SAR",
    source: "snkrdunk",
    cachedAt: "2025/5/21 12:00",
    needsReview: false,
  },
  {
    id: "DB-002",
    cardNo: "sv6a-109",
    name: "Umbreon ex SAR",
    nameJP: "ブラッキー ex SAR",
    set: "Night Wanderer (sv6a)",
    rarity: "SAR",
    source: "snkrdunk",
    cachedAt: "2025/5/21 12:00",
    needsReview: false,
  },
  {
    id: "DB-003",
    cardNo: "sv4a-237",
    name: "Gardevoir ex SAR",
    nameJP: "サーナイト ex SAR",
    set: "Shiny Treasure (sv4a)",
    rarity: "SAR",
    source: "tcgdex",
    cachedAt: "2025/5/20 08:30",
    needsReview: false,
  },
  {
    id: "DB-004",
    cardNo: "promo-032",
    name: "Pikachu PROMO",
    nameJP: "ピカチュウ PROMO",
    set: "Pokémon Center 限定 2024",
    rarity: "PROMO",
    source: "manual",
    cachedAt: "2025/5/18 15:22",
    needsReview: false,
  },
  {
    id: "DB-005",
    cardNo: "s12a-301",
    name: "Arceus VSTAR UR",
    nameJP: "アルセウス VSTAR UR",
    set: "VSTAR Universe (s12a)",
    rarity: "UR",
    source: "tcgdex",
    cachedAt: "2025/5/21 12:00",
    needsReview: false,
  },
  {
    id: "DB-006",
    cardNo: "gym-042",
    name: "Sabrina's Gengar",
    nameJP: "ナツメのゲンガー",
    set: "Gym Heroes (第1弾·舊版)",
    rarity: "Holo",
    source: "manual",
    cachedAt: "2025/5/19 10:15",
    needsReview: true,
  },
  {
    id: "DB-007",
    cardNo: "vc2-033",
    name: "Venusaur-Holo",
    nameJP: "フシギバナ Holo",
    set: "Base Set 2nd Edition",
    rarity: "Holo",
    source: "manual",
    cachedAt: "2025/5/17 09:00",
    needsReview: true,
  },
];

const SOURCE_BADGE: Record<
  CardEntry["source"],
  { label: string; className: string }
> = {
  tcgdex: {
    label: "TCGdex API",
    className: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  },
  snkrdunk: {
    label: "SNKRDUNK 行情",
    className: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  },
  manual: {
    label: "manual",
    className: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  },
};

function CardThumb({ card }: { card: CardEntry }) {
  if (card.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-11 h-14 rounded-lg object-cover border border-[rgba(237,232,224,0.10)] shrink-0"
      />
    );
  }
  return (
    <div className="w-11 h-14 rounded-lg bg-bg-page border border-[rgba(237,232,224,0.08)] flex items-center justify-center shrink-0">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#50453b"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

export default function AdminCatalogPage() {
  const [cards, setCards] = useState<CardEntry[]>(initialCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Panel 1: DB 讀取表單
  const [dbQuery, setDbQuery] = useState("");

  // Panel 2: 手動錄入表單
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNameJp, setCardNameJp] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [cardRarity, setCardRarity] = useState("SAR");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("僅支援圖片格式檔案 (image/*)");
      return;
    }
    clearObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);
    setImageFileName(file.name);
    setImageUrl("");
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setImageUrl(value);
    if (value) {
      clearObjectUrl();
      setImageFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImagePreview(value);
    } else if (!objectUrlRef.current) {
      setImagePreview("");
    }
  };

  const resetImage = () => {
    clearObjectUrl();
    setImagePreview("");
    setImageUrl("");
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
  // Target Table: card_catalog | View / RPC: insert_card_catalog_entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo || !cardName || !cardSet) {
      toast.error("請填寫所有必填欄位（卡牌編號、英文/漢語名稱、系列名稱）");
      return;
    }
    if (!imagePreview) {
      toast.error("請上傳卡牌圖片或提供圖片 URL");
      return;
    }

    // Mock 上傳：真實環境會壓縮並上傳至 Supabase Storage CDN
    const finalImageUrl = imagePreview;
    const newCard: CardEntry = {
      id: `DB-${Math.floor(100 + Math.random() * 900)}`,
      cardNo,
      name: cardName,
      nameJP: cardNameJp || "—",
      set: cardSet,
      rarity: cardRarity,
      source: "manual",
      cachedAt: "剛剛手動錄入",
      needsReview: true,
      imageUrl: finalImageUrl,
    };

    setCards((prev) => [newCard, ...prev]);
    // 防止 revoke 影響已寫入記錄的 blob URL：交出 ref 擁有權
    objectUrlRef.current = null;
    toast.success(`手動錄入成功！條目 #${newCard.id} 已建立，狀態為待審核。`, {
      description: `圖片已 mock 上傳至 Supabase Storage CDN`,
    });

    setCardNo("");
    setCardName("");
    setCardNameJp("");
    setCardSet("");
    setImagePreview("");
    setImageUrl("");
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCurrentPage(1);
  };

  const handleDbLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbQuery.trim()) {
      toast.error("請輸入卡牌編號、系列代碼或 ID");
      return;
    }
    const q = dbQuery.trim().toLowerCase();
    const found = cards.find(
      (c) => c.cardNo.toLowerCase() === q || c.id.toLowerCase() === q,
    );
    if (found) {
      toast.success(`已於本地 DB 索引找到條目 ${found.cardNo}`, {
        description: `${found.name}｜${found.set}｜${found.rarity}｜來源 ${SOURCE_BADGE[found.source].label}`,
      });
      setSearchQuery(dbQuery.trim());
      setCurrentPage(1);
    } else {
      toast.warning(`DB 中查無 "${dbQuery.trim()}" 的快取條目`, {
        description: "請確認卡牌編號，或改用手動錄入建立條目。",
      });
    }
  };

  const filteredCards = useMemo(
    () =>
      cards.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.cardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.set.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [cards, searchQuery],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCards.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE;
  const pagedCards = filteredCards.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const rangeStart = filteredCards.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + ITEMS_PER_PAGE, filteredCards.length);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">
            卡牌字典資料庫
          </h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            檢視 Supabase 本地快取卡牌名冊，並手動錄入無 API
            覆蓋的小眾／舊版卡牌條目
          </p>
        </div>
      </div>

      {/* ── Top Level Grid: Forms ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: DB 資料讀取表單 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="font-sans font-semibold text-[16px] text-text-primary">
                查詢資料庫
              </h2>
              <p className="font-sans text-[12px] text-text-secondary mt-1">
                依卡牌編號、系列代碼或條目
                ID，直接查詢並檢視資料庫中已快取的卡牌記錄
              </p>
            </div>

            <form onSubmit={handleDbLookup} className="flex gap-2.5">
              <input
                type="text"
                value={dbQuery}
                onChange={(e) => setDbQuery(e.target.value)}
                placeholder="例：sv2a-182 / sv6a-109..."
                className="flex-1 h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
              />
              <button
                type="submit"
                className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shrink-0 shadow-lg shadow-brand/10"
              >
                🔍
              </button>
            </form>
          </div>
        </section>

        {/* PANEL 2: 小眾卡牌手動錄入 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <Accordion
            isOpen={isManualInputOpen}
            onToggle={() => setIsManualInputOpen((prev) => !prev)}
            className="border-b-0 py-0"
            title={
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-[15px] sm:text-[16px] text-text-primary tracking-normal normal-case">
                  手動錄入卡牌
                </span>
              </div>
            }
          >
            <form
              onSubmit={handleManualSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2"
            >
              <div>
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  卡牌編號 <span className="text-warning">*</span>
                </label>
                <input
                  type="text"
                  value={cardNo}
                  onChange={(e) => setCardNo(e.target.value)}
                  placeholder="例：promo-102"
                  className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[12px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  英文/漢語名稱 <span className="text-warning">*</span>
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="例：Pikachu PROMO"
                  className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  日文原名
                </label>
                <input
                  type="text"
                  value={cardNameJp}
                  onChange={(e) => setCardNameJp(e.target.value)}
                  placeholder="例：ピカチュウ"
                  className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  系列/卡包名稱 <span className="text-warning">*</span>
                </label>
                <input
                  type="text"
                  value={cardSet}
                  onChange={(e) => setCardSet(e.target.value)}
                  placeholder="例：Base Set 2nd"
                  className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  罕貴度 (Rarity)
                </label>
                <select
                  value={cardRarity}
                  onChange={(e) => setCardRarity(e.target.value)}
                  className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[12px] text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)] appearance-none"
                >
                  <option value="SAR">SAR</option>
                  <option value="UR">UR</option>
                  <option value="SR">SR</option>
                  <option value="AR">AR</option>
                  <option value="Holo">Holo</option>
                  <option value="PROMO">PROMO</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full h-9 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform"
                >
                  新增手動條目
                </button>
              </div>

              {/* 圖片上傳（File input + URL 雙模式） */}
              <div className="sm:col-span-2">
                <label className="font-mono text-[11px] text-text-secondary block mb-1">
                  卡牌圖片 <span className="text-warning">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="shrink-0">
                    {imagePreview ? (
                      <div className="relative w-16 h-[88px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="預覽"
                          className="w-16 h-[88px] rounded-lg object-cover border border-[rgba(237,232,224,0.12)]"
                        />
                        <button
                          type="button"
                          onClick={resetImage}
                          aria-label="移除圖片"
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center active:scale-[0.9] transition-transform"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-[88px] rounded-lg bg-bg-page border border-dashed border-[rgba(237,232,224,0.16)] flex items-center justify-center">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#50453b"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-[11px] font-mono text-text-secondary file:mr-3 file:h-8 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(212,165,116,0.15)] file:text-brand file:font-sans file:font-bold file:text-[11px] file:cursor-pointer hover:file:bg-[rgba(212,165,116,0.25)]"
                    />
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      placeholder="或貼上圖片 URL（備援）"
                      className="w-full h-8 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg px-3 font-mono text-[11px] text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)]"
                    />
                    {imageFileName && (
                      <p className="font-mono text-[10px] text-text-disabled truncate">
                        已選：{imageFileName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Accordion>
        </section>
      </div>

      {/* ── 手動錄入記錄 ─────────────────────────────────────────────── */}
      <section aria-labelledby="records-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2
            id="records-heading"
            className="font-sans font-bold text-[16px] text-text-primary"
          >
            手動錄入記錄 ({filteredCards.length})
          </h2>
          <div className="flex items-center h-9 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3 max-w-[240px]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#50453b"
              strokeWidth="2.5"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜尋編號、卡名或系列..."
              className="w-full h-full bg-transparent px-2 font-mono text-[11px] text-text-primary placeholder-text-disabled focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {pagedCards.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-sans text-[13px] text-text-secondary">
                查無符合條件的卡牌記錄。試試調整搜尋關鍵字，或於上方手動錄入新條目。
              </p>
            </div>
          ) : (
            pagedCards.map((card, i) => {
              const badge = SOURCE_BADGE[card.source];
              return (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                    i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""
                  } ${card.needsReview ? "bg-[rgba(239,68,68,0.02)]" : ""}`}
                >
                  <CardThumb card={card} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10px] text-brand bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded border border-brand/20">
                        {card.cardNo}
                      </span>
                      <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
                        {card.name}
                      </p>
                      <span className="font-mono text-[10px] text-text-disabled truncate max-w-[120px]">
                        {card.nameJP}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-sans text-[11px] text-text-secondary">
                        {card.set}
                      </span>
                      <span className="font-mono text-[10px] text-text-disabled uppercase">
                        {card.rarity}
                      </span>
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {card.needsReview && (
                        <span className="font-mono text-[9px] text-warning bg-[rgba(239,68,68,0.10)] px-1.5 py-0.5 rounded border border-warning/15">
                          needsReview
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] text-text-disabled block">
                      最後同步
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {card.cachedAt}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="font-mono text-[11px] text-text-secondary">
            顯示第 {rangeStart} - {rangeEnd} 筆，共 {filteredCards.length}{" "}
            筆記錄
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-8 px-3 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-lg font-mono text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              ← 上一頁
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === safePage ? "page" : undefined}
                    className={`h-8 w-8 rounded-lg font-mono text-[11px] active:scale-[0.98] transition-all ${
                      page === safePage
                        ? "bg-brand text-[#17130f] font-bold"
                        : "bg-bg-card border border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-8 px-3 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-lg font-mono text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              下一頁 →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
