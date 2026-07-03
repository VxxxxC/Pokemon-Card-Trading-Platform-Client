import type { Metadata } from "next";
import { NotFoundContent } from "@/components/errors/NotFoundContent";

export const metadata: Metadata = {
  title: "找不到頁面",
  description: "您造訪的頁面不存在。",
};

export default function NotFound() {
  return <NotFoundContent />;
}
