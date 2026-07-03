import type { ReactNode } from "react";
import Link from "next/link";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AuthFormShell({
  title,
  description,
  children,
  backHref = "/auth",
  backLabel = "返回登入",
}: AuthFormShellProps) {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block mb-8 font-sans font-bold text-[18px] text-text-primary tracking-tight hover:text-brand transition-colors"
        >
          HKCardVault <span className="text-brand">JP</span>
        </Link>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-6 shadow-md">
          <h1 className="font-sans font-bold text-[22px] text-text-primary tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 font-sans text-[14px] text-text-secondary leading-relaxed">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>

        <Link
          href={backHref}
          className="mt-6 inline-flex items-center gap-1.5 font-sans text-[13px] text-text-secondary hover:text-brand transition-colors"
        >
          ← {backLabel}
        </Link>
      </div>
    </div>
  );
}
