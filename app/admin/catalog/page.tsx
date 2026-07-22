"use client";

import { useState } from "react";

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
}

interface CrawlerLog {
  timestamp: string;
  jobId: string;
  targetSet: string;
  status: "success" | "warning" | "failed";
  cardsCrawled: number;
  message: string;
}

const initialCards: CardEntry[] = [
  { id: "DB-001", cardNo: "sv2a-182", name: "Charizard ex SAR", nameJP: "リザードン ex SAR", set: "151 (sv2a)", rarity: "SAR", source: "snkrdunk", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-002", cardNo: "sv6a-109", name: "Umbreon ex SAR", nameJP: "ブラッキー ex SAR", set: "Night Wanderer (sv6a)", rarity: "SAR", source: "snkrdunk", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-003", cardNo: "sv4a-237", name: "Gardevoir ex SAR", nameJP: "サーナイト ex SAR", set: "Shiny Treasure (sv4a)", rarity: "SAR", source: "tcgdex", cachedAt: "2025/5/20 08:30", needsReview: false },
  { id: "DB-004", cardNo: "promo-032", name: "Pikachu PROMO", nameJP: "ピカチュウ PROMO", set: "Pokémon Center 限定 2024", rarity: "PROMO", source: "manual", cachedAt: "2025/5/18 15:22", needsReview: false },
  { id: "DB-005", cardNo: "s12a-301", name: "Arceus VSTAR UR", nameJP: "アルセウス VSTAR UR", set: "VSTAR Universe (s12a)", rarity: "UR", source: "tcgdex", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-006", cardNo: "gym-042", name: "Sabrina's Gengar", nameJP: "ナツメのゲンガー", set: "Gym Heroes (第1弾·舊版)", rarity: "Holo", source: "manual", cachedAt: "2025/5/19 10:15", needsReview: true },
  { id: "DB-007", cardNo: "vc2-033", name: "Venusaur-Holo", nameJP: "フシギバナ Holo", set: "Base Set 2nd Edition", rarity: "Holo", source: "manual", cachedAt: "2025/5/17 09:00", needsReview: true },
];

const initialLogs: CrawlerLog[] = [
  { timestamp: "2025/5/21 13:00", jobId: "JOB-942", targetSet: "Night Wanderer (sv6a)", status: "success", cardsCrawled: 42, message: "行情快取更新成功，已抓取最新 42 條成交數據。" },
  { timestamp: "2025/5/21 12:00", jobId: "JOB-941", targetSet: "Mask of Change (sv6)", status: "success", cardsCrawled: 120, message: "行情快取更新成功，最新 120 條成交記錄已寫入資料庫。" },
  { timestamp: "2025/5/21 11:00", jobId: "JOB-940", targetSet: "VSTAR Universe (s12a)", status: "warning", cardsCrawled: 85, message: "部分日文行情獲取超時 (Timeout)，15 個條目使用本地降級估值。" },
  { timestamp: "2025/5/21 10:00", jobId: "JOB-939", targetSet: "Scarlet ex (sv1s)", status: "failed", cardsCrawled: 0, message: "SNKRDUNK 網關阻斷 (403 Forbidden)，代理 IP 已被風控阻擋。" },
];

const SOURCE_BADGE = {
  tcgdex: { label: "TCGdex API", className: "text-success bg-[rgba(16,185,129,0.12)] border-success/20" },
  snkrdunk: { label: "SNKRDUNK 行情", className: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20" },
  manual: { label: "手動錄入", className: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20" },
};

export default function AdminCatalogPage() {
  const [cards, setCards] = useState<CardEntry[]>(initialCards);
  const [logs, setLogs] = useState<CrawlerLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [notif, setNotif] = useState<string | null>(null);

  // Form states for manual entry
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNameJp, setCardNameJp] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [cardRarity, setCardRarity] = useState("SAR");

  // Form states for API fetch
  const [importQuery, setImportQuery] = useState("");

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo || !cardName || !cardSet) {
      showNotification("❌ 請填寫所有必填欄位 (卡牌編號, 英文名稱, 系列名稱)！");
      return;
    }

    const newCard: CardEntry = {
      id: `DB-${Math.floor(100 + Math.random() * 900)}`,
      cardNo,
      name: cardName,
      nameJP: cardNameJp || "—",
      set: cardSet,
      rarity: cardRarity,
      source: "manual",
      cachedAt: "剛剛手動手填",
      needsReview: true,
    };

    setCards([newCard, ...cards]);
    showNotification(`✅ 手動錄入成功！卡牌條目 #${newCard.id} 已建立，狀態為待審核。`);

    // Reset form fields
    setCardNo("");
    setCardName("");
    setCardNameJp("");
    setCardSet("");
  };

  const handleApiImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importQuery) {
      showNotification("❌ 請輸入要導入的卡牌編號或關鍵字！");
      return;
    }

    showNotification(`🔍 正在向 TCGdex / SNKRDUNK API 查詢 "${importQuery}"...`);

    setTimeout(() => {
      const isExist = cards.some((c) => c.cardNo.toLowerCase() === importQuery.toLowerCase());
      if (isExist) {
        showNotification("⚠️ 該卡牌編號在本地資料庫中已存在快取。");
        return;
      }

      const importedCard: CardEntry = {
        id: `DB-${Math.floor(100 + Math.random() * 900)}`,
        cardNo: importQuery,
        name: `${importQuery.toUpperCase()} Premium Card`,
        nameJP: `${importQuery.toUpperCase()} 特賞カード`,
        set: "隨機導入套裝 (Set)",
        rarity: "UR",
        source: "tcgdex",
        cachedAt: "剛剛 API 導入",
        needsReview: false,
      };

      setCards((prev) => [importedCard, ...prev]);
      showNotification(`🎉 成功從 API 導入條目: ${importedCard.name}`);
      setImportQuery("");
    }, 1200);
  };

  const handleTriggerCrawler = () => {
    showNotification("🚀 已向遠端 Node.js Queue 派發手動行情抓取任務 (夜巡/Mask of Change)...");
    setTimeout(() => {
      const newLog: CrawlerLog = {
        timestamp: new Date().toLocaleDateString("zh-TW") + " " + new Date().toLocaleTimeString("zh-TW"),
        jobId: `JOB-${Math.floor(900 + Math.random() * 100)}`,
        targetSet: "夜巡 (sv6a)",
        status: "success",
        cardsCrawled: 42,
        message: "手動觸發爬蟲成功：42 條 SNKRDUNK 行情、品相溢價估值數據已寫入資料庫！",
      };
      setLogs([newLog, ...logs]);
      showNotification("🎉 爬蟲行情快取抓取成功！已寫入最近日誌記錄。");
    }, 1500);
  };

  const filteredCards = cards.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.set.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">卡牌字典與行情</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            同步與導入官方 TCGdex API 卡牌名冊，監控 SNKRDUNK 日本即時未拆盒、單卡行情爬蟲
          </p>
        </div>
      </div>

      {/* ── Notification Toast ────────────────────────────────────────── */}
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#2e2925] border-l-4 border-brand px-4 py-3 rounded shadow-xl animate-fade-in">
          <span className="text-brand font-sans text-sm">🗃️</span>
          <span className="font-sans text-xs text-text-primary">{notif}</span>
        </div>
      )}

      {/* ── Top Level Grid: Forms for catalog creation ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: API Data Fetch and Import */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="font-sans font-semibold text-[16px] text-text-primary">
                API 智能卡牌資料擷取
              </h2>
              <p className="font-sans text-[12px] text-text-secondary mt-1">
                輸入卡牌編號，全自動調用官方及第三方 TCGdex API，自動補全卡牌的高清圖片、罕貴度、日文原名
              </p>
            </div>

            <form onSubmit={handleApiImport} className="flex gap-2.5">
              <input
                type="text"
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
                placeholder="例：sv2a-182 / sv6a-109..."
                className="flex-1 h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary placeholder-text-disabled focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shrink-0 shadow-lg shadow-brand/10"
              >
                📥 導入與快取
              </button>
            </form>
            <div className="p-3 bg-bg-page rounded-xl border border-[rgba(237,232,224,0.04)] text-[11px] font-mono text-text-secondary space-y-1">
              <p>● API 備用渠道：[TCGdex API] / [JustTCG]</p>
              <p>● 自動建立：高清圖檔會自動壓縮上傳至 Supabase Storage CDN</p>
            </div>
          </div>
        </section>

        {/* PANEL 2: Manual Card Creation Form */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <h2 className="font-sans font-semibold text-[16px] text-text-primary mb-3">
            小眾卡牌手動錄入（無 API 覆蓋）
          </h2>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                卡牌編號 <span className="text-warning">*</span>
              </label>
              <input
                type="text"
                value={cardNo}
                onChange={(e) => setCardNo(e.target.value)}
                placeholder="例：promo-102"
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[12px] text-text-primary focus:outline-none"
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
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none"
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
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none"
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
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-text-secondary block mb-1">
                罕貴度 (Rarity)
              </label>
              <select
                value={cardRarity}
                onChange={(e) => setCardRarity(e.target.value)}
                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-mono text-[12px] text-text-primary focus:outline-none appearance-none"
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
          </form>
        </section>
      </div>

      {/* ── Lower Split Section: Card Catalog + Crawler Monitoring ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Card Dictionary Table */}
        <section aria-labelledby="dictionary-heading" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 id="dictionary-heading" className="font-sans font-bold text-[16px] text-text-primary">
              卡牌名冊字典快取 ({filteredCards.length})
            </h2>
            <div className="flex items-center h-9 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3 max-w-[200px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2.5" className="shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋編號或卡名..."
                className="w-full h-full bg-transparent px-2 font-mono text-[11px] text-text-primary placeholder-text-disabled focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
            {filteredCards.map((card, i) => {
              const badge = SOURCE_BADGE[card.source];
              return (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                    i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""
                  } ${card.needsReview ? "bg-[rgba(239,68,68,0.02)]" : ""}`}
                >
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
                      <span className="font-sans text-[11px] text-text-secondary">{card.set}</span>
                      <span className="font-mono text-[10px] text-text-disabled uppercase">
                        {card.rarity}
                      </span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {card.needsReview && (
                        <span className="font-mono text-[9px] text-warning bg-[rgba(239,68,68,0.10)] px-1.5 py-0.5 rounded border border-warning/15">
                          待審核
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1 font-mono">
                    <span className="text-[10px] text-text-disabled block">最後同步</span>
                    <span className="text-[11px] text-text-secondary">{card.cachedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SNKRDUNK 行情爬蟲日誌 */}
        <section aria-labelledby="crawler-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="crawler-heading" className="font-sans font-bold text-[16px] text-text-primary">
              SNKRDUNK 爬蟲行情監控
            </h2>
            <button
              onClick={handleTriggerCrawler}
              className="h-8 px-3 bg-bg-card border border-brand/30 rounded-xl font-mono text-[11px] text-brand hover:bg-[rgba(212,165,116,0.08)] active:scale-[0.98] transition-all shrink-0"
            >
              🔄 立即手動同步
            </button>
          </div>

          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 space-y-3.5">
            <div className="bg-bg-page border border-[rgba(237,232,224,0.06)] rounded-xl p-3 flex justify-between font-mono text-[11px] text-text-secondary">
              <div>
                <span className="text-text-disabled block">爬蟲同步頻率</span>
                <span className="text-text-primary font-bold">每 4 小時自動抓取</span>
              </div>
              <div className="text-right">
                <span className="text-text-disabled block">最近成功率</span>
                <span className="text-success font-bold">98.4% (9/10)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="font-sans font-bold text-[12px] text-text-secondary block">
                最近 4 次抓取日誌
              </span>
              {logs.map((log) => (
                <div
                  key={log.jobId}
                  className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.05)] p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        log.status === "success" ? "bg-success" : log.status === "warning" ? "bg-warning animate-pulse" : "bg-warning"
                      }`} />
                      <span className="text-text-primary font-semibold">{log.targetSet}</span>
                    </div>
                    <span className="text-[10px] text-text-disabled">{log.timestamp}</span>
                  </div>

                  <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                    {log.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t border-[rgba(237,232,224,0.04)] pt-2 font-mono text-[10px] text-text-disabled">
                    <span>任務號：{log.jobId}</span>
                    <span className="text-text-primary">抓取件數：{log.cardsCrawled} 件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
