"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface UserListing {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  price: number;
  status: "active" | "sold" | "unlisted" | "pending_trade";
  paymentMethods: string[];
  shippingMethods: string[];
  createdAt: string;
  views: number;
  watchers: number;
}

// TODO: [server/api/database]
const INITIAL_LISTINGS: UserListing[] = [
  {
    id: "LST-C2C-001",
    cardName: "Charizard ex SAR (噴火龍 ex)",
    cardNo: "sv2a-182",
    grade: "【美品 S】裸卡直送",
    cardImage: "https://picsum.photos/seed/user-zard/200/280",
    price: 2150,
    status: "active",
    paymentMethods: ["PayMe", "轉數快 (FPS)", "現金面交"],
    shippingMethods: ["順豐到付", "市區面交"],
    createdAt: "2026/05/28",
    views: 142,
    watchers: 18,
  },
  {
    id: "LST-C2C-002",
    cardName: "Pikachu AR (經典肥皮卡丘)",
    cardNo: "sv2a-215",
    grade: "【微傷 A】卡盒割愛",
    cardImage: "https://picsum.photos/seed/user-pika/200/280",
    price: 620,
    status: "active",
    paymentMethods: ["轉數快 (FPS)", "現金面交"],
    shippingMethods: ["市區面交"],
    createdAt: "2026/05/25",
    views: 89,
    watchers: 5,
  },
  {
    id: "LST-C2C-003",
    cardName: "Mew ex SAR (復刻夢幻)",
    cardNo: "sv2a-205",
    grade: "【美品 S】剛拆封即入套",
    cardImage: "https://picsum.photos/seed/user-mew/200/280",
    price: 900,
    status: "sold",
    paymentMethods: ["PayMe"],
    shippingMethods: ["順豐速遞"],
    createdAt: "2026/05/10",
    views: 310,
    watchers: 24,
  },
  {
    id: "LST-C2C-004",
    cardName: "Ting-Lu ex SR (古鼎鹿)",
    cardNo: "sv3-155",
    grade: "【傷あり B】打牌實用打法卡",
    cardImage: "https://picsum.photos/seed/user-tinglu/200/280",
    price: 180,
    status: "unlisted",
    paymentMethods: ["現金面交"],
    shippingMethods: ["市區面交"],
    createdAt: "2026/05/01",
    views: 45,
    watchers: 1,
  },
];

export default function UserInventoryPage() {
  const [listings, setListings] = useState<UserListing[]>(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState<
    "active" | "sold" | "unlisted" | "pending_trade"
  >("active");
  // Safe SSR environment isolation via useSyncExternalStore
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 1️⃣ 商品表單 State (新增/修改)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [newCardNo, setNewCardNo] = useState("");
  const [newGrade, setNewGrade] = useState("【美品 S】");
  const [newPrice, setNewPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // 2️⃣ 建立交易訂單 Form State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<UserListing | null>(
    null,
  );
  const [buyerName, setBuyerName] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [tradeMethod, setTradeMethod] = useState<string>("meetup");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderLockerType, setOrderLockerType] = useState("852-smart-locker");
  const [orderAddress, setOrderAddress] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");

  // 3️⃣ 🟢 全新加碼：取消商品上架確認視窗 State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetListing, setCancelTargetListing] =
    useState<UserListing | null>(null);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const filteredListings = listings.filter((l) => l.status === activeTab);

  // 打開新增商品
  const handleOpenAddModal = () => {
    setEditingListingId(null);
    setNewCardName("");
    setNewCardNo("");
    setNewGrade("【美品 S】");
    setNewPrice("");
    setNewNotes("");
    setShowAddModal(true);
  };

  // 打開修改商品
  const handleOpenEditModal = (item: UserListing) => {
    setEditingListingId(item.id);
    setNewCardName(item.cardName);
    setNewCardNo(item.cardNo);
    setNewPrice(item.price.toString());

    if (item.grade.includes("【美品 S】")) setNewGrade("【美品 S】");
    else if (item.grade.includes("【微傷 A】")) setNewGrade("【微傷 A】");
    else if (item.grade.includes("【傷あり B】")) setNewGrade("【傷あり B】");

    setNewNotes("");
    setShowAddModal(true);
  };

  // 處理商品表單提交
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newPrice) return;

    if (editingListingId) {
      setListings((prev) =>
        prev.map((l) =>
          l.id === editingListingId
            ? {
                ...l,
                cardName: newCardName,
                cardNo: newCardNo || "sv-unknown",
                grade: `${newGrade} ${newNotes ? `(${newNotes})` : ""}`,
                price: Number(newPrice),
              }
            : l,
        ),
      );
      toast.success("💾 資料已更新", {
        description: "商品庫存資料已成功修改變更！",
      });
    } else {
      const newObj: UserListing = {
        id: `LST-C2C-${Math.floor(100 + Math.random() * 900)}`,
        cardName: newCardName,
        cardNo: newCardNo || "sv-unknown",
        grade: `${newGrade} ${newNotes ? `(${newNotes})` : ""}`,
        cardImage: `https://picsum.photos/seed/${Date.now()}/200/280`,
        price: Number(newPrice),
        status: "active",
        paymentMethods: ["PayMe", "轉數快 (FPS)", "現金面交"],
        shippingMethods: ["市區面交", "順豐到付"],
        createdAt: "剛剛",
        views: 0,
        watchers: 0,
      };
      setListings((prev) => [newObj, ...prev]);
      setActiveTab("active");
      toast.success("⚡ 部署成功", {
        description: `【${newCardName}】已成功部署至全港現貨大盤！`,
      });
    }

    setShowAddModal(false);
    setNewCardName("");
    setNewCardNo("");
    setNewPrice("");
    setNewNotes("");
  };

  // 打開交易單 Modal
  const handleOpenOrderModal = (item: UserListing) => {
    setSelectedListing(item);
    setFinalPrice(item.price.toString());
    setBuyerName("");
    setOrderPhone("");
    setOrderAddress("");
    setMeetupLocation("");
    setTradeMethod("meetup");
    setShowOrderModal(true);
  };

  // 為買家手動開單
  const handleCreateTransactionOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !buyerName || !finalPrice) return;

    setListings((prev) =>
      prev.map((l) =>
        l.id === selectedListing.id
          ? { ...l, status: "pending_trade" as const }
          : l,
      ),
    );

    setShowOrderModal(false);
    setActiveTab("pending_trade");

    const mockOrderId = `ORD-${selectedListing.id}`;
    toast.success("🎉 交易單已建立並鎖定資產", {
      description: `已成功為【${buyerName}】建立專屬交易單，該卡牌已暫時從現貨大盤鎖定。`,
      duration: 5000,
      action: {
        label: "查看訂單明細 📦",
        onClick: () => {
          window.location.href = `/profile/user/orders/${mockOrderId}`;
        },
      },
    });
  };

  // 暫時上下架切換
  const handleToggleStatus = (
    id: string,
    currentStatus: "active" | "sold" | "unlisted" | "pending_trade",
  ) => {
    if (currentStatus === "sold" || currentStatus === "pending_trade") return;
    const nextStatus =
      currentStatus === "active" ? ("unlisted" as const) : ("active" as const);
    const targetListing = listings.find((listing) => listing.id === id);

    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)),
    );

    if (nextStatus === "unlisted") {
      toast.warning("⏸️ 商品已暫時下架", {
        description: `【${targetListing?.cardName ?? "該卡牌商品"}】已暫時從現貨盤移出，可稍後重新上架。`,
      });
      return;
    }

    toast.success("🚀 商品已重新上架", {
      description: `【${targetListing?.cardName ?? "該卡牌商品"}】已重新回到全港現貨大盤。`,
    });
  };

  // 🟢 打開永久取消商品上架視窗
  const handleOpenCancelModal = (item: UserListing) => {
    setCancelTargetListing(item);
    setShowCancelModal(true);
  };

  // 🟢 確認執行永久移除
  const handleConfirmCancelListing = () => {
    if (!cancelTargetListing) return;
    // TODO: [server/api/database] 未来对接 `supabase.from('listings').delete().eq('id', cancelTargetListing.id)`
    setListings((prev) => prev.filter((l) => l.id !== cancelTargetListing.id));
    setShowCancelModal(false);
    setCancelTargetListing(null);
    toast.warning("🗑️ 商品已完全下架", {
      description: "該卡牌商品已從全盤庫存系統中完全移除。",
    });
  };

  return (
    <div className="space-y-6">
      {/* 頂部控制吧 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(237,232,224,0.08)] pb-4">
        <div>
          <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#eae1da]">
            我的上架管理
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            C2C PRIVATE COLLECTION LISTINGS
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="h-10 px-5 bg-brand text-[#1A1612] font-sans font-bold text-[13px] rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-md"
        >
          ➕ 新增商品
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(237,232,224,0.08)]">
        {(["active", "pending_trade", "sold", "unlisted"] as const).map(
          (tab) => {
            const labels = {
              active: "出售中現貨",
              pending_trade: "交易中 / 待交收",
              sold: "歷史已售出",
              unlisted: "已暫時下架",
            };
            const count = listings.filter((l) => l.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
              >
                {labels[tab]} ({count})
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
                )}
              </button>
            );
          },
        )}
      </div>

      {/* 列表流 */}
      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="py-16 text-center bg-[#26211C]/40 border border-[rgba(237,232,224,0.04)] rounded-2xl">
            <p className="font-sans text-[13.5px] text-text-disabled">
              該分類下目前沒有卡牌資產紀錄
            </p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 flex flex-col hover:border-[rgba(237,232,224,0.15)] transition-colors group"
            >
              {/* 上半部：實體資訊、詳情與價格看板 */}
              <div className="flex gap-4 items-start w-full">
                <div className="relative w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 shadow-sm">
                  <Image
                    src={item.cardImage}
                    alt={item.cardName}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[9px] text-[#50453b]">
                      #{item.id}
                    </span>
                    <span className="font-mono text-[10px] text-brand font-medium">
                      {item.grade}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-[14.5px] text-[#eae1da] group-hover:text-brand transition-colors truncate">
                    {item.cardName}
                  </h3>
                  <p className="font-mono text-[11px] text-text-secondary">
                    官方卡號:{" "}
                    <span className="text-[#eae1da]">
                      {item.cardNo.toUpperCase()}
                    </span>{" "}
                    · 上架日期: {item.createdAt}
                  </p>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {item.paymentMethods.map((pm) => (
                      <span
                        key={pm}
                        className="font-sans text-[9px] text-text-secondary bg-[#17130f] px-2 py-0.5 rounded-[4px] border border-[rgba(237,232,224,0.04)]"
                      >
                        💸 {pm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <p className="font-mono font-bold text-[16px] text-brand">
                    HK$ {item.price.toLocaleString()}
                  </p>
                  <p className="font-mono text-[9px] text-[#50453b] mt-0.5">
                    👁 {item.views} 點擊 · ★ {item.watchers} 心水
                  </p>
                </div>
              </div>

              {/* ── 🟢 核心修復 1：按鈕下移至 Bottom Line，全面平行 Inline-Flex 排列 ── */}
              {item.status !== "sold" && (
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[rgba(237,232,224,0.06)] w-full">
                  {item.status === "active" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenOrderModal(item)}
                        className="h-9 px-4 bg-brand text-[#1A1612] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        ⚡ 建立交易訂單
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="h-9 px-4 bg-[#17130f] border border-[rgba(237,232,224,0.12)] text-[#d4c4b7] font-sans font-bold text-[12px] rounded-xl hover:text-brand hover:border-brand/40 hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        ⚙️ 修改商品
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className="h-9 px-4 bg-transparent border border-amber-500/40 text-amber-400 font-sans font-bold text-[12px] rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 ml-auto"
                      >
                        ⚙ 暫時下架
                      </button>
                    </>
                  )}

                  {item.status === "pending_trade" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/profile/user/orders/ORD-${item.id}`;
                        }}
                        className="h-9 px-4 bg-[rgba(212,165,116,0.12)] border border-brand/30 text-brand font-sans font-bold text-[12px] rounded-xl hover:bg-brand/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        📦 追蹤交割進度 (進入訂單頁) →
                      </button>
                      <span className="font-mono text-[11px] text-text-disabled ml-auto bg-[#17130f] px-2.5 py-1 rounded border border-white/5">
                        🔒 資產已鎖定
                      </span>
                    </>
                  )}

                  {item.status === "unlisted" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className="h-9 px-4 bg-[#10b981] text-white font-sans font-bold text-[12px] rounded-xl hover:bg-[#0fa573] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        ⚡ 重新上架商品
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="h-9 px-4 bg-[#17130f] border border-[rgba(237,232,224,0.12)] text-[#d4c4b7] font-sans font-bold text-[12px] rounded-xl hover:text-brand hover:border-brand/40 hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        ⚙️ 修改商品
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(item)}
                        className="h-9 px-4 bg-transparent border border-error/50 text-error font-sans font-bold text-[12px] rounded-xl hover:bg-error/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 ml-auto"
                      >
                        🗑️ 取消商品上架
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新增/修改彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[640px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.8)] space-y-5 overflow-y-auto max-h-[90vh] scrollbar-none">
            <div className="border-b border-[rgba(237,232,224,0.06)] pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-[16px] md:text-[18px] text-[#eae1da]">
                  {editingListingId
                    ? "📝 修改商品資料看板"
                    : "⚡ 私人藏品極速放卡上架"}
                </h3>
                <p className="font-mono text-[9px] text-brand uppercase tracking-widest mt-0.5">
                  {editingListingId
                    ? "EDIT LISTING EDITOR"
                    : "C2C EXCHANGE LISTING TERMINAL"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-[#17130f] hover:bg-[#39342f] text-text-disabled hover:text-brand flex items-center justify-center font-mono text-[18px] font-bold active:scale-90 transition-all shadow-inner border border-[rgba(237,232,224,0.04)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="card-search"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    卡牌編號 / 名稱搜尋 <span className="text-warning">*</span>
                  </label>
                  <div className="flex items-center h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                    <input
                      id="card-search"
                      type="text"
                      required
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                      placeholder="例：sv2a-182"
                      className="flex-1 h-full bg-transparent px-4 font-sans text-[13px] text-[#eae1da] placeholder-text-disabled focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewCardName("Charizard ex SAR (噴火龍)")
                      }
                      className="px-4 h-full font-mono text-[11px] font-bold text-brand bg-[#26211C] hover:bg-[#39342f] transition-colors border-l border-[rgba(237,232,224,0.08)] active:scale-98"
                    >
                      搜尋
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ask-price"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    出讓售價 (HK$) <span className="text-warning">*</span>
                  </label>
                  <div className="flex items-center h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                    <span className="px-3 font-mono text-[13px] font-bold text-brand border-r border-[rgba(237,232,224,0.08)] bg-[#26211C]">
                      HK$
                    </span>
                    <input
                      id="ask-price"
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="0"
                      className="flex-1 h-full bg-transparent px-4 font-mono text-[14px] text-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="card-grade"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    裸卡品相分級
                  </label>
                  <select
                    id="card-grade"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none appearance-none"
                  >
                    <option value="【美品 S】">【美品 S】無傷完美收藏卡</option>
                    <option value="【微傷 A】">
                      【微傷 A】初期微白邊/微劃痕
                    </option>
                    <option value="【傷あり B】">
                      【傷あり B】打牌實用略有傷痕
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="condition-notes"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    官方卡號 / 額外品相備註
                  </label>
                  <input
                    id="condition-notes"
                    type="text"
                    value={newCardNo}
                    onChange={(e) => setNewCardNo(e.target.value)}
                    placeholder="例：sv2a-182 四角無白邊"
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] placeholder-text-disabled focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide">
                  實物照片存證 (必須 4–6 張){" "}
                  <span className="text-warning">*</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${i < 2 ? "border-brand/40 bg-[rgba(212,165,116,0.06)]" : "border-[rgba(237,232,224,0.12)] bg-[#17130f] hover:border-brand/30"}`}
                      onClick={() =>
                        toast("📸 模擬調用相機上傳相片", {
                          description:
                            "目前仍為前端示意流程，後續會接入真實圖片上傳。",
                        })
                      }
                    >
                      {i < 2 ? (
                        <span className="font-mono text-[10px] text-brand font-bold">
                          ✓ 已上傳
                        </span>
                      ) : (
                        <>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#50453b"
                            strokeWidth="2"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span className="font-mono text-[8px] text-text-disabled mt-1 font-semibold">
                            {i < 4 ? "必填" : "選填"}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 font-sans text-[13px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-[#39342f] active:scale-[0.98] transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-brand text-[#1A1612] font-sans font-bold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shadow-md"
                >
                  {editingListingId
                    ? "💾 儲存修改"
                    : "⚡ 確認部署至全港現貨大盤"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 建立交易訂單彈窗 */}
      {showOrderModal && selectedListing && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[640px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.8)] space-y-5 overflow-y-auto max-h-[90vh] scrollbar-none">
            <div className="border-b border-[rgba(237,232,224,0.06)] pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-[16px] md:text-[18px] text-[#eae1da]">
                  📝 為此複刻商品建立實時交易單
                </h3>
                <p className="font-mono text-[9px] text-brand uppercase tracking-widest mt-0.5">
                  MANUAL TRANSACTION INVOICE TERMINAL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-9 h-9 rounded-full bg-[#17130f] hover:bg-[#39342f] text-text-disabled hover:text-brand flex items-center justify-center font-mono text-[18px] font-bold active:scale-90 transition-all border border-white/5"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 items-center p-3 bg-[#17130f] rounded-xl border border-white/5">
              <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={selectedListing.cardImage}
                  alt={selectedListing.cardName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-sans font-bold text-[13px] text-[#eae1da] truncate">
                  {selectedListing.cardName}
                </h4>
                <p className="font-mono text-[11px] text-brand mt-0.5">
                  {selectedListing.cardNo.toUpperCase()} ·{" "}
                  {selectedListing.grade}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTransactionOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="buyer-id"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    買家會員名稱 / 對話房間 ID{" "}
                    <span className="text-warning">*</span>
                  </label>
                  <input
                    id="buyer-id"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="例：九龍灣阿木"
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-[#eae1da] focus:outline-none focus:border-brand/40"
                  />
                </div>
                <div>
                  <label
                    htmlFor="final-price"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    最終議定成交價 (HK$) <span className="text-warning">*</span>
                  </label>
                  <div className="flex items-center h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                    <span className="px-3 font-mono text-[13px] font-bold text-brand bg-[#26211C] border-r border-white/5">
                      HK$
                    </span>
                    <input
                      id="final-price"
                      type="number"
                      required
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      className="flex-1 h-full bg-transparent px-4 font-mono text-[14px] text-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide">
                  雙方協定交收選項 <span className="text-warning">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTradeMethod("meetup")}
                    className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${tradeMethod === "meetup" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
                  >
                    🤝 [ 見面交易 ]
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeMethod("delivery")}
                    className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${tradeMethod === "delivery" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
                  >
                    📦 [ 送貨 / 物流 ]
                  </button>
                </div>
              </div>

              {tradeMethod === "meetup" ? (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label
                      htmlFor="meetup-loc"
                      className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                    >
                      面交地點與約定時間備註{" "}
                      <span className="text-warning">*</span>
                    </label>
                    <input
                      id="meetup-loc"
                      type="text"
                      required
                      value={meetupLocation}
                      onChange={(e) => setMeetupLocation(e.target.value)}
                      placeholder="例：旺角站 A 出口"
                      className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-[#eae1da] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="order-tel"
                        className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                      >
                        買家聯絡電話 (香港手提){" "}
                        <span className="text-warning">*</span>
                      </label>
                      <input
                        id="order-tel"
                        type="tel"
                        required
                        maxLength={8}
                        value={orderPhone}
                        onChange={(e) => setOrderPhone(e.target.value)}
                        placeholder="91234567"
                        className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-[#eae1da] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="locker-type"
                        className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                      >
                        物流網點類別
                      </label>
                      <select
                        id="locker-type"
                        value={orderLockerType}
                        onChange={(e) => setOrderLockerType(e.target.value)}
                        className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none"
                      >
                        <option value="852-smart-locker">
                          順豐智能櫃 (852櫃)
                        </option>
                        <option value="sf-station">順豐營業點 / 順豐站</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="shipping-addr"
                      className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                    >
                      自提點代碼與詳細收貨地址{" "}
                      <span className="text-warning">*</span>
                    </label>
                    <input
                      id="shipping-addr"
                      type="text"
                      required
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="例：H852UA14P 旺角中心"
                      className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-[#eae1da] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 h-11 font-sans text-[13px] font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-[#39342f] active:scale-[0.98]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-brand text-[#1A1612] font-sans font-bold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98]"
                >
                  ⚡ 確認為買家產生交易單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 🟢 全新加碼：自訂取消商品上架二次確認彈窗 ── */}
      {showCancelModal && cancelTargetListing && (
        <div className="fixed inset-0 z-[310] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[440px] bg-[#26211C] border border-red-500/20 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-4">
            <div className="flex items-center gap-3 text-error">
              <span className="text-[24px]">⚠️</span>
              <h3 className="font-sans font-black text-[16px] md:text-[17px] text-[#eae1da]">
                確認要完全下架並刪除商品？
              </h3>
            </div>

            <p className="font-sans text-[13px] text-[#d4c4b7] leading-relaxed">
              您正準備永久取消上架商品：
              <span className="text-brand font-bold">
                {cancelTargetListing.cardName}
              </span>
              。此動作將會清除其在大盤上累積嘅點擊率與心水紀錄，且無法復原。
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelTargetListing(null);
                }}
                className="flex-1 h-10 bg-[#17130f] border border-white/10 text-text-secondary font-sans font-bold text-[12px] rounded-xl hover:text-text-primary hover:bg-white/5 transition-all active:scale-95"
              >
                先留著
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelListing}
                className="flex-1 h-10 bg-error text-white font-sans font-bold text-[12px] rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-md"
              >
                💥 確定取消並刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
