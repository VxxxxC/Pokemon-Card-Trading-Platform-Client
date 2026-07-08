import Link from "next/link";

export default function PublicProfileNotFound() {
  return (
    <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center">
      <h1 className="text-xl font-sans font-bold text-text-disabled">
        找不到此用戶檔案
      </h1>
      <Link
        href="/marketplace"
        className="text-brand text-sm mt-2 hover:underline"
      >
        ← 返回交易所大盤
      </Link>
    </div>
  );
}
