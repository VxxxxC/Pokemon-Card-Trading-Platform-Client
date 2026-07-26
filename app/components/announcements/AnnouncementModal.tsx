"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { Sparkles, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_ANNOUNCEMENTS,
  getActiveAnnouncements,
  type Announcement,
} from "@/app/lib/mockAnnouncements";

export function AnnouncementModal() {
  const [open, setOpen] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    Announcement[]
  >([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [count, setCount] = useState(0);

  // Autoplay plugin reference with 5s interval
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  useEffect(() => {
    // Check if user has already seen the popup modal in the current session
    const hasSeenModal = sessionStorage.getItem("hasSeenAnnouncementsModal");

    // TODO: [Supabase Integration] Fetch active announcements via Server Action / Supabase query where startDate <= NOW() and endDate >= NOW()
    const now = new Date();
    const activeList = getActiveAnnouncements(MOCK_ANNOUNCEMENTS, now);

    setActiveAnnouncements(activeList);

    if (!hasSeenModal && activeList.length > 0) {
      // Small timeout to allow smooth home page render before popping modal
      const timer = setTimeout(() => {
        setOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update carousel slide counter & indicator state
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrentSlide(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("hasSeenAnnouncementsModal", "true");
  };

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[92vw] sm:max-w-lg p-0 overflow-hidden border border-[rgba(237,232,224,0.15)] bg-[#26211C] text-text-primary shadow-2xl rounded-2xl outline-none min-w-0 flex flex-col">
        {/* Modal Header Badge Bar */}
        <div className="flex items-center justify-between border-b border-[rgba(237,232,224,0.08)] bg-[#17130f] px-4 py-3 sm:px-5 shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
              <Megaphone className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-sans text-xs sm:text-sm font-bold text-text-primary tracking-wide flex items-center gap-1.5 truncate">
                <span className="truncate">最新活動與公告</span>
                <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-[11px] font-mono text-text-secondary truncate">
                HKCardVault Official Announcements
              </DialogDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-brand/30 bg-brand/10 font-mono text-[10px] text-brand px-2 py-0.5 shrink-0 ml-2"
          >
            {currentSlide + 1} / {count || activeAnnouncements.length}
          </Badge>
        </div>

        {/* Carousel Section */}
        <div className="relative group w-full min-w-0 max-w-full overflow-hidden flex-1 bg-[#26211C]">
          <Carousel
            setApi={setApi}
            plugins={[autoplayPlugin.current]}
            opts={{
              loop: true,
              align: "start",
            }}
            className="w-full min-w-0 max-w-full overflow-hidden"
          >
            <CarouselContent className="-ml-0 min-w-0 max-w-full flex">
              {activeAnnouncements.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="pl-0 min-w-0 shrink-0 grow-0 basis-full max-w-full w-full overflow-hidden"
                >
                  <div className="flex flex-col w-full min-w-0 max-w-full overflow-hidden">
                    {/* Poster Image Container */}
                    <div className="relative aspect-[16/9] w-full min-w-0 max-w-full overflow-hidden bg-[#17130f] shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        priority
                        unoptimized
                      />
                      {/* Gradient overlay at bottom of image for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#26211C] via-transparent to-black/20" />

                      {/* Date Badge on Image */}
                      <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4">
                        <span className="rounded-full border border-[rgba(237,232,224,0.15)] bg-black/70 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-xs font-bold text-brand">
                          活動期間: {item.startDate} ~ {item.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Announcement Details Box - Only Content, No Redirect Button */}
                    <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5 bg-[#26211C] w-full min-w-0 max-w-full overflow-y-auto max-h-[35vh]">
                      <h3 className="font-sans text-sm sm:text-base font-bold text-text-primary leading-snug break-words">
                        {item.title}
                      </h3>

                      <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed break-words whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Carousel Arrows Controls */}
          {activeAnnouncements.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => api?.scrollPrev()}
                className="absolute left-2 sm:left-3 top-1/3 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity hover:bg-black/90 active:scale-95 z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => api?.scrollNext()}
                className="absolute right-2 sm:right-3 top-1/3 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity hover:bg-black/90 active:scale-95 z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Modal Footer with Indicator Dots & Close Button */}
        <div className="flex items-center justify-between border-t border-[rgba(237,232,224,0.08)] bg-[#17130f] px-4 py-2.5 sm:px-5 sm:py-3 shrink-0 min-w-0">
          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5 min-w-0">
            {activeAnnouncements.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => api?.scrollTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "w-5 sm:w-6 bg-brand"
                    : "w-1.5 bg-[#39342f] hover:bg-text-secondary"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Close button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 sm:h-8 text-xs text-text-secondary hover:bg-[#2e2925] hover:text-text-primary shrink-0"
          >
            關閉視窗
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
