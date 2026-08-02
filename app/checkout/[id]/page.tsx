"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
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
import {
  createMerchantOrderPaymentIntent,
  getMerchantCheckoutPaymentStatus,
  loadMerchantCheckoutOrder,
  type MerchantCheckoutOrder,
} from "@/app/actions/merchant-checkout";
import { usePaymentCountdown } from "@/app/lib/hooks/usePaymentCountdown";
import {
  AUTHENTICATION_FEE,
  computeCourierShippingFee,
  type MerchantShippingMethod,
} from "@/lib/merchant-checkout/pricing";

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

// Available Coupon Repository
interface Coupon {
  code: string;
  label: string;
  discount: number;
}

// 優惠券後端（platform coupons）未落地，Milestone 1 一律唔折扣。
const AVAILABLE_COUPONS: Coupon[] = [];

const stripePromiseCache = new Map<string, Promise<StripeJs | null>>();

function getStripePromise(publishableKey: string): Promise<StripeJs | null> {
  const cached = stripePromiseCache.get(publishableKey);
  if (cached) {
    return cached;
  }
  const promise = loadStripe(publishableKey);
  stripePromiseCache.set(publishableKey, promise);
  return promise;
}

const ESCROW_POLL_INTERVAL_MS = 2000;
const ESCROW_POLL_MAX_ATTEMPTS = 8;

function isMerchantPaymentIntentAuthorized(
  status: string | undefined,
): boolean {
  return (
    status === "succeeded" ||
    status === "processing" ||
    status === "requires_capture"
  );
}

async function pollMerchantCheckoutPaid(orderId: string): Promise<boolean> {
  for (let attempt = 0; attempt < ESCROW_POLL_MAX_ATTEMPTS; attempt += 1) {
    const result = await getMerchantCheckoutPaymentStatus(orderId);
    if (
      result.success &&
      result.data.escrowStatus !== "pending_payment"
    ) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, ESCROW_POLL_INTERVAL_MS));
  }
  return false;
}

function EscrowPaymentForm({
  orderId,
  totalAmount,
}: {
  orderId: string;
  totalAmount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsConfirming(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${orderId}/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setIsConfirming(false);
      toast.error("⚠️ 付款未完成", {
        description: error.message ?? "請確認卡片資料後重試。",
      });
      return;
    }

    if (isMerchantPaymentIntentAuthorized(paymentIntent?.status)) {
      const settled = await pollMerchantCheckoutPaid(orderId);
      if (settled) {
        toast.success("🎉 付款已送出！", {
          description: "資金正在進入平台託管，稍後即可於交易管理查看。",
        });
      } else {
        toast.info("付款處理中", {
          description: "已收到付款指令，正在等待金流確認並鎖定託管。",
        });
      }
      router.push(`/checkout/${orderId}/success`);
      return;
    }

    setIsConfirming(false);
    toast.info("付款仍待完成", {
      description: "請依指示完成驗證後再試。",
    });
  };

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="button"
        disabled={isConfirming || !stripe || !elements}
        onClick={handleConfirm}
        className="w-full h-12 bg-brand text-[#1A1612] font-sans font-bold text-[14px] rounded-xl hover:bg-[#e8b896] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer focus:outline-none"
      >
        {isConfirming ? (
          <>
            <Spinner className="text-[#1A1612] size-4 animate-spin" />
            <span>正在處理安全金流支付...</span>
          </>
        ) : (
          <span>🔒 確認支付 HK$ {totalAmount.toLocaleString()}</span>
        )}
      </button>
    </div>
  );
}

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
  const [shippingType, setShippingType] = useState<MerchantShippingMethod>("sf");
  const [sfLockerCode, setSfLockerCode] = useState("");
  const [sfAddress, setSfAddress] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [meetupDetail, setMeetupDetail] = useState("");

  // NEW: Authentication service toggle
  const [authServiceEnabled, setAuthServiceEnabled] = useState(false);

  // NEW: Multi-select coupons state
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  // Buyer remarks
  const [buyerRemark, setBuyerRemark] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Stripe escrow payment wiring
  const [order, setOrder] = useState<MerchantCheckoutOrder | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      const result = await loadMerchantCheckoutOrder(paramsId);
      if (cancelled) {
        return;
      }

      if (!result.success) {
        setLoadError(result.error);
        setOrder(null);
        setIsLoadingOrder(false);
        return;
      }

      setOrder(result.data);
      setAuthServiceEnabled(result.data.requiresAuthentication);
      if (result.data.shippingMethod) {
        setShippingType(result.data.shippingMethod);
      }
      setLoadError(null);
      setIsLoadingOrder(false);
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [paramsId]);

  const stripeInstance = useMemo(
    () => (publishableKey ? getStripePromise(publishableKey) : null),
    [publishableKey],
  );

  const { countdownLabel, isExpired, isExpiringSoon } = usePaymentCountdown(
    order?.escrowStatus === "pending_payment" ? order.paymentExpiresAt : null,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-sans text-[14px] text-[#d4c4b7]">
          {loadError ?? "找不到此結帳訂單"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/profile/user/trading")}
          className="h-11 px-5 rounded-xl bg-brand text-[#1A1612] font-sans font-bold text-[13.5px] focus:outline-none"
        >
          前往交易管理
        </button>
      </div>
    );
  }

  const currentItem: CheckoutItem = {
    id: order.orderNumber ?? order.orderId,
    name: order.product.cardName,
    set: order.product.setCode,
    rarity: order.product.displayId ?? order.product.cardNumber ?? "—",
    grade: order.product.gradeLabel,
    price: order.itemSubtotal,
    image: order.product.imageUrl,
    seller: order.merchant.shopName,
  };

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
  const shippingFee =
    shippingType === "sf"
      ? computeCourierShippingFee({
          shippingMethod: "sf",
          baseFee: order.baseCourierShippingFee,
          extraFee: order.listingExtraShippingFee,
        })
      : 0;
  const authFee = authServiceEnabled ? AUTHENTICATION_FEE : 0;
  const totalDiscount = selectedCoupons.reduce((sum, code) => {
    const coupon = AVAILABLE_COUPONS.find((c) => c.code === code);
    return sum + (coupon?.discount || 0);
  }, 0);
  const finalTotal = Math.max(
    itemSubtotal + shippingFee + authFee - totalDiscount,
    0,
  );

  const handleProceedToPayment = async () => {
    if (isExpired) {
      toast.error("付款期限已過", {
        description: "此訂單已逾期，請返回市集重新下單。",
      });
      return;
    }

    if (shippingType === "sf" && (!sfLockerCode || !buyerPhone)) {
      toast.error("⚠️ 資料未補全", {
        description: "請填寫順豐自提櫃代碼及聯絡電話。",
      });
      return;
    }

    if (shippingType === "meetup" && !meetupDetail.trim()) {
      toast.error("⚠️ 資料未補全", {
        description: "請填寫面交地點與時間備註。",
      });
      return;
    }

    // 🚀 Lock state and trigger inline visual spinner directly
    setIsPaying(true);

    toast.info("🔒 正在加密並建立安全託管保障...", {
      description: "託管協定成立中，正在調用 Stripe 安全金流網絡...",
      duration: 2000,
    });

    const result = await createMerchantOrderPaymentIntent(order.orderId, {
      shippingMethod: shippingType,
      useAuth: authServiceEnabled,
      deliveryDetails: {
        sfLockerCode,
        sfAddress,
        buyerPhone,
        meetupDetail,
        buyerRemark,
      },
    });

    setIsPaying(false);

    if (!result.success) {
      toast.error("⚠️ 無法建立託管付款", {
        description: result.error,
      });
      return;
    }

    setPublishableKey(result.data.publishableKey);
    setClientSecret(result.data.clientSecret);
    toast.success("✅ 託管付款已建立", {
      description: `請輸入付款資料以完成 HK$ ${result.data.totalAmount.toLocaleString()} 支付。`,
    });
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

        {!order.isPayable && (
          <div className="bg-[#26211C] border border-brand/20 rounded-2xl p-4">
            <p className="font-sans text-[12.5px] text-brand">
              {order.escrowStatus === "refunded"
                ? "此訂單付款期限已過或已取消，請返回市集重新下單。"
                : "此訂單已完成付款或已進入下一階段，無法重複支付。"}
            </p>
          </div>
        )}

        {order.isPayable && order.paymentExpiresAt ? (
          <div className="bg-[#26211C] border border-brand/20 rounded-2xl p-4 space-y-1">
            <p className="font-sans text-[12.5px] text-text-secondary">
              請於 48 小時內完成託管付款，逾期訂單將自動取消。
            </p>
            <p
              className={
                isExpired || isExpiringSoon
                  ? "font-mono text-[11px] text-warning"
                  : "font-mono text-[11px] text-brand"
              }
            >
              {isExpired ? "付款期限已過" : countdownLabel}
            </p>
          </div>
        ) : null}

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
                  disabled={
                    !order.listingAcceptsAuthentication ||
                    clientSecret !== null
                  }
                  className="data-checked:bg-brand data-unchecked:bg-[#39342f]"
                />
              </div>
              {!order.listingAcceptsAuthentication && (
                <p className="mt-2 font-sans text-[11px] text-text-disabled">
                  此賣家未開放平台鑑定加購服務。
                </p>
              )}
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

            {/* Section 4: Coupon Multi-Select */}
            {AVAILABLE_COUPONS.length > 0 ? (
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
              <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
                🎟️ 4. 使用優惠券
              </h2>

              {/* Base UI Multi-Select Dropdown */}
              <div className="space-y-3">
                <Select
                  value=""
                  disabled={AVAILABLE_COUPONS.length === 0}
                  onValueChange={(value) => {
                    if (value && typeof value === "string") {
                      handleCouponSelect(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-[#17130f] border-white/10 text-[#eae1da] hover:border-brand/30 transition-colors">
                    <SelectValue
                      placeholder="優惠券功能即將開放（本次結帳暫不折扣）"
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
            ) : null}

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
                {shippingType === "sf" && order.listingExtraShippingFee > 0 ? (
                  <p className="font-mono text-[10.5px] text-text-disabled">
                    基本運費 HK$ {order.baseCourierShippingFee} + 附加運費 HK${" "}
                    {order.listingExtraShippingFee}
                  </p>
                ) : null}
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

              {clientSecret && stripeInstance ? (
                <Elements
                  stripe={stripeInstance}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      labels: "floating",
                      variables: {
                        colorPrimary: "#D4A574",
                        colorBackground: "#1A1612",
                        colorText: "#eae1da",
                        colorDanger: "#ef4444",
                        borderRadius: "12px",
                      },
                    },
                  }}
                >
                  <EscrowPaymentForm
                    orderId={order.orderId}
                    totalAmount={finalTotal}
                  />
                </Elements>
              ) : (
                <button
                  type="button"
                  disabled={isPaying || !order.isPayable || isExpired}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
