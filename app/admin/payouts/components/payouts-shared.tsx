"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SortSelect<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-sans text-[11px] text-text-secondary whitespace-nowrap">
        排序
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as V)}>
        <SelectTrigger
          aria-label="排序方式"
          className="w-44 min-w-44 min-h-[44px] h-11 bg-[#26211C] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40"
        >
          <SelectValue placeholder="預設排序">
            {options.find((opt) => opt.value === value)?.label ?? "預設排序"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-[44px] focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterChips<K extends string>({
  options,
  active,
  onSelect,
}: {
  options: { key: K; label: string; count: number }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
      {options.map(({ key, label, count }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`min-h-[44px] px-3 py-1 rounded-lg font-sans text-[11px] transition-colors border ${
              selected
                ? "bg-brand/10 text-brand font-semibold border-brand/40"
                : "text-text-secondary border-white/10 hover:text-text-primary hover:border-white/20"
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}
