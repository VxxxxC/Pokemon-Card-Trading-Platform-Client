export function GradeBadge({
  authority,
  score,
}: {
  authority: string;
  score: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[12px] font-medium text-text-primary bg-[rgba(212,165,116,0.15)] rounded-[4px] px-2 py-0.5 shrink-0">
      <span>{authority}</span>
      <span className="text-brand/70">{score}</span>
    </span>
  );
}
