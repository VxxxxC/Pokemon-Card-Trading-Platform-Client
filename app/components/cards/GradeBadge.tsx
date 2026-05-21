export function GradeBadge({
  authority,
  score,
}: {
  authority: string;
  score: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[12px] font-medium text-white bg-[#202124] rounded-[4px] px-2 py-0.5 shrink-0">
      <span>{authority}</span>
      <span className="text-[rgba(248,249,250,0.7)]">{score}</span>
    </span>
  );
}
