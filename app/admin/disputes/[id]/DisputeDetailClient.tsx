"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  adjustAdminModerationCaseScore,
  resolveAdminModerationCase,
} from "@/app/actions/admin-moderation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoryBadgeClasses,
  deriveSeverityBand,
  formatCategoryLabel,
  formatModerationDateTime,
  moderationAuditActionLabel,
  moderationResolutionLabel,
  moderationStatusBadgeClasses,
  moderationStatusLabel,
  sanctionScopeLabel,
  sanctionTypeLabel,
  severityBadgeClasses,
  severityLabel,
} from "@/lib/moderation/admin-case-presenters";
import { highlightSensitiveKeywords } from "@/lib/moderation/highlight-chat-keywords";
import {
  isUpheldResolutionOption,
  mapResolutionOptionToInput,
  MODERATION_RESOLUTION_OPTIONS,
  VIOLATION_PERSONA_OPTIONS,
  type ModerationResolutionOptionValue,
} from "@/lib/moderation/resolution-config";
import type {
  AdminModerationCaseBundle,
  ViolationPersona,
} from "@/lib/moderation/types";
import ModerationChatThreadPanel from "./ModerationChatThreadPanel";
import ModerationOrderContextPanel from "./ModerationOrderContextPanel";

interface DisputeDetailClientProps {
  bundle: AdminModerationCaseBundle;
}

function isCaseOpen(status: AdminModerationCaseBundle["case"]["status"]): boolean {
  return status === "open" || status === "reviewing";
}

export default function DisputeDetailClient({
  bundle,
}: DisputeDetailClientProps) {
  const router = useRouter();
  const [isAdjustPending, startAdjustTransition] = useTransition();
  const [isResolvePending, startResolveTransition] = useTransition();
  const { case: caseDetail, reports, attachments, chatAccess, auditLog, activeSanctions, relatedOrders } =
    bundle;
  const severity = deriveSeverityBand(caseDetail.finalScore);
  const primaryReporter = bundle.reporterSummaries[0];
  const caseOpen = isCaseOpen(caseDetail.status);
  const chatRoomIds =
    chatAccess.roomIds.length > 0
      ? chatAccess.roomIds
      : chatAccess.roomId
        ? [chatAccess.roomId]
        : [];
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(
    chatRoomIds[0] ?? null,
  );

  const [scoreAdjustment, setScoreAdjustment] = useState("0");
  const [adjustmentReason, setAdjustmentReason] = useState(
    caseDetail.adjustmentReason ?? "",
  );
  const [resolutionOption, setResolutionOption] = useState<
    ModerationResolutionOptionValue | ""
  >("");
  const [violationPersona, setViolationPersona] = useState<
    ViolationPersona | ""
  >("");
  const [evidenceOverride, setEvidenceOverride] = useState(false);
  const [evidenceOverrideReason, setEvidenceOverrideReason] = useState("");

  const handleSaveScoreAdjustment = () => {
    const adjustment = Number(scoreAdjustment);
    if (!Number.isFinite(adjustment)) {
      toast.error("請輸入有效的分數調整值");
      return;
    }

    if (adjustment !== 0 && !adjustmentReason.trim()) {
      toast.error("調整分數時必須填寫原因");
      return;
    }

    startAdjustTransition(async () => {
      const result = await adjustAdminModerationCaseScore({
        caseId: caseDetail.id,
        adjustment,
        reason: adjustmentReason.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("風控分數已更新");
      router.refresh();
    });
  };

  const handleResolve = () => {
    if (!resolutionOption) {
      toast.error("請選擇仲裁結果");
      return;
    }

    const requiresUpheld = isUpheldResolutionOption(resolutionOption);
    if (requiresUpheld && !violationPersona) {
      toast.error("裁定成立時必須指定違規身分");
      return;
    }

    if (
      requiresUpheld &&
      !chatAccess.evidenceSufficient &&
      !evidenceOverride
    ) {
      toast.error("證據不足時無法裁定成立，請勾選管理員覆寫或改選其他結果");
      return;
    }

    if (evidenceOverride && !evidenceOverrideReason.trim()) {
      toast.error("請填寫證據覆寫原因");
      return;
    }

    const resolveInput = mapResolutionOptionToInput(
      resolutionOption,
      violationPersona || undefined,
    );

    if (evidenceOverride && evidenceOverrideReason.trim()) {
      resolveInput.evidenceOverrideReason = evidenceOverrideReason.trim();
    }

    startResolveTransition(async () => {
      const result = await resolveAdminModerationCase({
        caseId: caseDetail.id,
        ...resolveInput,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.authBanWarning) {
        toast.warning(result.data.authBanWarning);
      }

      toast.success("案件已裁定結案");
      router.push("/admin/disputes?status=completed");
    });
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/disputes")}
        className="text-[#d4c4b7] hover:bg-[#26211C] hover:text-[#eae1da] active:scale-[0.98]"
      >
        <ArrowLeft className="mr-1.5 size-4" />
        返回舉報與爭議列表
      </Button>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[18px] font-bold text-[#eae1da]">
              {caseDetail.caseNumber}
            </span>
            <Badge
              variant="outline"
              className={categoryBadgeClasses(caseDetail.primaryCategory)}
            >
              {formatCategoryLabel(caseDetail.primaryCategory)}
            </Badge>
            <Badge
              variant="outline"
              className={severityBadgeClasses(severity)}
            >
              {severityLabel(severity)}
            </Badge>
            {caseDetail.resolution ? (
              <Badge variant="outline" className="bg-[#2e2925] text-[#d4c4b7] border-white/10">
                {moderationResolutionLabel(caseDetail.resolution)}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={moderationStatusBadgeClasses(caseDetail.status)}
            >
              {moderationStatusLabel(caseDetail.status)}
            </Badge>
            <span className="font-mono text-[13px] font-semibold text-[#d4a574]">
              最終分數 {caseDetail.finalScore ?? 0}
            </span>
            <span className="font-sans text-[12px] text-[#8A8680]">
              建立於 {formatModerationDateTime(caseDetail.createdAt)}
            </span>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <h1 className="font-sans text-[20px] font-bold text-[#eae1da]">
            被舉報用戶：{caseDetail.subject.displayName ?? "未知用戶"}
          </h1>
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#d4c4b7]">
            @{caseDetail.subject.username ?? "—"} · 角色 {caseDetail.subject.role ?? "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-sans text-[12px] text-[#8A8680]">
            <span>
              主要舉報方：
              <span className="text-[#d4c4b7]">
                {primaryReporter?.displayName ?? "—"}
              </span>
            </span>
            <span>
              獨立舉報人數：
              <span className="text-[#d4c4b7]">
                {bundle.reporterSummaries.length}
              </span>
            </span>
          </div>
          {activeSanctions.length > 0 ? (
            <div className="mt-3 space-y-1">
              <p className="font-sans text-[12px] font-medium text-[#d4c4b7]">
                有效制裁：
              </p>
              {activeSanctions.map((sanction) => (
                <p
                  key={sanction.id}
                  className="font-sans text-[12px] text-[#8A8680]"
                >
                  {sanctionScopeLabel(sanction.scope)} ·{" "}
                  {sanctionTypeLabel(sanction.type)}
                  {sanction.endsAt
                    ? ` · 至 ${formatModerationDateTime(sanction.endsAt)}`
                    : " · 永久"}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!chatAccess.evidenceSufficient ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[13px] text-[#ef4444]">
          證據不足 — 此類別需調閱對話紀錄。若下方無聊天紀錄，可先標記
          insufficient_evidence 或駁回。
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[55fr_45fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              舉報摘要
            </h2>
            <div className="mt-4 space-y-4">
              {reports.length === 0 ? (
                <p className="font-sans text-[12px] text-[#8A8680]">暫無舉報紀錄。</p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-white/[0.06] bg-[#17130f] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={categoryBadgeClasses(report.category)}
                      >
                        {formatCategoryLabel(report.category)}
                      </Badge>
                      <span>
                        {report.source === "profile"
                          ? "公開資料"
                          : report.source === "chat_room"
                            ? `對話${report.contextId ? ` · ${report.contextId.slice(0, 8)}` : ""}`
                            : "未知來源"}
                      </span>
                      <span className="font-sans text-[12px] text-[#8A8680]">
                        {report.reporterDisplayName ?? report.reporterUsername ?? "未知"}
                        · {formatModerationDateTime(report.createdAt)}
                      </span>
                      <span className="font-mono text-[12px] text-[#d4a574]">
                        +{report.contributionScore ?? 0}
                      </span>
                    </div>
                    <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#d4c4b7]">
                      {highlightSensitiveKeywords(
                        report.details?.trim() || report.reason,
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              用戶上傳證據
            </h2>
            {attachments.length === 0 ? (
              <p className="mt-3 font-sans text-[12px] text-[#8A8680]">
                暫無證據圖片。
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#17130f]"
                  >
                    {attachment.publicUrl ? (
                      <a
                        href={attachment.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.publicUrl}
                          alt="舉報證據"
                          className="h-32 w-full object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex h-32 items-center justify-center px-3 text-center font-sans text-[11px] text-[#8A8680]">
                        圖片不可用
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
                唯讀聊天室歷史
              </h2>
            </div>
            {chatRoomIds.length > 1 ? (
              <select
                value={selectedChatRoomId ?? ""}
                onChange={(event) =>
                  setSelectedChatRoomId(event.target.value || null)
                }
              >
                {chatRoomIds.map((roomId) => (
                  <option key={roomId} value={roomId}>
                    聊天室 {roomId.slice(0, 8)}
                  </option>
                ))}
              </select>
            ) : null}
            {selectedChatRoomId ? (
              <ModerationChatThreadPanel
                caseId={caseDetail.id}
                roomId={selectedChatRoomId}
                subjectUserId={caseDetail.subject.id}
              />
            ) : (
              <p className="font-sans text-[13px] leading-relaxed text-[#d4c4b7]">
                此案件尚未綁定可調閱的聊天室紀錄。
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              風控分數明細
            </h2>
            <div className="mt-4 space-y-2 font-sans text-[13px] text-[#d4c4b7]">
              <p>自動分數 (autoScore)：{caseDetail.autoScore}</p>
              {reports.map((report) => (
                <p key={report.id} className="pl-3 text-[12px] text-[#8A8680]">
                  - {formatCategoryLabel(report.category)} ·{" "}
                  {report.reporterDisplayName ?? "未知"} · +
                  {report.contributionScore ?? 0}
                </p>
              ))}
              <p>管理員調整：{caseDetail.adminAdjustment}</p>
              {caseDetail.adjustmentReason ? (
                <p className="text-[12px] text-[#8A8680]">
                  調整原因：{caseDetail.adjustmentReason}
                </p>
              ) : null}
              <p className="border-t border-white/[0.06] pt-2 font-mono text-[#d4a574]">
                最終分數：{caseDetail.finalScore ?? 0}
              </p>
            </div>
            {caseOpen ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="admin-score-adjustment"
                    className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]"
                  >
                    分數調整 (+/−)
                  </label>
                  <input
                    id="admin-score-adjustment"
                    name="adjustment"
                    type="number"
                    value={scoreAdjustment}
                    onChange={(event) => setScoreAdjustment(event.target.value)}
                    disabled={isAdjustPending}
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-adjustment-reason"
                    className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]"
                  >
                    調整原因
                  </label>
                  <textarea
                    id="admin-adjustment-reason"
                    name="adjustmentReason"
                    rows={3}
                    value={adjustmentReason}
                    onChange={(event) => setAdjustmentReason(event.target.value)}
                    disabled={isAdjustPending}
                  />
                </div>
                <Button
                  type="button"
                  disabled={isAdjustPending}
                  onClick={handleSaveScoreAdjustment}
                  className="h-10 w-full bg-[#d4a574] text-[#111] hover:bg-[#e0b585]"
                >
                  {isAdjustPending ? "儲存中…" : "儲存調整"}
                </Button>
              </div>
            ) : null}
          </div>

          <ModerationOrderContextPanel
            relatedOrders={relatedOrders}
            primaryCategory={caseDetail.primaryCategory}
          />

          <div
            className={`rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]${caseOpen ? "" : " opacity-70"}`}
          >
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              仲裁判定動作
            </h2>
            {caseOpen ? (
              <>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]">
                      選擇仲裁結果
                    </label>
                    <Select
                      value={resolutionOption}
                      onValueChange={(value) =>
                        setResolutionOption(value as ModerationResolutionOptionValue)
                      }
                      disabled={isResolvePending}
                    >
                      <SelectTrigger className="h-10 w-full border-white/10 bg-[#17130f] text-[#eae1da]">
                        <SelectValue placeholder="請選擇一項仲裁判定動作" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#26211C]">
                        {MODERATION_RESOLUTION_OPTIONS.map((option) => {
                          const disabled =
                            !chatAccess.evidenceSufficient &&
                            option.disabledWhenEvidenceInsufficient;
                          return (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={disabled}
                              className="text-[#d4c4b7]"
                            >
                              {option.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {resolutionOption && isUpheldResolutionOption(resolutionOption) ? (
                    <div>
                      <label className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]">
                        違規身分
                      </label>
                      <Select
                        value={violationPersona}
                        onValueChange={(value) =>
                          setViolationPersona(value as ViolationPersona)
                        }
                        disabled={isResolvePending}
                      >
                        <SelectTrigger className="h-10 w-full border-white/10 bg-[#17130f] text-[#eae1da]">
                          <SelectValue placeholder="請選擇違規身分" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#26211C]">
                          {VIOLATION_PERSONA_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-[#d4c4b7]"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {!chatAccess.evidenceSufficient ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 font-sans text-[12px] text-[#d4c4b7]">
                        <input
                          type="checkbox"
                          name="evidenceOverride"
                          checked={evidenceOverride}
                          onChange={(event) => setEvidenceOverride(event.target.checked)}
                          disabled={isResolvePending}
                        />
                        管理員強制裁定（證據不足覆寫）
                      </label>
                      {evidenceOverride ? (
                        <textarea
                          name="evidenceOverrideReason"
                          rows={2}
                          placeholder="覆寫原因"
                          value={evidenceOverrideReason}
                          onChange={(event) =>
                            setEvidenceOverrideReason(event.target.value)
                          }
                          disabled={isResolvePending}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  disabled={isResolvePending || !resolutionOption}
                  onClick={handleResolve}
                  className="mt-4 h-11 w-full bg-[#d4a574] text-[#111] hover:bg-[#e0b585] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2">⚖️</span>
                  {isResolvePending ? "提交中…" : "執行最終仲裁裁決"}
                </Button>
              </>
            ) : (
              <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
                案件已結案
                {caseDetail.resolvedAt
                  ? ` · ${formatModerationDateTime(caseDetail.resolvedAt)}`
                  : ""}
                {caseDetail.resolution
                  ? ` · ${moderationResolutionLabel(caseDetail.resolution)}`
                  : ""}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              審計紀錄
            </h2>
            {auditLog.length === 0 ? (
              <p className="mt-3 font-sans text-[12px] text-[#8A8680]">
                尚無審計紀錄。
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-white/[0.06] bg-[#17130f] px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-[12px] font-medium text-[#eae1da]">
                        {moderationAuditActionLabel(entry.action)}
                      </span>
                      <span className="font-sans text-[11px] text-[#8A8680]">
                        {entry.adminDisplayName ?? entry.adminId}
                      </span>
                      <span className="font-sans text-[11px] text-[#8A8680]">
                        {formatModerationDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
