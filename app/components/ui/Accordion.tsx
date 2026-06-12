"use client";

import React from "react";

interface AccordionProps {
  // 🟢 核心修正：將 string 解封為 ReactNode，解鎖 JSX 自定義黑金樣式特權，且 100% 向下相容舊元件
  title: React.ReactNode; 
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ title, isOpen, onToggle, children, className = "" }: AccordionProps) {
  return (
    <div className={`border-b border-[rgba(237,232,224,0.08)] py-3 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between font-mono text-[11px] font-medium text-[#eae1da] uppercase tracking-wider text-left py-1 hover:text-[#d4a574] transition-colors focus:outline-none"
      >
        {/* 內層 span 會被我們傳入的自定義字體、顏色、大小完美覆蓋 */}
        <span>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="mt-3 space-y-2 animate-fadeIn">{children}</div>}
    </div>
  );
}