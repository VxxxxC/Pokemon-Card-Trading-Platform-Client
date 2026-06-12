"use client";

import { toast } from "sonner";

/** 平台主題輸入框基準樣式（黑金量產規格） */
const INPUT_BASE =
  "bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary px-4";

/** 複合輸入群組外框（內部欄位自帶 padding，故外框不掛 px-4） */
const INPUT_GROUP_BASE =
  "flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden";

/**
 * 新增商品上架表單 — React 19 原生非受控表單 Actions。
 * 零 keystroke state churn：欄位值由瀏覽器原生持有，
 * 僅在提交瞬間以 FormData 一次性擷取，徹底消除逐鍵重繪。
 */
export function NewListingForm() {
  // TODO: [server] Replace with server action — INSERT into `listings` with status='active', then update merchant inventory count
  function publishListing(formData: FormData) {
    const cardQuery = String(formData.get("card-query") ?? "");
    toast.success(`「${cardQuery || "新商品"}」已提交上架（待後端接通）`);
  }

  // TODO: [server] Replace with server action — INSERT into `listings` with status='draft'
  function saveDraft(formData: FormData) {
    const cardQuery = String(formData.get("card-query") ?? "");
    toast(`「${cardQuery || "新商品"}」草稿已暫存（待後端接通）`);
  }

  return (
    <section
      aria-labelledby="new-listing-heading"
      className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.20)] p-5 mb-6"
    >
      <h2
        id="new-listing-heading"
        className="font-sans font-semibold text-[16px] text-text-primary mb-4"
      >
        新增商品上架
      </h2>
      <form action={publishListing} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="card-query"
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              卡牌編號 / 名稱搜尋 <span className="text-warning">*</span>
            </label>
            <div className={INPUT_GROUP_BASE}>
              {/* TODO: [API] "搜尋" must query card catalog API (e.g. `cards` table full-text search) and autofill set/cardNo */}
              <input
                id="card-query"
                name="card-query"
                type="text"
                required
                placeholder="sv2a-182 或 Charizard ex SAR"
                className="flex-1 h-full bg-transparent px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none"
              />
              <button
                type="button"
                className="px-3 h-full font-mono text-[11px] text-brand hover:bg-[rgba(212,165,116,0.08)] transition-colors border-l border-white/5 cursor-pointer"
              >
                搜尋
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="ask-price"
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              售價 (JPY) <span className="text-warning">*</span>
            </label>
            <div className={INPUT_GROUP_BASE}>
              <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-white/5">
                ¥
              </span>
              <input
                id="ask-price"
                name="ask-price"
                type="number"
                min={0}
                required
                placeholder="0"
                className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="card-grade"
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              鑑定等級
            </label>
            <select
              id="card-grade"
              name="card-grade"
              defaultValue="PSA 10"
              className={`w-full font-mono text-[13px] focus:outline-none appearance-none cursor-pointer ${INPUT_BASE}`}
            >
              <option>PSA 10</option>
              <option>PSA 9</option>
              <option>BGS 9.5</option>
              <option>BGS 9</option>
              <option>CGC 10</option>
              <option>CGC 9</option>
              <option>RAW NM</option>
              <option>RAW EX</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="condition-notes"
              className="font-mono text-[12px] text-text-secondary block mb-1.5"
            >
              品相備註
            </label>
            <input
              id="condition-notes"
              name="condition-notes"
              type="text"
              placeholder="例：角落完美，居中良好"
              className={`w-full font-sans text-[14px] placeholder-text-disabled focus:outline-none ${INPUT_BASE}`}
            />
          </div>
        </div>

        {/* Photo Upload — 4-6 required */}
        {/* TODO: [server] Photo upload divs are decorative — no `<input type="file">` and no Supabase Storage upload handler; implement with supabase.storage.from('listing-photos').upload(`${listingId}/${i}`, file) */}
        <div>
          <p className="font-mono text-[12px] text-text-secondary block mb-1.5">
            實物照片 (必須 4–6 張) <span className="text-warning">*</span>
          </p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  i < 2
                    ? "border-brand/40 bg-[rgba(212,165,116,0.06)]"
                    : "border-[rgba(237,232,224,0.12)] bg-[#17130f] hover:border-brand/30"
                }`}
              >
                {i < 2 ? (
                  <span className="font-mono text-[10px] text-brand">✓ 已上傳</span>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#50453b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="font-mono text-[9px] text-text-disabled mt-1">
                      {i < 4 ? "必填" : "選填"}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-text-disabled mt-1.5">
            請拍攝正面、背面、卡角、刮痕細節，確保品相透明。最大 10MB / 張。
          </p>
        </div>

        <div className="flex gap-3">
          {/* React 19 per-button formAction：草稿走獨立 action 管線，免 JS state */}
          <button
            type="submit"
            formAction={saveDraft}
            formNoValidate
            className="flex-1 h-11 font-sans text-[14px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated active:scale-[0.98] transition-all cursor-pointer"
          >
            儲存草稿
          </button>
          <button
            type="submit"
            className="flex-1 h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform cursor-pointer"
          >
            立即上架
          </button>
        </div>
      </form>
    </section>
  );
}
