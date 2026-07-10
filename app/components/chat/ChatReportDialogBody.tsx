"use client";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChatReportDialogBodyProps = {
  reportCategory: string;
  reportDetails: string;
  isSubmitting?: boolean;
  onCategoryChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onConfirm: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCancel: () => void;
};

export function ChatReportDialogBody({
  reportCategory,
  reportDetails,
  isSubmitting = false,
  onCategoryChange,
  onDetailsChange,
  onConfirm,
  onCancel,
}: ChatReportDialogBodyProps) {
  return (
    <AlertDialogContent className="bg-[#26211C] text-[#eae1da] border border-white/10 ring-0 shadow-[0_12px_40px_rgba(239,68,68,0.15)] rounded-2xl max-w-sm p-6 animate-scaleUp">
      <AlertDialogHeader className="text-left place-items-start gap-1">
        <AlertDialogTitle className="text-[16px] font-black text-[#eae1da] flex items-center gap-2">
          🚩 提交交易違規舉報
        </AlertDialogTitle>
        <AlertDialogDescription className="text-[11px] font-mono leading-normal text-[#8A8680] uppercase tracking-wider">
          Secure Risk Mediation Protocol
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-4 py-3 font-sans text-[13px] w-full">
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide">
            選擇舉報事項類別
          </label>
          <Select
            value={reportCategory}
            onValueChange={(value) => onCategoryChange(value ?? "")}
          >
            <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl text-[#eae1da] font-sans text-[12px] hover:bg-[#2c2722] transition-colors focus:ring-0 focus:border-brand/40">
              <SelectValue placeholder="點擊展開合約違規類別" />
            </SelectTrigger>
            <SelectContent className="bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
              <SelectItem
                value="惡意欺詐 / 虛假交易"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                🛑 惡意欺詐 / 虛假交易 (FRAUD)
              </SelectItem>
              <SelectItem
                value="言語辱罵 / 不當言論"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                💬 言語辱罵 / 不當言論 (HARASS)
              </SelectItem>
              <SelectItem
                value="誘導私下交易"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                🔒 誘導私下交易 / 逃避中介 (OFFLINE)
              </SelectItem>
              <SelectItem
                value="其他違規行為"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                ⚙️ 其他違規行為 (OTHER)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="chat-report-details"
            className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide"
          >
            舉報或投訴之詳細事實敍述
          </label>
          <textarea
            id="chat-report-details"
            value={reportDetails}
            onChange={(e) => onDetailsChange(e.target.value)}
            placeholder="請具體提供案發事實（例如：對方提供虛假銀行轉帳截圖、使用冀辱性詞彙等），以利風控官快速調閱對話存證。"
            rows={3}
            className="w-full bg-[#17130f] border border-white/5 rounded-xl text-[12.5px] font-sans text-[#eae1da] placeholder:text-[#50453b] p-3 focus:outline-none focus:border-brand/40 transition-colors resize-none leading-relaxed"
          />
        </div>

        <p className="font-sans text-[11px] leading-normal text-[#8A8680]">
          ⚠️
          聲明：平台嚴格禁止惡意惡作劇或虛假舉報。一經查實虛報，將面臨账戶風控扣分限制。
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-1 w-full">
        <AlertDialogAction
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full h-11 bg-[#ef4444] hover:bg-[#dc2626] text-white font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.18)] active:scale-[0.97] transition-all focus:outline-none"
        >
          {isSubmitting ? "提交中…" : "🚀 確認提交安全審查"}
        </AlertDialogAction>
        <AlertDialogCancel
          onClick={onCancel}
          className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none"
        >
          取消返回
        </AlertDialogCancel>
      </div>
    </AlertDialogContent>
  );
}
