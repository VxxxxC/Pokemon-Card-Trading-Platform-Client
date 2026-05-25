'use client';

import { useState, useCallback } from 'react';

export function LogoutModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const handleLogout = useCallback(() => {
    // TODO: Supabase signOut + redirect to /login
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Trigger row */}
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-elevated hover:bg-bg-hover transition-colors active:scale-[0.99] min-h-11 text-left"
        aria-haspopup="dialog"
      >
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="1.5" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="font-sans text-[14px] font-medium text-warning">登出</span>
        </div>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#50453b" strokeWidth="1.5" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Confirmation modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.65)] backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div
            className="bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-2xl p-6 mx-4 max-w-90 w-full shadow-[0_16px_48px_rgba(0,0,0,0.70)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <h2
              id="logout-modal-title"
              className="font-sans font-semibold text-[17px] text-text-primary mb-2"
            >
              確認登出
            </h2>
            <p className="font-sans text-[13px] text-text-secondary mb-1 leading-relaxed">
              您確定要結束目前的會話並登出嗎？
            </p>
            <p className="font-mono text-[10px] text-text-disabled mb-6">
              SESSION_ID: PKT-AUTH-LOGOUT-REQD
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 h-11 font-sans text-[14px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-hover active:scale-[0.98] active:translate-y-px transition-transform"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 h-11 font-sans text-[14px] font-semibold text-warning bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] rounded-xl hover:bg-[rgba(239,68,68,0.16)] active:scale-[0.98] active:translate-y-px transition-transform"
              >
                確認登出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
