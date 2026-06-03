"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans bg-[#26211C] text-[#eae1da] border border-[rgba(237,232,224,0.08)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] px-4 py-3.5",
          description: "text-[#d4c4b7] font-sans text-[12px] mt-0.5",
          actionButton:
            "bg-brand text-[#1A1612] font-sans font-bold text-[11px] rounded-lg h-7 px-3 hover:bg-[#e8b896] transition-colors cursor-pointer",
          cancelButton:
            "bg-[#17130f] text-[#d4c4b7] font-sans text-[11px] rounded-lg h-7 px-3",
          success:
            "border-[#10b981]/30 bg-linear-to-r from-[#26211C] to-[#10b981]/5 text-[#10b981]",
          error:
            "border-error/30 bg-linear-to-r from-[#26211C] to-error/5 text-error",
          warning:
            "border-amber-500/30 bg-linear-to-r from-[#26211C] to-amber-500/5 text-amber-400",
        },
      }}
      {...props}
    />
  );
}
