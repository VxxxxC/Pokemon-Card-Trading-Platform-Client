"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Badge {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

interface ProfileHeaderProps {
  member: {
    id: string;
    username: string;
    handle: string;
    joinDate: string;
    avatarSeed: string;
    level: string;
    completedTrades: number;
    bio: string;
    badges: readonly Badge[];
  };
}

export function ProfileHeaderWithChat({ member }: ProfileHeaderProps) {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const [isReportOpen, setIsReportOpen] = useState(false);

  //  智能導流：一偵測到網址有 ?chat=open，一掛載即刻自動向全站發射廣播訊號
  // 完美承接你之前由通知中心點擊跳轉過嚟嘅「原地開片」邏輯！
  useEffect(() => {
    if (chatParam === "open") {
      window.dispatchEvent(
        new CustomEvent("open-global-chat", {
          detail: {
            roomId: member.id,
            partnerName: member.username,
          },
        }),
      );
    }
  }, [chatParam, member.id, member.username]);

  //  按鈕事件：點擊聯絡商戶，直接廣播給頂層組件，拒絕路由轉頁或本地渲染
  const handleActionChat = () => {
    window.dispatchEvent(
      new CustomEvent("open-global-chat", {
        detail: { roomId: member.id, partnerName: member.username },
      }),
    );
  };

  const handleReportConfirm = () => {
    toast.error("⚠️ 舉報信號已受理", {
      description:
        "已對該用戶啟動存證機制，平台合約風控官將於 15 分鐘內介入審查。",
    });
    setIsReportOpen(false);
  };

  return (
    <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-[#2e2925] via-[rgba(140,115,85,0.15)] to-[#2e2925]" />
      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative w-24 h-24 rounded-full border-4 border-[#26211C] shadow-xl overflow-hidden bg-[#17130f]">
            <Image
              src={`https://picsum.photos/seed/${member.avatarSeed}/100/100`}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] text-[#d4c4b7] uppercase">
              總完成交易
            </p>
            <p className="font-mono font-bold text-[20px] text-[#eae1da]">
              {member.completedTrades.toLocaleString()}+
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-sans font-bold text-[24px] text-[#eae1da]">
                {member.username}
              </h1>
              <span className="font-mono text-[10px] bg-gradient-to-r from-[#d4a574]/20 to-[#e8b896]/20 text-[#d4a574] border border-[#d4a574]/30 px-2.5 py-0.5 rounded-full font-medium">
                🏅 {member.level}
              </span>
            </div>

            {/* 🎯 改裝完成：一鍵觸發全域廣播事件 */}
            <button
              onClick={handleActionChat}
              className="h-10 px-5 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.96] transition-all shadow-md"
            >
              💬 聯絡商戶議價
            </button>
          </div>

          <p className="font-mono text-[12px] text-[#50453b] mb-4">
            {member.handle} · {member.joinDate}
          </p>
          <p className="font-sans text-[14px] text-[#d4c4b7] leading-relaxed max-w-2xl">
            {member.bio}
          </p>

          {/* 徽章與舉報區 */}
          <div className="flex flex-wrap items-center justify-between mt-5 gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-1">
              {member.badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.desc}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-lg"
                >
                  <span className="text-[14px]">{badge.emoji}</span>
                  <span className="font-mono text-[11px] text-[#d4c4b7]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
            <AlertDialog open={isReportOpen} onOpenChange={setIsReportOpen}>
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    className="shrink-0 flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[12px] font-medium text-red-400/90 transition-colors font-sans lg:border-transparent lg:bg-transparent lg:text-text-disabled/70 lg:hover:text-red-500"
                  >
                    🚩 舉報用戶
                  </button>
                }
              />
              <AlertDialogContent className="bg-[#26211C] text-[#eae1da] border border-white/10 ring-0 shadow-[0_0_24px_rgba(239,68,68,0.18)]">
                <AlertDialogHeader className="text-left place-items-start gap-2">
                  <AlertDialogTitle className="text-[15px] font-semibold text-[#eae1da]">
                    確認要提交舉報嗎？
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[12.5px] leading-relaxed text-[#d4c4b7]">
                    請注意：PokéTrade JP
                    嚴格禁止惡意惡作劇或虛假舉報。一經查實，平台將扣除您的交易積分，情節嚴重者將面臨賬戶風控限制。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="border-t border-white/10 bg-[#1A1612]/60">
                  <AlertDialogCancel
                    variant="outline"
                    className="border border-white/10 text-[#d4c4b7] hover:bg-white/5"
                  >
                    取消
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    onClick={handleReportConfirm}
                    className="bg-[#ef4444] text-[#1A1612] hover:bg-[#ef4444]/90 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                  >
                    確認提交
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </section>
  );
}
