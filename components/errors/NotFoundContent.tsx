import Link from "next/link";

type NotFoundContentProps = {
  title?: string;
  description?: string;
};

export function NotFoundContent({
  title = "找不到頁面",
  description = "您造訪的頁面不存在、已移除，或網址輸入有誤。",
}: NotFoundContentProps) {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-disabled mb-3">
        Error 404
      </p>
      <h1 className="font-sans font-black text-[32px] sm:text-[40px] text-text-primary tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-md font-sans text-[14px] text-text-secondary leading-relaxed">
        {description}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="h-11 px-6 inline-flex items-center justify-center rounded-xl bg-brand text-[#17130f] font-sans text-[14px] font-bold hover:bg-brand-hover transition-colors"
        >
          返回首頁
        </Link>
        <Link
          href="/auth"
          className="h-11 px-6 inline-flex items-center justify-center rounded-xl border border-[rgba(237,232,224,0.15)] text-text-primary font-sans text-[14px] font-medium hover:border-brand/40 hover:text-brand transition-colors"
        >
          登入 / 註冊
        </Link>
      </div>
    </div>
  );
}
