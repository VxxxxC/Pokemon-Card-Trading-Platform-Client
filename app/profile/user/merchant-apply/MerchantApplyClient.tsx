"use client";

// name 屬性為 backend 合約（lib/kyc/validation.ts），不可改動。

import { useRef, useState, useActionState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  submitMerchantKycApplication,
  type MyKycApplication,
} from "@/app/actions/merchant-kyc";
import {
  KYC_DOCUMENT_TYPE_LABELS,
  KYC_DOCUMENT_TYPES,
  validateKycDocumentUpload,
  type KycDocumentType,
} from "@/lib/kyc/documents";
import {
  MERCHANT_KYC_STEPS,
  parseMerchantKycFormData,
  validateMerchantKycStep,
  type MerchantKycFormErrors,
  type MerchantKycStep,
} from "@/lib/kyc/validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DocumentUploadState = {
  storagePath: string;
  fileName: string;
};

const DOC_FIELD_NAME: Record<KycDocumentType, string> = {
  br_certificate: "docBrCertificate",
  bank_statement: "docBankStatement",
  rep_id_front: "docRepIdFront",
  rep_id_back: "docRepIdBack",
};

function fieldClass(hasError: boolean): string {
  return cn(
    "w-full h-11 px-4 rounded-lg bg-bg-card font-sans text-[14px] text-text-primary placeholder:text-text-disabled border outline-none transition-shadow",
    hasError
      ? "border-warning focus:ring-2 focus:ring-[rgba(239,68,68,0.30)]"
      : "border-[rgba(237,232,224,0.12)] focus:ring-2 focus:ring-[rgba(140,115,85,0.40)] focus:border-[rgba(212,165,116,0.40)]",
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 font-sans text-[12px] text-warning">{message}</p>;
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block font-sans text-[13px] font-medium text-text-secondary mb-1.5">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className={fieldClass(!!error)}
      />
      <FieldError message={error} />
    </div>
  );
}

function MerchantApplyStepper({
  currentStep,
  maxReachedStep,
  onStepClick,
}: {
  currentStep: MerchantKycStep;
  maxReachedStep: MerchantKycStep;
  onStepClick: (step: MerchantKycStep) => void;
}) {
  return (
    <ol className="flex items-center justify-between gap-2 mb-8">
      {MERCHANT_KYC_STEPS.map(({ step, title }, index) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isClickable = step <= maxReachedStep;

        return (
          <li key={step} className="flex flex-1 items-center gap-2 min-w-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step)}
              className={cn(
                "flex flex-col items-center gap-1.5 flex-1 min-w-0 transition-opacity",
                isClickable ? "cursor-pointer" : "cursor-default opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold border",
                  isActive &&
                    "bg-brand text-[#17130f] border-brand",
                  isCompleted &&
                    !isActive &&
                    "bg-[rgba(16,185,129,0.15)] text-success border-success/30",
                  !isActive &&
                    !isCompleted &&
                    "bg-bg-card text-text-secondary border-[rgba(237,232,224,0.12)]",
                )}
              >
                {isCompleted && !isActive ? "✓" : step}
              </span>
              <span
                className={cn(
                  "font-sans text-[11px] truncate w-full text-center",
                  isActive ? "text-brand font-semibold" : "text-text-secondary",
                )}
              >
                {title}
              </span>
            </button>
            {index < MERCHANT_KYC_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-2 mb-5",
                  step < currentStep
                    ? "bg-success/40"
                    : "bg-[rgba(237,232,224,0.12)]",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function DocumentUploadField({
  documentType,
  uploaded,
  uploading,
  uploadError,
  fieldError,
  onFileSelected,
}: {
  documentType: KycDocumentType;
  uploaded: DocumentUploadState | null;
  uploading: boolean;
  uploadError: string | null;
  fieldError?: string;
  onFileSelected: (file: File) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block font-sans text-[13px] font-medium text-text-secondary mb-1.5">
        {KYC_DOCUMENT_TYPE_LABELS[documentType]} *（PDF / JPG / PNG / WEBP，10MB
        內）
      </label>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        disabled={uploading}
        className="block w-full text-[13px] text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      <input
        type="hidden"
        name={DOC_FIELD_NAME[documentType]}
        value={uploaded?.storagePath ?? ""}
      />
      {uploading && (
        <p className="mt-1 font-sans text-[12px] text-text-secondary">
          上傳中…
        </p>
      )}
      {uploaded && !uploading && (
        <p className="mt-1 font-sans text-[12px] text-success">
          已上傳：{uploaded.fileName}
        </p>
      )}
      <FieldError message={uploadError ?? fieldError} />
    </div>
  );
}

function StatusCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <Card className="bg-bg-card border-[rgba(212,165,116,0.20)]">
        <CardHeader>
          <CardTitle className="font-sans text-[20px] text-text-primary">
            {title}
          </CardTitle>
          <CardDescription className="text-text-secondary">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export function MerchantApplyClient({
  initialApplication,
}: {
  initialApplication: MyKycApplication | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [currentStep, setCurrentStep] = useState<MerchantKycStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<MerchantKycStep>(1);
  const [stepErrors, setStepErrors] = useState<MerchantKycFormErrors | null>(
    null,
  );

  const [documents, setDocuments] = useState<
    Partial<Record<KycDocumentType, DocumentUploadState>>
  >({});
  const [uploadingTypes, setUploadingTypes] = useState<Set<KycDocumentType>>(
    new Set(),
  );
  const [uploadErrors, setUploadErrors] = useState<
    Partial<Record<KycDocumentType, string>>
  >({});

  const [errors, formAction, isPending] = useActionState<
    MerchantKycFormErrors | null,
    FormData
  >(async (prev, formData) => {
    const result = await submitMerchantKycApplication(prev, formData);
    if (result === null) {
      router.push("/profile/merchant");
      router.refresh();
    }
    return result;
  }, null);

  const displayErrors = errors ?? stepErrors;

  if (initialApplication?.status === "pending") {
    return (
      <StatusCard
        title="商戶入駐申請 — 審核中"
        description={`公司：${initialApplication.companyNameEn}（BR：${initialApplication.brNumber}）`}
      >
        <p className="font-sans text-[14px] text-text-secondary leading-relaxed">
          您的申請已於{" "}
          {new Date(initialApplication.submittedAt).toLocaleDateString("zh-HK")}{" "}
          提交。平台管理員正在人工審核，通過後系統將自動為您開通商戶帳戶及 Stripe
          收款設定。
        </p>
        <Link
          href="/profile/merchant"
          className="inline-block mt-4 font-sans text-[14px] text-brand hover:underline"
        >
          前往商戶後台
        </Link>
        <Link
          href="/profile/user"
          className="inline-block mt-2 font-sans text-[13px] text-text-secondary hover:underline"
        >
          返回會員中心
        </Link>
      </StatusCard>
    );
  }

  if (initialApplication?.status === "approved") {
    return (
      <StatusCard
        title="商戶入駐申請 — 已批准"
        description="您的商戶帳戶已開通"
      >
        <Link
          href="/profile/merchant"
          className="inline-block font-sans text-[14px] text-brand hover:underline"
        >
          前往商戶後台
        </Link>
      </StatusCard>
    );
  }

  const isResubmission = initialApplication?.status === "rejected";

  async function handleUpload(documentType: KycDocumentType, file: File) {
    const clientError = validateKycDocumentUpload({
      size: file.size,
      type: file.type,
      name: file.name,
    });
    if (clientError) {
      setUploadErrors((prev) => ({ ...prev, [documentType]: clientError }));
      return;
    }

    setUploadErrors((prev) => ({ ...prev, [documentType]: undefined }));
    setUploadingTypes((prev) => new Set(prev).add(documentType));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("documentType", documentType);
      uploadFormData.append("document", file);

      const response = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: uploadFormData,
      });
      const json = (await response.json()) as
        | { success: true; data: { storagePath: string } }
        | { success: false; error: string };

      if (!json.success) {
        setUploadErrors((prev) => ({ ...prev, [documentType]: json.error }));
        return;
      }

      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          storagePath: json.data.storagePath,
          fileName: file.name,
        },
      }));
    } catch {
      setUploadErrors((prev) => ({
        ...prev,
        [documentType]: "上傳失敗，請稍後再試",
      }));
    } finally {
      setUploadingTypes((prev) => {
        const next = new Set(prev);
        next.delete(documentType);
        return next;
      });
    }
  }

  function readFormFields() {
    if (!formRef.current) return null;
    return parseMerchantKycFormData(new FormData(formRef.current));
  }

  function handleNext() {
    const fields = readFormFields();
    if (!fields) return;

    const validationErrors = validateMerchantKycStep(currentStep, fields);
    if (Object.keys(validationErrors).length > 0) {
      setStepErrors(validationErrors);
      return;
    }

    setStepErrors(null);
    const nextStep = Math.min(currentStep + 1, 3) as MerchantKycStep;
    setCurrentStep(nextStep);
    setMaxReachedStep((prev) => Math.max(prev, nextStep) as MerchantKycStep);
  }

  function handleBack() {
    setStepErrors(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as MerchantKycStep);
  }

  function handleStepClick(step: MerchantKycStep) {
    if (step <= maxReachedStep) {
      setStepErrors(null);
      setCurrentStep(step);
    }
  }

  const activeStepMeta = MERCHANT_KYC_STEPS.find((s) => s.step === currentStep)!;
  const allDocumentsUploaded = KYC_DOCUMENT_TYPES.every(
    (type) => documents[type],
  );

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 animate-fadeIn">
      <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
        請按步驟填寫香港公司資料及上傳證明文件。審批通過後，出款銀行帳戶將於 Stripe
        開戶時設定。
      </p>

      {isResubmission && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-[rgba(239,68,68,0.08)] p-4">
          <p className="font-sans text-[13px] text-warning">
            上次申請未獲批准：{initialApplication?.rejectReason ?? "未提供原因"}
          </p>
          <p className="mt-1 font-sans text-[12px] text-text-secondary">
            請修正後重新提交。
          </p>
        </div>
      )}

      <MerchantApplyStepper
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepClick={handleStepClick}
      />

      <form ref={formRef} action={formAction}>
        {/* Step 1 — 公司資料 */}
        <div className={cn(currentStep !== 1 && "hidden")}>
          <Card className="bg-bg-card border-[rgba(212,165,116,0.20)]">
            <CardHeader>
              <CardTitle className="font-sans text-[18px]">
                {activeStepMeta.title}
              </CardTitle>
              <CardDescription>{activeStepMeta.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <TextField
                label="公司英文法定名稱"
                name="companyNameEn"
                placeholder="ABC Trading Limited"
                error={displayErrors?.companyNameEn}
              />
              <TextField
                label="公司中文名稱"
                name="companyNameZh"
                required={false}
                error={displayErrors?.companyNameZh}
              />
              <TextField
                label="商業登記號碼 (BR No.)"
                name="brNumber"
                placeholder="12345678-000"
                error={displayErrors?.brNumber}
              />
              <TextField
                label="公司註冊地址（第一行）"
                name="companyAddressLine1"
                error={displayErrors?.companyAddressLine1}
              />
              <TextField
                label="公司註冊地址（第二行）"
                name="companyAddressLine2"
                required={false}
                error={displayErrors?.companyAddressLine2}
              />
              <TextField
                label="公司電話"
                name="companyPhone"
                placeholder="+852 12345678"
                error={displayErrors?.companyPhone}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button type="button" onClick={handleNext}>
                下一步
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Step 2 — 代表人資料 */}
        <div className={cn(currentStep !== 2 && "hidden")}>
          <Card className="bg-bg-card border-[rgba(212,165,116,0.20)]">
            <CardHeader>
              <CardTitle className="font-sans text-[18px]">
                {activeStepMeta.title}
              </CardTitle>
              <CardDescription>{activeStepMeta.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <TextField
                label="代表人英文姓名"
                name="repNameEn"
                placeholder="CHAN Tai Man"
                error={displayErrors?.repNameEn}
              />
              <TextField
                label="代表人中文姓名"
                name="repNameZh"
                required={false}
                error={displayErrors?.repNameZh}
              />
              <TextField
                label="出生日期"
                name="repDob"
                type="date"
                error={displayErrors?.repDob}
              />
              <TextField
                label="香港身份證號碼"
                name="repHkid"
                placeholder="A123456(7)"
                error={displayErrors?.repHkid}
              />
              <TextField
                label="住宅地址（第一行）"
                name="repAddressLine1"
                error={displayErrors?.repAddressLine1}
              />
              <TextField
                label="住宅地址（第二行）"
                name="repAddressLine2"
                required={false}
                error={displayErrors?.repAddressLine2}
              />
              <TextField
                label="電郵"
                name="repEmail"
                type="email"
                error={displayErrors?.repEmail}
              />
              <TextField
                label="電話"
                name="repPhone"
                placeholder="+852 91234567"
                error={displayErrors?.repPhone}
              />
              <TextField
                label="職位"
                name="repTitle"
                placeholder="Director"
                error={displayErrors?.repTitle}
              />
            </CardContent>
            <CardFooter className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={handleBack}>
                上一步
              </Button>
              <Button type="button" onClick={handleNext}>
                下一步
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Step 3 — 證明文件 */}
        <div className={cn(currentStep !== 3 && "hidden")}>
          <Card className="bg-bg-card border-[rgba(212,165,116,0.20)]">
            <CardHeader>
              <CardTitle className="font-sans text-[18px]">
                {activeStepMeta.title}
              </CardTitle>
              <CardDescription>
                {activeStepMeta.description}。出款銀行帳戶將於審批通過後，於
                Stripe 開戶流程中設定，無需在此填寫戶口號碼。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {KYC_DOCUMENT_TYPES.map((documentType) => (
                <DocumentUploadField
                  key={documentType}
                  documentType={documentType}
                  uploaded={documents[documentType] ?? null}
                  uploading={uploadingTypes.has(documentType)}
                  uploadError={uploadErrors[documentType] ?? null}
                  fieldError={
                    displayErrors?.[
                      DOC_FIELD_NAME[
                        documentType
                      ] as keyof MerchantKycFormErrors
                    ]
                  }
                  onFileSelected={(file) => handleUpload(documentType, file)}
                />
              ))}
              <FieldError message={displayErrors?.form} />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="sm:order-1"
              >
                上一步
              </Button>
              <Button
                type="submit"
                disabled={isPending || !allDocumentsUploaded}
                className="sm:order-2"
              >
                {isPending
                  ? "提交中…"
                  : isResubmission
                    ? "重新提交申請"
                    : "提交商戶入駐申請"}
              </Button>
            </CardFooter>
            {!allDocumentsUploaded && (
              <p className="px-4 pb-4 font-sans text-[12px] text-text-secondary">
                請先上傳齊全部 4 份文件方可提交。
              </p>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
