type CertifiedMerchantBadgeProps = {
  className?: string;
  label?: string;
};

export function CertifiedMerchantBadge({
  className = "",
  label = "認證商戶",
}: CertifiedMerchantBadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center font-mono font-bold text-[9px] text-brand bg-[rgba(212,165,116,0.06)] border border-brand/20 px-1.5 py-0.5 rounded-[3px] max-w-max select-none tracking-wide " +
        className
      }
    >
      {label}
    </span>
  );
}
