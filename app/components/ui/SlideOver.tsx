"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  zIndex?: number;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  zIndex = 300,
}: SlideOverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 overflow-hidden"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Sliding Panel Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-screen max-w-md bg-[#2e2925] border-l border-[rgba(237,232,224,0.12)] shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
                <div>
                  <h2 className="font-sans font-bold text-[18px] text-[#eae1da]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 uppercase tracking-wider">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center transition-colors cursor-pointer text-[#8A8680] hover:text-brand focus:outline-none"
                  aria-label="關閉面板"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Dynamic Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-none space-y-6 bg-[#231e1a]/40">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
