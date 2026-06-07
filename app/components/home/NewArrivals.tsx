"use client";

import { useState, useRef, useEffect, PointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimationControls, PanInfo } from "framer-motion";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";

const newArrivals: MarketplaceListing[] = [
  {
    id: "sv4a-330",
    name: "Gardevoir ex",
    set: "Shiny Treasure ex",
    rarity: "SAR",
    grade: { authority: "RAW", score: "【美品 S】" },
    price: 880,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-gardevoir/400/280",
    seller: "卡牌玩家HK",
  },
  {
    id: "sv2a-210",
    name: "Mew ex",
    set: "151",
    rarity: "SR",
    grade: { authority: "RAW", score: "【微傷 A】" },
    price: 520,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-mew/400/280",
    seller: "收藏達人",
  },
  {
    id: "sv6a-095",
    name: "Ceruledge ex",
    set: "Night Wanderer",
    rarity: "SR",
    grade: { authority: "RAW", score: "【美品 S】" },
    price: 380,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-ceruledge/400/280",
    seller: "旺角卡店",
  },
];

export function NewArrivals() {
  // 三倍鏡像數據，確保自由來回拖拽時左右都有充足的卡牌墊底
  const tripleArrivals = [...newArrivals, ...newArrivals, ...newArrivals];

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const currentX = useRef(0);

  // 計算拖拽邊界物理像素，鎖死兩端不脫軌
  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const trackWidth = trackRef.current.scrollWidth;
      // 限制只能在軌道範圍內左右拖
      setDragConstraints({
        left: -(trackWidth - containerWidth),
        right: 0,
      });
    }
  }, [tripleArrivals.length]);

  // 核心自動滑行邏輯：用 requestAnimationFrame 穩定驅動，手勢釋放後自動接管繼續滑
  useEffect(() => {
    let animationFrameId: number;
    const speed = 0.6; // 控制大盤自動滑行的極致均速（像素/幀）

    const animate = () => {
      if (!isUserInteracting && trackRef.current) {
        currentX.current -= speed;

        // 智能無限循環重置：當滑行過半（完成第一組鏡像）時，無縫彈回起點
        const halfWidth = trackRef.current.scrollWidth / 3;
        if (Math.abs(currentX.current) >= halfWidth * 2) {
          currentX.current = -halfWidth;
        }

        controls.set({ x: currentX.current });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isUserInteracting, controls]);

  // 監聽拖拽中狀態，實時同步物理位移
  const handleDrag = (
    event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (trackRef.current) {
      currentX.current += info.delta.x;
    }
  };

  return (
    <section
      className="mb-8 overflow-hidden"
      aria-labelledby="arrivals-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            id="arrivals-heading"
            className="font-sans font-bold text-[18px] md:text-[22px] text-[#eae1da]"
          >
            最新 C2C 現貨上架
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            FRESHLY UNBOXED PRIVATE LISTINGS
          </p>
        </div>
        <Link
          href="/marketplace?filter=c2c&sort=newest"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      {/* 外圍溢出隱藏傳送外框 */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden pb-4 -mx-1 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => setIsUserInteracting(true)}
        onMouseLeave={() => setIsUserInteracting(false)}
        onTouchStart={() => setIsUserInteracting(true)}
        onTouchEnd={() => setIsUserInteracting(false)}
      >
        {/* 換上 drag="x" 鋼鐵履帶！滑鼠撳住/手指觸控均可自由甩前、撥後 */}
        <motion.div
          ref={trackRef}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          onDrag={handleDrag}
          animate={controls}
          className="flex gap-4 w-max active:cursor-grabbing cursor-grab"
        >
          {tripleArrivals.map((item, index) => (
            <article
              key={`${item.id}-${index}`}
              // 防止滑鼠拖拽按鈕時誤觸 Link 跳轉，提升用戶手勢操控體驗
              onClick={(e) => isUserInteracting && e.stopPropagation()}
              className="shrink-0 w-[175px] sm:w-[195px] md:w-[225px] bg-[#26211C] rounded-[14px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.55)] hover:border-brand/30 transition-all overflow-hidden group flex flex-col justify-between select-none"
            >
              <div>
                {/* 內部圖片與跳轉連結 */}
                <Link
                  href={`/marketplace?card=${item.id}`}
                  className="block relative w-full aspect-[3/4] overflow-hidden bg-[#1A1612]"
                  onClick={(e) => isUserInteracting && e.preventDefault()}
                >
                  <Image
                    src={item.image}
                    alt={`${item.name} — ${item.rarity}`}
                    fill
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-500 pointer-events-none"
                    sizes="(max-width: 768px) 180px, 230px"
                    unoptimized
                  />
                  <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-bold text-text-primary bg-[rgba(23,19,15,0.85)] backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-white/10">
                    {item.grade.score}
                  </span>
                  <span className="absolute top-2.5 right-2.5 font-mono text-[10px] font-bold text-brand bg-[#26211C]/90 backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-brand/30">
                    {item.rarity}
                  </span>
                  <span className="absolute bottom-0 right-0 left-0 text-center font-mono text-[10px] text-text-disabled bg-[rgba(23,19,15,0.75)] backdrop-blur-md py-1">
                    剛剛上架
                  </span>
                </Link>

                <div className="p-3.5 space-y-1.5">
                  <div>
                    <h3 className="font-sans font-bold text-[13.5px] md:text-[14.5px] text-[#eae1da] truncate leading-tight mb-0.5">
                      {item.name}
                    </h3>
                    <span className="font-mono text-[10px] text-text-disabled block truncate">
                      {item.set}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <p className="font-mono font-bold text-[14.5px] md:text-[16px] text-[#eae1da] leading-none">
                      HK$ {item.price.toLocaleString()}
                    </p>
                    <span className="font-sans text-[10px] text-text-secondary truncate max-w-[75px] text-right">
                      {item.seller}
                    </span>
                  </div>
                </div>
              </div>

              {/* 原子交易按鈕列 */}
              <div className="px-3.5 pb-4 pt-1 w-full">
                <BuyButton listing={item} className="w-full py-1.5 h-8.5" />
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
