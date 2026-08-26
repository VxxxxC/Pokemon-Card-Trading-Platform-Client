"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Calendar as CalendarIcon,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  X,
  Link2,
  Megaphone,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createPlatformAnnouncement,
  deletePlatformAnnouncement,
  getAnnouncementsForAdmin,
  togglePlatformAnnouncementActive,
  updatePlatformAnnouncement,
} from "@/app/actions/admin-announcements";
import {
  BTN_OUTLINE_CLASS,
  BTN_OUTLINE_SM_CLASS,
  BTN_PRIMARY_CLASS,
  FILTER_CHIP_CLASS,
  FILTER_INPUT_CLASS,
  FORM_INPUT_CLASS,
  FORM_LABEL_CLASS,
  FORM_SECTION_CLASS,
  FORM_SWITCH_CLASS,
  FORM_TEXTAREA_CLASS,
  FORM_TOGGLE_ROW_CLASS,
} from "@/app/admin/campaigns/campaigns-ui";
import { DEFAULT_ANNOUNCEMENT_POSTER_URL } from "@/lib/announcements/defaults";
import { uploadAnnouncementPosterImage } from "@/lib/announcements/client-upload";
import {
  getAnnouncementStatus,
} from "@/lib/announcements/status";
import type { PlatformAnnouncement } from "@/lib/announcements/types";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [pendingAnnouncementId, setPendingAnnouncementId] = useState(() =>
    crypto.randomUUID(),
  );
  const [imageObjectKey, setImageObjectKey] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // File upload preview state
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getAnnouncementsForAdmin();
      if (cancelled) return;

      if (result.success) {
        setAnnouncements(result.data);
      } else {
        setFeedbackMessage(result.error);
      }
      setIsLoadingAnnouncements(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Compute status summary counts
  const stats = useMemo(() => {
    const now = new Date();
    let activeCount = 0;
    let upcomingCount = 0;
    let expiredCount = 0;
    let inactiveCount = 0;

    announcements.forEach((item) => {
      const status = getAnnouncementStatus(item, now);
      if (status.code === "active") activeCount++;
      else if (status.code === "upcoming") upcomingCount++;
      else if (status.code === "expired") expiredCount++;
      else if (status.code === "inactive") inactiveCount++;
    });

    return {
      total: announcements.length,
      active: activeCount,
      upcoming: upcomingCount,
      expired: expiredCount,
      inactive: inactiveCount,
    };
  }, [announcements]);

  // Filtered list
  const filteredAnnouncements = useMemo(() => {
    const now = new Date();
    return announcements.filter((item) => {
      // Search match
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "all") return true;
      const status = getAnnouncementStatus(item, now);
      return status.code === statusFilter;
    });
  }, [announcements, searchQuery, statusFilter]);

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleEdit = (announcement: PlatformAnnouncement) => {
    setIsFormOpen(true);
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setImageUrl(announcement.imageUrl);
    setLinkUrl(announcement.linkUrl || "");
    setStartDate(new Date(announcement.startDate + "T00:00:00"));
    setEndDate(new Date(announcement.endDate + "T23:59:59"));
    setIsActive(announcement.isActive);
    setPriority(announcement.priority);
    setPendingAnnouncementId(announcement.id);
    setImageObjectKey(announcement.imageObjectKey ?? null);
    setSelectedFile(null);
    setSelectedFileName("");
    // Scroll smoothly to form section on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFormFields = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setLinkUrl("");
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setIsActive(true);
    setPriority(announcements.length + 1);
    setPendingAnnouncementId(crypto.randomUUID());
    setImageObjectKey(null);
    setSelectedFile(null);
    setSelectedFileName("");
  };

  const handleOpenCreateForm = () => {
    resetFormFields();
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetForm = () => {
    resetFormFields();
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);

    try {
      if (!title.trim()) {
        showToast("請輸入公告標題");
        return;
      }

      if (!content.trim()) {
        showToast("請輸入公告內容詳情");
        return;
      }

      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      if (startDate > endDate) {
        showToast("下架日期不能早於上架日期");
        return;
      }

      const announcementId = editingId ?? pendingAnnouncementId;
      let nextImageUrl = imageUrl.trim();
      let nextObjectKey = imageObjectKey;

      if (selectedFile) {
        const upload = await uploadAnnouncementPosterImage(
          selectedFile,
          announcementId,
        );
        nextImageUrl = upload.cdnUrl;
        nextObjectKey = upload.objectKey;
      }

      if (!nextImageUrl || nextImageUrl.startsWith("blob:")) {
        nextImageUrl = DEFAULT_ANNOUNCEMENT_POSTER_URL;
        nextObjectKey = null;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: nextImageUrl,
        imageObjectKey: nextObjectKey,
        linkUrl: linkUrl.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        isActive,
        priority,
      };

      const result = editingId
        ? await updatePlatformAnnouncement(editingId, payload)
        : await createPlatformAnnouncement({ ...payload, id: announcementId });

      if (!result.success) {
        showToast(result.error);
        return;
      }

      const reload = await getAnnouncementsForAdmin();
      if (reload.success) {
        setAnnouncements(reload.data);
      }

      showToast(editingId ? "已成功更新公告！" : "已成功新增公告！");
      handleResetForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "儲存公告失敗，請稍後再試",
      );
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const result = await togglePlatformAnnouncementActive(id);
    if (!result.success) {
      showToast(result.error);
      return;
    }

    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? result.data : item)),
    );
    showToast(result.data.isActive ? "公告已重新上架" : "公告已下架");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除此公告嗎？此操作無法復原。")) {
      return;
    }

    const result = await deletePlatformAnnouncement(id);
    if (!result.success) {
      showToast(result.error);
      return;
    }

    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
    showToast("公告已刪除");
    if (editingId === id) {
      handleResetForm();
    }
  };

  const statusFilters = [
    { id: "all", label: "全部", count: stats.total },
    { id: "active", label: "進行中", count: stats.active },
    { id: "upcoming", label: "未開始", count: stats.upcoming },
    { id: "expired", label: "已過期", count: stats.expired },
    { id: "inactive", label: "已下架", count: stats.inactive },
  ] as const;

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-5 pb-8">
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-brand/40 bg-bg-card px-4 py-3 font-sans text-[13px] text-text-primary shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
            首頁活動與公告管理
          </h1>
          <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand">
            ANNOUNCE
          </span>
        </div>
        <p className="mt-1 font-sans text-[13px] text-text-secondary">
          管理全站公告彈窗與動態輪播橫幅，精準設定上架時段與展示狀態。
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        {isFormOpen ? (
          <div className="lg:col-span-5">
            <section className="space-y-4 border-b border-white/[0.08] pb-5 lg:border-b-0 lg:pb-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className={FORM_SECTION_CLASS}>
                  {editingId ? "編輯公告內容" : "建立新公告"}
                </h2>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className={`${BTN_OUTLINE_SM_CLASS} gap-1.5`}
                >
                  <RotateCcw className="size-3.5" />
                  {editingId ? "取消編輯" : "取消"}
                </button>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={FORM_LABEL_CLASS}>
                  公告標題 <span className="text-warning">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="請輸入吸引人的活動或公告標題…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={FORM_INPUT_CLASS}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={FORM_LABEL_CLASS}>
                  封面海報圖（本地上傳 / 網路 URL）
                </label>
                <div className="relative flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-transparent p-3 text-center transition-colors hover:border-brand/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="flex items-center gap-2 font-sans text-[11px] text-text-secondary">
                    <Upload className="size-4 shrink-0 text-brand" />
                    <span>
                      {selectedFileName
                        ? `已選擇：${selectedFileName}`
                        : "點擊或拖曳上傳圖片（JPG、PNG、WEBP）"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link2 className="size-3.5 shrink-0 text-text-disabled" />
                  <Input
                    type="text"
                    placeholder="或輸入圖片網址（https://…）"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setSelectedFileName("");
                      setSelectedFile(null);
                      setImageObjectKey(null);
                    }}
                    className={`${FORM_INPUT_CLASS} text-[12px]`}
                  />
                </div>
                {imageUrl ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        setSelectedFileName("");
                        setSelectedFile(null);
                        setImageObjectKey(null);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className={FORM_LABEL_CLASS}>
                  公告詳細內容 <span className="text-warning">*</span>
                </label>
                <Textarea
                  rows={4}
                  placeholder="請輸入公告詳細說明、活動辦法、限制條件等…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={FORM_TEXTAREA_CLASS}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className={FORM_LABEL_CLASS}>點擊跳轉連結（選填）</label>
                <Input
                  type="text"
                  placeholder="例如：/catalog 或 https://…"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className={`${FORM_INPUT_CLASS} text-[12px]`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={FORM_LABEL_CLASS}>上架開始日期</label>
                  <Popover>
                    <PopoverTrigger
                      className={`${FORM_INPUT_CLASS} flex w-full items-center gap-2 font-mono text-[12px]`}
                    >
                      <CalendarIcon className="size-3.5 shrink-0 text-brand" />
                      {format(startDate, "yyyy-MM-dd")}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto border border-white/10 bg-bg-card p-0 shadow-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        locale={zhTW}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className={FORM_LABEL_CLASS}>下架結束日期</label>
                  <Popover>
                    <PopoverTrigger
                      className={`${FORM_INPUT_CLASS} flex w-full items-center gap-2 font-mono text-[12px]`}
                    >
                      <CalendarIcon className="size-3.5 shrink-0 text-brand" />
                      {format(endDate, "yyyy-MM-dd")}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto border border-white/10 bg-bg-card p-0 shadow-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        locale={zhTW}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className={FORM_TOGGLE_ROW_CLASS}>
                <div className="space-y-0.5">
                  <div className="font-sans text-[12px] font-semibold text-text-primary">
                    公告上架狀態
                  </div>
                  <div className="font-sans text-[11px] text-text-secondary">
                    {isActive
                      ? "啟用（符合時段將公開展示）"
                      : "下架（暫不公開展示）"}
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className={FORM_SWITCH_CLASS}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoadingAnnouncements || isSavingAnnouncement}
                  className={`${BTN_PRIMARY_CLASS} flex-1 disabled:opacity-50`}
                >
                  {isSavingAnnouncement
                    ? "儲存中…"
                    : editingId
                      ? "儲存變更"
                      : "新增公告"}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className={BTN_OUTLINE_CLASS}
                >
                  重設
                </button>
              </div>
            </form>
          </section>
        </div>
        ) : null}

        <div
          className={`space-y-4 ${isFormOpen ? "lg:col-span-7" : "lg:col-span-12"}`}
        >
          <div className="space-y-3 border-b border-white/[0.08] pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="搜尋公告標題或內容…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={FILTER_INPUT_CLASS}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-disabled hover:text-text-primary"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            {!isFormOpen ? (
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className={`${BTN_PRIMARY_CLASS} shrink-0 gap-1.5`}
              >
                <Plus className="size-3.5" />
                新增公告
              </button>
            ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`${FILTER_CHIP_CLASS(statusFilter === filter.id)} gap-1.5`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      statusFilter === filter.id
                        ? "text-brand/80"
                        : "text-text-disabled"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-0 divide-y divide-white/[0.06]">
            {isLoadingAnnouncements ? (
              <p className="py-10 text-center font-sans text-[13px] text-text-secondary">
                載入公告中…
              </p>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="mb-2 size-8 text-text-disabled" />
                <p className="font-sans text-[13px] font-semibold text-text-primary">
                  找不到符合條件的公告
                </p>
                <p className="mt-1 font-sans text-[12px] text-text-secondary">
                  嘗試調整搜尋關鍵字或選擇其他狀態分類
                </p>
              </div>
            ) : (
              filteredAnnouncements.map((item) => {
                const status = getAnnouncementStatus(item);
                const isSelectedForEdit = editingId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`space-y-3 px-1 py-4 transition-colors ${
                      isSelectedForEdit ? "bg-brand/10" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border border-white/10 sm:w-36">
                        <Image
                          src={
                            item.imageUrl ||
                            "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1200&auto=format&fit=crop"
                          }
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <span
                          className={`absolute top-2 left-2 rounded border px-2 py-0.5 font-mono text-[9px] ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="line-clamp-2 font-sans text-[13px] font-semibold text-text-primary">
                          {item.title}
                        </h3>
                        <p className="line-clamp-2 font-sans text-[12px] leading-relaxed text-text-secondary">
                          {item.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-0.5 font-mono text-[11px] text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-brand" />
                            {item.startDate} ~ {item.endDate}
                          </span>
                          {item.linkUrl ? (
                            <span className="flex items-center gap-1 text-brand">
                              <Link2 className="size-3" />
                              <span className="truncate max-w-[12rem]">
                                {item.linkUrl}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                      <span className="font-mono text-[10px] text-text-disabled">
                        {item.id}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`${BTN_OUTLINE_SM_CLASS} gap-1.5`}
                        >
                          {item.isActive ? (
                            <>
                              <EyeOff className="size-3.5 text-warning" />
                              下架
                            </>
                          ) : (
                            <>
                              <Eye className="size-3.5 text-success" />
                              重新上架
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className={`${BTN_OUTLINE_SM_CLASS} gap-1.5 text-brand`}
                        >
                          <Pencil className="size-3.5" />
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className={`${BTN_OUTLINE_SM_CLASS} border-warning/30 text-warning hover:border-warning/40 hover:bg-warning/10 hover:text-warning`}
                        >
                          <Trash2 className="size-3.5" />
                          刪除
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
