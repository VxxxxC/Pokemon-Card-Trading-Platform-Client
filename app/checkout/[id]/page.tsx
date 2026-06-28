"use client";

import { useState, useSyncExternalStore, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { IoChevronBack } from "react-icons/io5";

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

// Available Coupon Repository
interface Coupon {
  code: string;
  label: string;
  discount: number;
}

const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "WELCOME-TCG-50",
    label: "🎟️ 新手註冊放卡開路禮 (減 HK$50)",
    discount: 50,
  },
  {
    code: "SF-FREE-DUANWU",
    label: "🎟️ 端午現貨節免運費券 (減 HK$30)",
    discount: 30,
  },
  {
    code: "VIP-DISCOUNT-100",
    label: "🎟️ 核心散戶尊享高能券 (減 HK$100)",
    discount: 100,
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GlobalCheckoutPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const paramsId = resolvedParams.id;
  const router = useRouter();

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

  // NEW: Authentication service toggle
  const [authServiceEnabled, setAuthServiceEnabled] = useState(false);

  // NEW: Multi-select coupons state
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  // Buyer remarks
  const [buyerRemark, setBuyerRemark] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentItem =
    MOCK_INVENTORY_DATABASE[paramsId] || MOCK_INVENTORY_DATABASE["sv2a-182"];

  // Handle coupon selection from dropdown
  const handleCouponSelect = (couponCode: string) => {
    if (!selectedCoupons.includes(couponCode)) {
      setSelectedCoupons([...selectedCoupons, couponCode]);
      const coupon = AVAILABLE_COUPONS.find((c) => c.code === couponCode);
      if (coupon) {
        toast.success("🎟️ 優惠券已選擇", {
          description: `${coupon.label} 已添加到訂單。`,
        });
      }
    }
  };

  // Remove coupon badge
  const handleRemoveCoupon = (couponCode: string) => {
    setSelectedCoupons(selectedCoupons.filter((code) => code !== couponCode));
    toast.info("券證已移除", {
      description: "優惠券已從訂單中移除。",
    });
  };

  // Financial calculations
  const itemSubtotal = currentItem.price;
  const shippingFee = shippingType === "sf" ? 30 : 0;
  const authFee = authServiceEnabled ? 150 : 0;
  const totalDiscount = selectedCoupons.reduce((sum, code) => {
    const coupon = AVAILABLE_COUPONS.find((c) => c.code === code);
    return sum + (coupon?.discount || 0);
  }, 0);
  const finalTotal = Math.max(
    itemSubtotal + shippingFee + authFee - totalDiscount,
    0,
  );

  const handleProceedToPayment = () => {
    if (shippingType === "sf" && (!sfLockerCode || !buyerPhone)) {
      toast.error("⚠️ 資料未補全", {
        description: "請填寫順豐自提櫃代碼及聯絡電話。",
      });
      return;
    }

    // 🚀 Lock state and trigger inline visual spinner directly
    setIsPaying(true);

    toast.info("🔒 正在加密並建立安全託管保障...", {
      description: "託管協定成立中，正在調用 Stripe 安全金流網絡...",
      duration: 2000,
    });

    // ⏱️ Simulate 2-second real network handshake delay latency
    setTimeout(() => {
      // TODO: [API / STRIPE WEBHOCK]: Real backend integration checks hook here
      setIsPaying(false);

      toast.success("🎉 支付成功！", {
        description: `商品 [${currentItem.name}] 已成功進入中介安全交割程序。`,
      });

      router.push(`/checkout/${paramsId}/success`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] p-4 lg:p-8">
      <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
        <div className="border-b border-[rgba(237,232,224,0.08)] pb-4">
          <h1 className="font-sans font-black text-[20px] md:text-[24px] text-[#eae1da]">
            商品交易確認
          </h1>
          <p className="font-mono text-[9px] text-brand uppercase tracking-widest mt-0.5">
            {currentItem.name}・商品序號: {currentItem.id}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Entries Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Asset Verification */}
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

            {/* Section 2: Delivery Channel */}
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

            {/* Section 3: Authentication Service (NEW) */}
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
                    🔍 3. 啟用鑑定服務
                  </h2>
                  <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
                    專業第三方官方認證、複驗品相及真偽防偽包裝
                  </p>
                </div>
                <Switch
                  checked={authServiceEnabled}
                  onCheckedChange={setAuthServiceEnabled}
                  className="data-checked:bg-brand data-unchecked:bg-[#39342f]"
                />
              </div>
              {authServiceEnabled && (
                <div className="mt-3 bg-[#17130f] rounded-xl p-3 border border-brand/20">
                  <p className="font-sans text-[11px] text-brand leading-relaxed">
                    ✓
                    鑑定服務已啟用：將由專業第三方鑑定機構對卡牌進行全面品相檢測，並提供官方認證報告。鑑定費用
                    HK$150 將計入訂單總額。
                  </p>
                </div>
              )}
            </section>

            {/* Section 4: Coupon Multi-Select (NEW) */}
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
              <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
                🎟️ 4. 使用優惠券
              </h2>

              {/* Base UI Multi-Select Dropdown */}
              <div className="space-y-3">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && typeof value === "string") {
                      handleCouponSelect(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-[#17130f] border-white/10 text-[#eae1da] hover:border-brand/30 transition-colors">
                    <SelectValue
                      placeholder="選擇優惠券..."
                      className="text-[#d4c4b7]"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#26211C] border-white/10">
                    <SelectGroup>
                      {AVAILABLE_COUPONS.filter(
                        (coupon) => !selectedCoupons.includes(coupon.code),
                      ).map((coupon) => (
                        <SelectItem
                          key={coupon.code}
                          value={coupon.code}
                          className="text-[#eae1da] focus:bg-brand/10 focus:text-brand"
                        >
                          {coupon.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Badge Tags Render Block */}
                {selectedCoupons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCoupons.map((code) => {
                      const coupon = AVAILABLE_COUPONS.find(
                        (c) => c.code === code,
                      );
                      return (
                        <div
                          key={code}
                          className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 rounded-full px-3 py-1.5 text-[12px] font-sans text-brand"
                        >
                          <span className="font-mono font-bold">
                            {coupon?.code}
                          </span>
                          <span className="text-[#d4c4b7]">
                            (- HK${coupon?.discount})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoupon(code)}
                            className="ml-1 hover:bg-brand/20 rounded-full p-0.5 transition-colors"
                            aria-label="移除優惠券"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Section 5: Buyer Remarks (Renumbered) */}
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-3">
              <label
                htmlFor="p-rem"
                className="font-sans font-bold text-[15px] text-[#eae1da] block"
              >
                ✍️ 5. 給賣家的特殊交割備註 (Remark)
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
                {/* NEW: Authentication Fee Row */}
                <div className="flex justify-between">
                  <span>官方第三方鑑定費</span>
                  <span
                    className={`font-mono ${authServiceEnabled ? "text-brand font-semibold" : "text-[#eae1da]"}`}
                  >
                    HK$ {authFee}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[#10b981] font-semibold">
                    <span>券證及優惠碼折扣扣減</span>
                    <span className="font-mono">- HK$ {totalDiscount}</span>
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
                disabled={isPaying}
                onClick={handleProceedToPayment}
                className="w-full h-12 bg-brand text-[#1A1612] font-sans font-bold text-[14px] rounded-xl hover:bg-[#e8b896] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer focus:outline-none"
              >
                {isPaying ? (
                  <>
                    <Spinner className="text-[#1A1612] size-4 animate-spin" />
                    <span>正在處理安全金流支付...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ 鎖定資產並進入安全託管支付</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
