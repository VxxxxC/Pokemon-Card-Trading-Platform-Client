import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  adjustAdminModerationCaseScore,
  getAdminModerationCase,
  getAdminModerationChatThread,
  resolveAdminModerationCase,
  searchAdminModerationCases,
} from "@/app/actions/admin-moderation";
import { submitUserReport } from "@/app/actions/reports";
import { mapResolutionOptionToInput } from "@/lib/moderation/resolution-config";
import {
  clearSessionCache,
  getAdminUserId,
  getBuyerUserId,
  runAsAdmin,
  runAsBuyer,
  warmSession,
} from "../shared/auth-context";
import { wipeModerationMatrixPair } from "./helpers/cleanup";
import {
  countModerationAuditLogsForCase,
  countPendingReports,
  getActiveAccountSanctionsForUser,
  getLatestReport,
  getModerationCaseScores,
  getModerationCaseStatus,
} from "./helpers/db-assert";
import { getSellerId, hasModerationIntegrationEnv } from "./helpers/env";
import {
  buildChatReportInput,
  buildProfileReportInput,
  ensureDbChatRoom,
  insertChatMessageProbe,
  MATRIX_PREFIX,
  uniqueDetails,
} from "./helpers/fixtures";

describe.skipIf(!hasModerationIntegrationEnv()).sequential(
  "Moderation integration matrix",
  () => {
    const runId = String(Date.now());
    const sellerId = () => getSellerId();
    const buyerId = () => getBuyerUserId();
    let buyerSellerChatRoomId = "";

    beforeAll(async () => {
      await warmSession("admin");
      await warmSession("buyer");
      buyerSellerChatRoomId = await ensureDbChatRoom(buyerId(), sellerId());
    });

    beforeEach(async () => {
      await wipeModerationMatrixPair({
        reporterId: buyerId(),
        subjectId: sellerId(),
        chatRoomId: buyerSellerChatRoomId,
      });
    });

    afterAll(async () => {
      await wipeModerationMatrixPair({
        reporterId: buyerId(),
        subjectId: sellerId(),
        chatRoomId: buyerSellerChatRoomId,
      });
      await clearSessionCache();
    });

    it("I-R3 profile report blocks chat-required offline trade category", async () => {
      await runAsBuyer(async () => {
        const result = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details: uniqueDetails("I-R3", runId),
            category: "offline_trade",
          }),
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("請在對話內使用舉報功能");
        }
      });
    });

    it("I-R1b rejects report when chat room counterparty mismatches target", async () => {
      await runAsBuyer(async () => {
        const result = await submitUserReport(
          buildChatReportInput({
            sellerId: getAdminUserId(),
            chatRoomId: buyerSellerChatRoomId,
            details: uniqueDetails("I-R1b", runId),
          }),
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("無法舉報此對話中的用戶");
        }
      });
    });

    it("I-R1 chat report succeeds", async () => {
      const details = uniqueDetails("I-R1", runId);

      await runAsBuyer(async () => {
        const result = await submitUserReport(
          buildChatReportInput({
            sellerId: sellerId(),
            chatRoomId: buyerSellerChatRoomId,
            details,
          }),
        );
        expect(result.success).toBe(true);
      });

      const report = await getLatestReport({
        reporterId: buyerId(),
        targetId: sellerId(),
      });
      expect(report).not.toBeNull();
      expect(report?.status).toBe("pending");
      expect(report?.reason).toContain("[SOURCE] chat_room");
      expect(report?.reason).toContain(details);
      expect(report?.contribution_score).toBe(44);
      expect(report?.case_id).toBeTruthy();
    });

    it("I-R2 profile report succeeds", async () => {
      const details = uniqueDetails("I-R2", runId);

      await runAsBuyer(async () => {
        const result = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details,
          }),
        );
        expect(result.success).toBe(true);
      });

      const report = await getLatestReport({
        reporterId: buyerId(),
        targetId: sellerId(),
      });
      expect(report).not.toBeNull();
      expect(report?.reason).toContain("[SOURCE] profile");
      expect(report?.reason).toContain(details);
      expect(report?.contribution_score).toBe(40);
      expect(report?.case_id).toBeTruthy();
    });

    it("I-R5 blocks duplicate profile report for same category", async () => {
      const details = uniqueDetails("I-R5", runId);

      await runAsBuyer(async () => {
        const first = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details,
          }),
        );
        expect(first.success).toBe(true);

        const second = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details: `${details} duplicate`,
          }),
        );
        expect(second.success).toBe(false);
        if (!second.success) {
          expect(second.error).toMatch(/同類別的待審核舉報/);
        }
      });

      expect(
        await countPendingReports({
          reporterId: buyerId(),
          targetId: sellerId(),
        }),
      ).toBe(1);
    });

    it("I-R4 aggregates chat and profile reports into same case", async () => {
      const chatDetails = uniqueDetails("I-R4-chat", runId);
      const profileDetails = uniqueDetails("I-R4-profile", runId);

      let caseId = "";

      await runAsBuyer(async () => {
        const chat = await submitUserReport(
          buildChatReportInput({
            sellerId: sellerId(),
            chatRoomId: buyerSellerChatRoomId,
            details: chatDetails,
          }),
        );
        expect(chat.success).toBe(true);
        if (chat.success) {
          caseId = chat.data.caseId;
        }

        const profile = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details: profileDetails,
          }),
        );
        expect(profile.success).toBe(true);
        if (profile.success) {
          expect(profile.data.caseId).toBe(caseId);
        }
      });

      const latest = await getLatestReport({
        reporterId: buyerId(),
        targetId: sellerId(),
      });
      expect(latest?.case_id).toBe(caseId);

      expect(
        await countPendingReports({
          reporterId: buyerId(),
          targetId: sellerId(),
        }),
      ).toBe(2);
    });

    it("I-M5 buyer cannot invoke admin moderation actions", async () => {
      const fakeCaseId = "00000000-0000-0000-0000-000000000099";

      await runAsBuyer(async () => {
        const search = await searchAdminModerationCases({ status: "pending" });
        expect(search.success).toBe(false);
        if (!search.success) {
          expect(search.error).toBe("無管理員權限");
        }

        const bundle = await getAdminModerationCase(fakeCaseId);
        expect(bundle.success).toBe(false);
        if (!bundle.success) {
          expect(bundle.error).toBe("無管理員權限");
        }

        const chat = await getAdminModerationChatThread({
          caseId: fakeCaseId,
          roomId: buyerSellerChatRoomId,
        });
        expect(chat.success).toBe(false);
        if (!chat.success) {
          expect(chat.error).toBe("無管理員權限");
        }

        const resolve = await resolveAdminModerationCase({
          caseId: fakeCaseId,
          ...mapResolutionOptionToInput("dismissed"),
        });
        expect(resolve.success).toBe(false);
        if (!resolve.success) {
          expect(resolve.error).toBe("無管理員權限");
        }
      });
    });

    it("I-M1 admin can search pending moderation cases", async () => {
      const details = uniqueDetails("I-M1", runId);
      let caseNumber = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildChatReportInput({
            sellerId: sellerId(),
            chatRoomId: buyerSellerChatRoomId,
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseNumber = submit.data.caseNumber;
        }
      });

      await runAsAdmin(async () => {
        const search = await searchAdminModerationCases({
          status: "pending",
          search: caseNumber,
        });
        expect(search.success).toBe(true);
        if (!search.success) {
          return;
        }
        expect(
          search.data.rows.some((row) => row.caseNumber === caseNumber),
        ).toBe(true);
      });
    });

    it("I-M2 admin case bundle includes submitted report", async () => {
      const details = uniqueDetails("I-M2", runId);
      let caseId = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseId = submit.data.caseId;
        }
      });

      await runAsAdmin(async () => {
        const bundle = await getAdminModerationCase(caseId);
        expect(bundle.success).toBe(true);
        if (!bundle.success) {
          return;
        }
        expect(bundle.data.reports.length).toBeGreaterThan(0);
        expect(
          bundle.data.reports.some((report) => report.reason.includes(details)),
        ).toBe(true);
      });
    });

    it("I-M3 admin loads chat thread and writes view_chat audit", async () => {
      const details = uniqueDetails("I-M3", runId);
      const probe = `${MATRIX_PREFIX} ${runId} I-M3 probe`;
      let caseId = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildChatReportInput({
            sellerId: sellerId(),
            chatRoomId: buyerSellerChatRoomId,
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseId = submit.data.caseId;
        }
      });

      await insertChatMessageProbe({
        roomId: buyerSellerChatRoomId,
        senderId: buyerId(),
        content: probe,
      });

      const auditBefore = await countModerationAuditLogsForCase(caseId, "view_chat");

      await runAsAdmin(async () => {
        const thread = await getAdminModerationChatThread({
          caseId,
          roomId: buyerSellerChatRoomId,
        });
        expect(thread.success).toBe(true);
        if (!thread.success) {
          return;
        }
        expect(
          thread.data.messages.some((message) => message.content.includes(probe)),
        ).toBe(true);
      });

      const auditAfter = await countModerationAuditLogsForCase(caseId, "view_chat");
      expect(auditAfter).toBeGreaterThan(auditBefore);
    });

    it("I-M4 admin adjusts moderation case score", async () => {
      const details = uniqueDetails("I-M4", runId);
      let caseId = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseId = submit.data.caseId;
        }
      });

      const before = await getModerationCaseScores(caseId);
      expect(before).not.toBeNull();

      await runAsAdmin(async () => {
        const adjust = await adjustAdminModerationCaseScore({
          caseId,
          adjustment: 5,
          reason: `${MATRIX_PREFIX} score adjust`,
        });
        expect(adjust.success).toBe(true);
      });

      const after = await getModerationCaseScores(caseId);
      expect(after).not.toBeNull();
      expect(after!.adminAdjustment).toBe(before!.adminAdjustment + 5);
      expect(after!.finalScore).toBe(before!.finalScore + 5);
    });

    it("I-L1a dismiss case closes without sanctions", async () => {
      const details = uniqueDetails("I-L1a", runId);
      let caseId = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildProfileReportInput({
            sellerId: sellerId(),
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseId = submit.data.caseId;
        }
      });

      const sanctionsBefore = await getActiveAccountSanctionsForUser(sellerId());

      await runAsAdmin(async () => {
        const resolve = await resolveAdminModerationCase({
          caseId,
          ...mapResolutionOptionToInput("dismissed"),
        });
        expect(resolve.success).toBe(true);
      });

      const status = await getModerationCaseStatus(caseId);
      expect(status?.status).toBe("dismissed");
      expect(status?.resolution).toBe("dismissed");

      const resolveAudit = await countModerationAuditLogsForCase(caseId, "resolve");
      expect(resolveAudit).toBeGreaterThan(0);

      const sanctionsAfter = await getActiveAccountSanctionsForUser(sellerId());
      expect(sanctionsAfter.length).toBe(sanctionsBefore.length);
    });

    it("I-L1b uphold with suspend penalty creates account sanction", async () => {
      const details = uniqueDetails("I-L1b", runId);
      let caseId = "";

      await runAsBuyer(async () => {
        const submit = await submitUserReport(
          buildChatReportInput({
            sellerId: sellerId(),
            chatRoomId: buyerSellerChatRoomId,
            details,
          }),
        );
        expect(submit.success).toBe(true);
        if (submit.success) {
          caseId = submit.data.caseId;
        }
      });

      await runAsAdmin(async () => {
        const resolve = await resolveAdminModerationCase({
          caseId,
          ...mapResolutionOptionToInput("suspend_7d", "member"),
        });
        expect(resolve.success).toBe(true);
      });

      const status = await getModerationCaseStatus(caseId);
      expect(status?.status).toBe("resolved");
      expect(status?.resolution).toBe("upheld");

      const sanctions = await getActiveAccountSanctionsForUser(sellerId());
      expect(
        sanctions.some(
          (row) => row.type === "suspend" && row.scope === "account",
        ),
      ).toBe(true);
    });
  },
);
