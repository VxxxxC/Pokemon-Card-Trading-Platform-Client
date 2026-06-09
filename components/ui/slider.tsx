import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-[#17130f] border border-white/5 select-none data-horizontal:h-[6px] data-horizontal:w-full data-vertical:h-full data-vertical:w-[6px]"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-gradient-to-r from-[#d4a574] to-[#e8c396] select-none data-horizontal:h-full data-vertical:w-full shadow-[0_0_8px_rgba(212,165,116,0.3)]"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-[14px] shrink-0 rounded-full border-2 border-[#d4a574] bg-[#26211C] shadow-[0_2px_8px_rgba(0,0,0,0.4)] ring-[#d4a574]/30 transition-[color,box-shadow,transform] select-none after:absolute after:-inset-2 hover:ring-4 hover:scale-110 hover:border-[#e8c396] focus-visible:ring-4 focus-visible:scale-110 focus-visible:outline-hidden active:ring-4 active:scale-105 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
