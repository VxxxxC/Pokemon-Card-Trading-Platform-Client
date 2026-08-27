type GradeBadgeProps = {
  authority: string;
  score: string;
  size?: "sm" | "md";
};

export function GradeBadge({
  authority,
  score,
  size = "md",
}: GradeBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand/15"
      : "gap-1 text-[12px] px-2 py-0.5 rounded-[4px] bg-[rgba(212,165,116,0.15)]";

  return (
    <span
      className={`inline-flex items-center font-mono font-medium text-text-primary shrink-0 ${sizeClass}`}
    >
      <span>{authority}</span>
      <span className="text-brand/70">{score}</span>
    </span>
  );
}
