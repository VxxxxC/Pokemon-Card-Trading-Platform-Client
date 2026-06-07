"use client";

import { useState, useSyncExternalStore, use } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface CheckoutItem {
  id: string;
  name: string;
  set: string;
  rarity: string;
  grade: string;
  price: number;
  image: string;
  seller: string;
}

const MOCK_INVENTORY_DATABASE: Record<string, CheckoutItem> = {
  "sv4a-box": {
    id: "sv4a-box",
    name: "Shiny Treasure ex Box (高級擴充包)",
    set: "High Class Pack",
    rarity: "BOX",
    grade: "【全新未拆封】附官方防偽縮膜",
    price: 3500,
    image: "https://picsum.photos/seed/sv4a/400/280",
    seller: "東京秋葉原直送店",
  },
  "sv2a-182": {
    id: "sv2a-182",
    name: "Charizard ex SAR (噴火龍 ex)",
    set: "Pokémon Card 151",
    rarity: "SAR",
    grade: "【美品 S】裸卡直送",
    price: 2150,
    image: "https://picsum.photos/seed/user-zard/400/280",
    seller: "旺角卡店 · 專業認證商戶",
  },
  "sv2a-215": {
    id: "sv2a-215",
    name: "Pikachu AR (經典肥皮卡丘)",
    set: "Pokémon Card 151",
    rarity: "AR",
    grade: "【微傷 A】卡盒割愛",
    price: 620,
    image: "https://picsum.photos/seed/user-pika/400/280",
    seller: "卡牌珍藏家阿木",
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GlobalCheckoutPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Delivery configuration states
  const [shippingType, setShippingType] = useState<"sf" | "meetup">("sf");
  const [sfLockerCode, setSfLockerCode] = useState("H852UA14P");
  const [sfAddress, setSfAddress] = useState("旺角中心地下順豐智能櫃");
  const [buyerPhone, setBuyerPhone] = useState("91234567");
  const [meetupDetail, setMeetupDetail] = useState("旺角站 A 出口閘邊");

  // Promo code & remarks
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponErrorMessage, setCouponErrorMessage] = useState("");
  const [buyerRemark, setBuyerRemark] = useState("");

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentItem =
    MOCK_INVENTORY_DATABASE[listingId] || MOCK_INVENTORY_DATABASE["sv2a-182"];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponErrorMessage("");
    const formattedCode = promoCode.trim().toUpperCase();

    if (formattedCode === "SF-FREE-DUANWU") {
      setAppliedDiscount(30);
      toast.success("🎟️ 優惠券套用成功！", {
        description: "端午現貨節免運費券已生效，已扣減 HK$30 運費。",
      });
    } else if (formattedCode === "WELCOME-TCG-50") {
      setAppliedDiscount(50);
      toast.success("🎟️ 優惠券套用成功！", {
        description: "新手註冊放卡開路禮已生效，總額扣減 HK$50。",
      });
    } else {
      setAppliedDiscount(0);
      setCouponErrorMessage("此代碼不存在或未達到消費門檻。");
      toast.error("❌ 優惠券無效", {
        description: "請檢查折價券代碼大小寫是否正確。",
      });
    }
  };

  const itemSubtotal = currentItem.price;
  const shippingFee = shippingType === "sf" ? 30 : 0;
  const finalTotal = Math.max(itemSubtotal + shippingFee - appliedDiscount, 0);

  const handleProceedToPayment = () => {
    if (shippingType === "sf" && (!sfLockerCode || !buyerPhone)) {
      toast.error("⚠️ 資料未補全", {
        description: "請填寫順豐自提櫃代碼及聯絡電話。",
      });
      return;
    }

    toast.success("🔒 託管協定已成立，正調用 Stripe...", {
      description: "資金將由平台中介賬戶鎖定，直至您確認收貨並複驗品相為止。",
      duration: 5000,
      action: {
        label: "模擬確認付款 💳",
        onClick: () => {
          toast.success("🎉 支付成功！", {
            description: `商品 [${currentItem.name}] 已成功進入安全交割程序。`,
          });
          window.location.href = "/profile/user/trading";
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] p-4 lg:p-8">
      <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
        <div className="border-b border-[rgba(237,232,224,0.08)] pb-4">
          <h1 className="font-sans font-black text-[20px] md:text-[24px] text-[#eae1da]">
            安全交割 Pre-Checkout 確認
          </h1>
          <p className="font-mono text-[9px] text-brand uppercase tracking-widest mt-0.5">
            GLOBAL ESCROW CLEARING PROTOCOL · LISTING TARGET:{" "}
            {listingId.toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Entries Column */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
              <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
                🃏 1. 核對現貨資產品相
              </h2>
              <div className="flex gap-4 items-center bg-[#17130f] p-3 rounded-xl border border-white/5">
                <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <Image
                    src={currentItem.image}
                    alt={currentItem.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="inline-flex font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded">
                    {currentItem.grade}
                  </span>
                  <h3 className="font-sans font-bold text-[14px] text-[#eae1da] truncate">
                    {currentItem.name}
                  </h3>
                  <p className="font-mono text-[11px] text-text-disabled">
                    {currentItem.set} · {currentItem.rarity}
                  </p>
                  <p className="font-sans text-[11px] text-text-secondary truncate">
                    賣方: {currentItem.seller}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
              <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
                📦 2. 選擇配送 / 交收渠道
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingType("sf")}
                  className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${shippingType === "sf" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
                >
                  🚚 順豐速運 (智能櫃/自提)
                </button>
                <button
                  type="button"
                  onClick={() => setShippingType("meetup")}
                  className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${shippingType === "meetup" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
                >
                  🤝 MTR 當面安全面交
                </button>
              </div>

              {shippingType === "sf" ? (
                <div className="space-y-3 pt-2 font-sans text-[13px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="p-tel"
                        className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                      >
                        收件人香港手提電話 *
                      </label>
                      <input
                        id="p-tel"
                        type="tel"
                        maxLength={8}
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="91234567"
                        className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da] font-mono"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="p-code"
                        className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                      >
                        順豐自提點/網點代碼 *
                      </label>
                      <input
                        id="p-code"
                        type="text"
                        value={sfLockerCode}
                        onChange={(e) => setSfLockerCode(e.target.value)}
                        className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da] font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="p-addr"
                      className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                    >
                      詳細網點描述與地址描述
                    </label>
                    <input
                      id="p-addr"
                      type="text"
                      value={sfAddress}
                      onChange={(e) => setSfAddress(e.target.value)}
                      className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 font-sans text-[13px]">
                  <label
                    htmlFor="p-meet"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                  >
                    協定面交車站及時間備註 *
                  </label>
                  <input
                    id="p-meet"
                    type="text"
                    value={meetupDetail}
                    onChange={(e) => setMeetupDetail(e.target.value)}
                    className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da]"
                  />
                </div>
              )}
            </section>

            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-3">
              <label
                htmlFor="p-rem"
                className="font-sans font-bold text-[15px] text-[#eae1da] block"
              >
                ✍️ 3. 給賣家的特殊交割備註 (Remark)
              </label>
              <textarea
                id="p-rem"
                rows={3}
                value={buyerRemark}
                onChange={(e) => setBuyerRemark(e.target.value)}
                placeholder="例：請賣家發貨時加固氣泡紙，避免壓傷卡盒。謝謝！"
                className="w-full bg-[#17130f] border border-white/10 rounded-xl p-3 font-sans text-[13px] text-[#eae1da] resize-none"
              />
            </section>
          </div>

          {/* Pricing Aggregation Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-3">
              <h3 className="font-sans font-bold text-[13.5px] text-[#eae1da]">
                🎟️ 套用全域平台優惠券
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="例：SF-FREE-DUANWU"
                  className="flex-1 h-9 bg-[#17130f] border border-white/10 rounded-lg px-3 font-mono text-[12px] text-brand uppercase"
                />
                <button
                  type="submit"
                  className="h-9 px-4 bg-[#17130f] border border-brand/30 text-brand font-sans font-bold text-[12px] rounded-lg hover:bg-brand/10 transition-colors"
                >
                  套用
                </button>
              </form>
              {couponErrorMessage && (
                <p className="font-sans text-[11px] text-error pl-1">
                  {couponErrorMessage}
                </p>
              )}
            </div>

            <div className="bg-[#26211C] border border-brand/20 rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="font-sans font-bold text-[14.5px] text-[#eae1da] border-b border-white/5 pb-2">
                🧾 訂單財務明細總結
              </h3>
              <div className="space-y-2 font-sans text-[13px] text-[#d4c4b7]">
                <div className="flex justify-between">
                  <span>卡牌商品總額</span>
                  <span className="font-mono text-[#eae1da]">
                    HK$ {itemSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>配送服務資產</span>
                  <span className="font-mono text-[#eae1da]">
                    HK$ {shippingFee}
                  </span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-[#10b981] font-semibold">
                    <span>券證及優惠碼折扣扣減</span>
                    <span className="font-mono">- HK$ {appliedDiscount}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-[#eae1da]">
                    託管安全支付總額
                  </span>
                  <span className="font-mono font-black text-[22px] text-brand">
                    HK$ {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-[#17130f] rounded-xl p-3 border border-white/5 space-y-1">
                <p className="font-sans font-bold text-[11px] text-brand">
                  🔒 Platform Escrow 託管安全防護中
                </p>
                <p className="font-sans text-[10.5px] text-text-disabled leading-relaxed">
                  本筆資金將由 Stripe
                  託管鎖定。在您確認收貨、複驗品相前，賣家無法提現。
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full h-12 bg-brand text-[#1A1612] font-sans font-bold text-[14px] rounded-xl hover:bg-[#e8b896] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                ⚡ 鎖定資產並進入安全託管支付
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
