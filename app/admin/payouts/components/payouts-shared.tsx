"use client";

import {
  FILTER_CHIP_CLASS,
  FORM_SELECT_TRIGGER_CLASS,
  SELECT_CONTENT_CLASS,
  SELECT_ITEM_CLASS,
} from "@/app/admin/campaigns/campaigns-ui";
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
  const labelMap = Object.fromEntries(
    options.map((opt) => [opt.value, opt.label]),
  ) as Record<V, string>;

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 font-sans text-[11px] text-text-secondary">
        排序
      </span>
      <Select
        value={value}
        items={labelMap}
        onValueChange={(next) => onChange(next as V)}
      >
        <SelectTrigger
          aria-label="排序方式"
          className={`${FORM_SELECT_TRIGGER_CLASS} w-44 min-w-44`}
        >
          <SelectValue placeholder="預設排序" />
        </SelectTrigger>
        <SelectContent className={SELECT_CONTENT_CLASS}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={SELECT_ITEM_CLASS}
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
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map(({ key, label, count }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`${FILTER_CHIP_CLASS(selected)} gap-1.5`}
          >
            <span>{label}</span>
            <span
              className={`font-mono text-[10px] tabular-nums ${
                selected ? "text-brand/80" : "text-text-disabled"
              }`}
            >
              {count.toLocaleString("en-US")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
