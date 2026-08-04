import type { ReportCategorySlug } from "@/lib/moderation/category-config";
import type { Database } from "@/types/supabase";

export type { ReportCategorySlug };

export type SubmitUserReportRpcResult = {
  report_id: string;
  case_id: string;
  case_number: string;
};

export type ModerationCaseStatus =
  Database["public"]["Enums"]["moderation_case_status"];

export type AdminModerationSearchStatus =
  | ModerationCaseStatus
  | "pending"
  | "completed"
  | "all";

export type AdminModerationSubjectPreview = {
  id: string;
  displayName: string | null;
  username: string | null;
};

export type AdminModerationReporterPreview = {
  displayName: string;
  extraCount: number;
};

export type AdminModerationCaseRow = {
  id: string;
  caseNumber: string;
  status: ModerationCaseStatus;
  primaryCategory: ReportCategorySlug | null;
  autoScore: number;
  adminAdjustment: number;
  finalScore: number | null;
  createdAt: string;
  subject: AdminModerationSubjectPreview;
  reporterPreview: AdminModerationReporterPreview;
  previewDetails: string | null;
};

export type AdminModerationSearchResult = {
  rows: AdminModerationCaseRow[];
  total: number;
  pendingCount: number;
};

export type ModerationResolution =
  Database["public"]["Enums"]["moderation_resolution"];

export type ViolationPersona = Database["public"]["Enums"]["violation_persona"];

export type SanctionScope = Database["public"]["Enums"]["sanction_scope"];

export type SanctionType = Database["public"]["Enums"]["sanction_type"];

export type AdminAccountSanctionRow = {
  id: string;
  scope: SanctionScope;
  type: SanctionType;
  startsAt: string;
  endsAt: string | null;
  reason: string | null;
  caseId: string | null;
};

export type AdminModerationCaseDetail = {
  id: string;
  caseNumber: string;
  status: ModerationCaseStatus;
  primaryCategory: ReportCategorySlug | null;
  autoScore: number;
  adminAdjustment: number;
  finalScore: number | null;
  adjustmentReason: string | null;
  resolution: ModerationResolution | null;
  violationPersona: ViolationPersona | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subject: AdminModerationSubjectPreview & { role: string | null };
};

export type ResolveAdminModerationCaseSanctionInput = {
  scope: SanctionScope;
  type: SanctionType;
  endsAt: string | null;
  reason: string;
};

export type ResolveAdminModerationCaseInput = {
  resolution: ModerationResolution;
  violationPersona?: ViolationPersona;
  adjustment?: number;
  adjustmentReason?: string;
  sanction?: ResolveAdminModerationCaseSanctionInput;
  evidenceOverrideReason?: string;
};

export type AdminModerationReportRow = {
  id: string;
  reporterId: string;
  reporterDisplayName: string | null;
  reporterUsername: string | null;
  category: ReportCategorySlug | null;
  source: Database["public"]["Enums"]["report_source"] | null;
  status: Database["public"]["Enums"]["report_state"] | null;
  details: string | null;
  reason: string;
  contributionScore: number | null;
  contextType: string | null;
  contextId: string | null;
  createdAt: string | null;
};

export type AdminReportAttachmentRow = {
  id: string;
  reportId: string | null;
  reporterId: string;
  storagePath: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  publicUrl: string | null;
};

export type AdminModerationReporterSummary = {
  id: string;
  displayName: string | null;
  reportCount: number;
};

export type AdminModerationChatAccess = {
  available: boolean;
  roomId: string | null;
  roomIds: string[];
  requiredForCategory: boolean;
  evidenceSufficient: boolean;
};

export type AdminModerationChatMessage = {
  id: string;
  senderId: string;
  senderDisplayName: string | null;
  content: string;
  createdAt: string;
  isSystemWarning: boolean;
  offerId: string | null;
  memberOrderId: string | null;
  merchantOrderId: string | null;
};

export type AdminModerationChatThread = {
  roomId: string;
  messages: AdminModerationChatMessage[];
  hasMore: boolean;
  nextBefore: string | null;
};

export type AdminModerationAuditRow = {
  id: string;
  action: string;
  adminId: string;
  adminDisplayName: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AccountAccessRestriction = {
  blocked: boolean;
  type?: "suspend" | "ban";
  endsAt?: string | null;
  reason?: string | null;
};

export type AdminModerationOrderSummary = {
  id: string;
  persona: "member" | "merchant";
  orderNumber: string | null;
  finalPrice: number;
  totalAmount: number | null;
  status: string | null;
  escrowStatus: string | null;
  inboundTrackingNo: string | null;
  outboundTrackingNo: string | null;
  paidAt: string | null;
  buyerConfirmedAt: string | null;
  createdAt: string | null;
  source: string | null;
  useAuthentication?: boolean;
  requiresAuthentication?: boolean;
};

export type AdminModerationCaseBundle = {
  case: AdminModerationCaseDetail;
  reports: AdminModerationReportRow[];
  attachments: AdminReportAttachmentRow[];
  reporterSummaries: AdminModerationReporterSummary[];
  chatAccess: AdminModerationChatAccess;
  relatedOrders: AdminModerationOrderSummary[];
  activeSanctions: AdminAccountSanctionRow[];
  auditLog: AdminModerationAuditRow[];
};

export type SearchAdminModerationCasesInput = {
  page?: number;
  pageSize?: number;
  status?: AdminModerationSearchStatus;
  category?: ReportCategorySlug;
  minScore?: number;
  search?: string;
};
