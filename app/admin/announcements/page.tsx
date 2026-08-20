"use client";

import { useState, useMemo } from "react";
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
  Sparkles,
  Clock,
  X,
  Link2,
  Megaphone,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MOCK_ANNOUNCEMENTS,
  getAnnouncementStatus,
  type Announcement,
} from "@/app/lib/mockAnnouncements";

export default function AdminAnnouncementsPage() {
  // Announcements state initialized with mock data
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

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

  // File upload preview state
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
      // Create local object URL for preview
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  // Populate form for editing
  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setImageUrl(announcement.imageUrl);
    setLinkUrl(announcement.linkUrl || "");
    setStartDate(new Date(announcement.startDate + "T00:00:00"));
    setEndDate(new Date(announcement.endDate + "T23:59:59"));
    setIsActive(announcement.isActive);
    setSelectedFileName("");
    // Scroll smoothly to form section on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset form
  const handleResetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setLinkUrl("");
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setIsActive(true);
    setSelectedFileName("");
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    // TODO: [Supabase Integration] Connect with announcements table / Server Actions for CRUD operations
    if (editingId) {
      // Update existing
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                content: content.trim(),
                imageUrl:
                  imageUrl.trim() ||
                  "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1200&auto=format&fit=crop",
                linkUrl: linkUrl.trim(),
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                isActive,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      showToast("已成功更新公告！");
    } else {
      // Create new
      const newAnnouncement: Announcement = {
        id: `ann-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        imageUrl:
          imageUrl.trim() ||
          "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1200&auto=format&fit=crop",
        linkUrl: linkUrl.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        isActive,
        priority: announcements.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      showToast("已成功新增公告！");
    }

    handleResetForm();
  };

  // Toggle announcement active status
  const handleToggleActive = (id: string) => {
    // TODO: [Supabase Integration] Connect with announcements table / Server Actions for CRUD operations
    setAnnouncements((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedState = !item.isActive;
          showToast(updatedState ? "公告已重新上架" : "公告已下架");
          return {
            ...item,
            isActive: updatedState,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  // Delete announcement
  const handleDelete = (id: string) => {
    if (window.confirm("確定要刪除此公告嗎？此操作無法復原。")) {
      // TODO: [Supabase Integration] Connect with announcements table / Server Actions for CRUD operations
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      showToast("公告已刪除");
      if (editingId === id) {
        handleResetForm();
      }
    }
  };

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-brand/40 bg-[#2e2925] px-4 py-3 text-sm text-text-primary shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-[rgba(237,232,224,0.08)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-brand" />
            <h1 className="font-sans text-2xl font-bold tracking-tight text-text-primary">
              首頁活動與公告管理
            </h1>
          </div>
          <p className="mt-1 font-sans text-sm text-text-secondary">
            管理全站公告彈窗與動態輪播橫幅，精準設定上架時段與展示狀態。
          </p>
        </div>

        {/* Stats summary badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
          <Badge
            variant="outline"
            className="border-[rgba(237,232,224,0.12)] bg-[#26211C] px-3 py-1 font-mono text-xs text-text-primary"
          >
            總計: {stats.total}
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-800/60 bg-emerald-950/40 px-3 py-1 font-mono text-xs text-emerald-400"
          >
            進行中: {stats.active}
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-800/60 bg-amber-950/40 px-3 py-1 font-mono text-xs text-amber-300"
          >
            未開始: {stats.upcoming}
          </Badge>
          <Badge
            variant="outline"
            className="border-neutral-800 bg-neutral-900/60 px-3 py-1 font-mono text-xs text-neutral-400"
          >
            過期/下架: {stats.expired + stats.inactive}
          </Badge>
        </div>
      </div>

      {/* Grid: Left Form Panel / Right Table List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ================= FORM PANEL (4 cols on lg) ================= */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(237,232,224,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <h2 className="font-sans text-base font-bold text-text-primary">
                  {editingId ? "編輯公告內容" : "建立新公告"}
                </h2>
              </div>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetForm}
                  className="h-8 text-xs text-text-secondary hover:text-text-primary hover:bg-[#39342f]"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  取消編輯
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-secondary">
                  公告標題 <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="請輸入吸引人的活動或公告標題..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-[rgba(237,232,224,0.12)] bg-[#17130f] text-text-primary focus-visible:ring-brand/40"
                  required
                />
              </div>

              {/* Field 2: Image Selector & Fallback URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">
                  封面海報圖 (本地上傳 / 網路 URL)
                </label>

                <div className="space-y-2">
                  {/* File upload trigger */}
                  <div className="relative flex items-center justify-center rounded-lg border border-dashed border-[rgba(237,232,224,0.2)] bg-[#17130f] p-3 text-center transition-colors hover:border-brand/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Upload className="h-4 w-4 text-brand shrink-0" />
                      <span>
                        {selectedFileName
                          ? `已選擇: ${selectedFileName}`
                          : "點擊或拖曳上傳圖片 (支持 JPG, PNG, WEBP)"}
                      </span>
                    </div>
                  </div>

                  {/* Fallback URL input */}
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-text-disabled shrink-0" />
                    <Input
                      type="text"
                      placeholder="或輸入圖片網址 (https://...)"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setSelectedFileName("");
                      }}
                      className="h-8 text-xs border-[rgba(237,232,224,0.12)] bg-[#17130f] text-text-primary"
                    />
                  </div>
                </div>

                {/* Image Preview Box */}
                {imageUrl && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-[rgba(237,232,224,0.12)] bg-[#17130f]">
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
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Field 3: Content / Rich Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-secondary">
                  公告詳細內容 <span className="text-rose-400">*</span>
                </label>
                <Textarea
                  rows={4}
                  placeholder="請輸入公告詳細說明、活動辦法、限制條件等..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="border-[rgba(237,232,224,0.12)] bg-[#17130f] text-text-primary focus-visible:ring-brand/40"
                  required
                />
              </div>

              {/* Field 4: Optional Action Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-secondary">
                  點擊跳轉連結 (選填)
                </label>
                <Input
                  type="text"
                  placeholder="例如: /catalog 或 https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="border-[rgba(237,232,224,0.12)] bg-[#17130f] text-text-primary focus-visible:ring-brand/40 text-xs"
                />
              </div>

              {/* Field 5: Start & End Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-secondary">
                    上架開始日期
                  </label>
                  <Popover>
                    <PopoverTrigger className="w-full h-9 justify-start border border-[rgba(237,232,224,0.12)] bg-[#17130f] px-2.5 rounded-lg font-mono text-xs text-text-primary hover:bg-[#2e2925] flex items-center">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-brand shrink-0" />
                      {format(startDate, "yyyy-MM-dd")}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border border-[rgba(237,232,224,0.12)] bg-[#26211C] text-text-primary shadow-2xl"
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
                  <label className="block text-xs font-semibold text-text-secondary">
                    下架結束日期
                  </label>
                  <Popover>
                    <PopoverTrigger className="w-full h-9 justify-start border border-[rgba(237,232,224,0.12)] bg-[#17130f] px-2.5 rounded-lg font-mono text-xs text-text-primary hover:bg-[#2e2925] flex items-center">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-brand shrink-0" />
                      {format(endDate, "yyyy-MM-dd")}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border border-[rgba(237,232,224,0.12)] bg-[#26211C] text-text-primary shadow-2xl"
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

              {/* Field 6: Status Switch Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-[rgba(237,232,224,0.08)] bg-[#17130f] p-3">
                <div className="space-y-0.5">
                  <div className="font-sans text-xs font-semibold text-text-primary">
                    公告上架狀態
                  </div>
                  <div className="font-sans text-[11px] text-text-secondary">
                    {isActive ? "啟用 (符合時段將公開展示)" : "下架 (暫不公開展示)"}
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-brand text-[#17130f] font-bold hover:bg-[#e8b896] active:scale-[0.98] transition-transform"
                >
                  {editingId ? "儲存變更" : "新增公告"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  className="border-[rgba(237,232,224,0.12)] bg-[#17130f] text-text-secondary hover:bg-[#2e2925] hover:text-text-primary"
                >
                  重設
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= ANNOUNCEMENTS LIST / TABLE (7 cols on lg) ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <Input
                type="text"
                placeholder="搜尋公告標題或內容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-[rgba(237,232,224,0.12)] bg-[#17130f] text-xs text-text-primary focus-visible:ring-brand/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "all", label: "全部" },
                { id: "active", label: "進行中" },
                { id: "upcoming", label: "未開始" },
                { id: "expired", label: "已過期" },
                { id: "inactive", label: "已下架" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    statusFilter === filter.id
                      ? "bg-brand text-[#17130f] font-bold shadow-sm"
                      : "bg-[#17130f] text-text-secondary hover:bg-[#2e2925] hover:text-text-primary"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Cards / List */}
          <div className="space-y-3">
            {filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(237,232,224,0.12)] bg-[#26211C] p-10 text-center">
                <Megaphone className="h-10 w-10 text-text-disabled mb-2" />
                <p className="font-sans text-sm font-semibold text-text-primary">
                  找不到符合條件的公告
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  嘗試調整搜尋關鍵字或選擇其他狀態分類
                </p>
              </div>
            ) : (
              filteredAnnouncements.map((item) => {
                const status = getAnnouncementStatus(item);
                const isSelectedForEdit = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col gap-4 rounded-xl border p-4 transition-all ${
                      isSelectedForEdit
                        ? "border-brand bg-[#2e2925] shadow-md ring-1 ring-brand/50"
                        : "border-[rgba(237,232,224,0.08)] bg-[#26211C] hover:border-[rgba(237,232,224,0.2)] hover:bg-[#2e2925]/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      {/* Thumbnail */}
                      <div className="relative h-28 w-full sm:w-40 shrink-0 overflow-hidden rounded-lg border border-[rgba(237,232,224,0.12)] bg-[#17130f]">
                        <Image
                          src={
                            item.imageUrl ||
                            "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1200&auto=format&fit=crop"
                          }
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute top-2 left-2">
                          <Badge
                            variant="outline"
                            className={`border text-[10px] font-bold ${status.badgeClass}`}
                          >
                            {status.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-sans text-sm font-bold text-text-primary line-clamp-2">
                            {item.title}
                          </h3>
                        </div>

                        <p className="font-sans text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-brand" />
                            {item.startDate} ~ {item.endDate}
                          </span>

                          {item.linkUrl && (
                            <span className="flex items-center gap-1 text-brand">
                              <Link2 className="h-3 w-3" />
                              {item.linkUrl}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between border-t border-[rgba(237,232,224,0.06)] pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-text-disabled">
                          ID: {item.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Toggle Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item.id)}
                          className="h-8 text-xs text-text-secondary hover:bg-[#39342f] hover:text-text-primary"
                        >
                          {item.isActive ? (
                            <>
                              <EyeOff className="mr-1 h-3.5 w-3.5 text-amber-400" />
                              下架
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                              重新上架
                            </>
                          )}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 border-[rgba(237,232,224,0.12)] bg-[#17130f] text-xs text-text-primary hover:border-brand hover:bg-brand/10"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5 text-brand" />
                          編輯
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          刪除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
