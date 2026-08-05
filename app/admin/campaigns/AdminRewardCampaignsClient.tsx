"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  listAdminRewardCampaigns,
  setAdminRewardCampaignStatus,
  upsertAdminRewardCampaign,
} from "@/app/actions/admin-reward-campaigns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminRewardCampaignRow,
  AdminRewardCampaignStatus,
  AdminRewardCampaignUpsertInput,
  AdminRewardTemplateRow,
} from "@/lib/admin-rewards/types";
import { buildDefaultFlashSchedule } from "@/lib/admin-rewards/template-form";

type AdminRewardCampaignsClientProps = {
  initialCampaigns: AdminRewardCampaignRow[];
  initialTotal: number;
  flashTemplates: AdminRewardTemplateRow[];
  loadError: string | null;
};

const STATUS_LABELS: Record<AdminRewardCampaignStatus, string> = {
  draft: "草稿",
  active: "進行中",
  paused: "已暫停",
  ended: "已結束",
};

function localDateTimeToIso(value: string): string {
  if (!value.trim()) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}

function isoToLocalDateTime(value: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildCampaignForm(
  templateId: string,
  row?: AdminRewardCampaignRow | null,
): AdminRewardCampaignUpsertInput {
  const defaults = buildDefaultFlashSchedule();
  return {
    id: row?.id,
    template_id: row?.template_id ?? templateId,
    name: row?.name ?? defaults.campaign_name,
    status: row?.status ?? "draft",
    starts_at: row ? isoToLocalDateTime(row.starts_at) : defaults.starts_at,
    ends_at: row ? isoToLocalDateTime(row.ends_at) : defaults.ends_at,
    max_claims: row?.max_claims ?? defaults.max_claims,
    max_claims_per_user: row?.max_claims_per_user ?? defaults.max_claims_per_user,
    override_valid_days: row?.override_valid_days ?? defaults.override_valid_days,
  };
}

export function AdminRewardCampaignsClient({
  initialCampaigns,
  initialTotal,
  flashTemplates,
  loadError,
}: AdminRewardCampaignsClientProps) {
  const [rows, setRows] = useState(initialCampaigns);
  const [total, setTotal] = useState(initialTotal);
  const [statusFilter, setStatusFilter] = useState<
    AdminRewardCampaignStatus | "all"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AdminRewardCampaignUpsertInput | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultTemplateId = flashTemplates[0]?.id ?? "";

  const refreshList = () => {
    startTransition(async () => {
      const result = await listAdminRewardCampaigns({
        status: statusFilter,
        page: 1,
        pageSize: 50,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows(result.data.rows);
      setTotal(result.data.total);
    });
  };

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") {
      return rows;
    }
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const openCreate = () => {
    if (!defaultTemplateId) {
      toast.error("請先發布至少一個「限時搶領」模板");
      return;
    }
    setForm(buildCampaignForm(defaultTemplateId));
    setDialogOpen(true);
  };

  const openEdit = (row: AdminRewardCampaignRow) => {
    setForm(buildCampaignForm(row.template_id, row));
    setDialogOpen(true);
  };

  const saveCampaign = () => {
    if (!form) {
      return;
    }

    startTransition(async () => {
      const result = await upsertAdminRewardCampaign({
        ...form,
        starts_at: localDateTimeToIso(form.starts_at),
        ends_at: localDateTimeToIso(form.ends_at),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("已儲存活動檔期");
      setDialogOpen(false);
      refreshList();
    });
  };

  const handleStatus = (campaignId: string, status: AdminRewardCampaignStatus) => {
    startTransition(async () => {
      const result = await setAdminRewardCampaignStatus(campaignId, status);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`活動狀態已更新為 ${STATUS_LABELS[status]}`);
      refreshList();
    });
  };

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="text-sm text-red-300">{loadError}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as AdminRewardCampaignStatus | "all")
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="active">進行中</SelectItem>
              <SelectItem value="paused">已暫停</SelectItem>
              <SelectItem value="ended">已結束</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-[#d4c4b7]">共 {total} 個檔期</span>
        </div>
        <Button type="button" onClick={openCreate} disabled={isPending}>
          新增搶券檔期
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#26211C] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>活動</TableHead>
              <TableHead>模板</TableHead>
              <TableHead>檔期</TableHead>
              <TableHead>庫存</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#d4c4b7]">
                  暫無活動檔期
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.template_title ?? row.template_id}</TableCell>
                  <TableCell className="text-xs text-[#d4c4b7]">
                    {new Date(row.starts_at).toLocaleString("zh-HK")} —{" "}
                    {new Date(row.ends_at).toLocaleString("zh-HK")}
                  </TableCell>
                  <TableCell>
                    {row.claimed_count} / {row.max_claims}
                  </TableCell>
                  <TableCell>{STATUS_LABELS[row.status]}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(row)}
                      disabled={isPending}
                    >
                      編輯
                    </Button>
                    {row.status === "active" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatus(row.id, "paused")}
                        disabled={isPending}
                      >
                        暫停
                      </Button>
                    ) : row.status === "paused" || row.status === "draft" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatus(row.id, "active")}
                        disabled={isPending}
                      >
                        上線
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "編輯搶券檔期" : "新增搶券檔期"}
            </DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-3">
              <div>
                <Label>綁定模板</Label>
                <Select
                  value={form.template_id}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    setForm({ ...form, template_id: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {flashTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="admin-campaign-name">活動名稱</Label>
                <Input
                  id="admin-campaign-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="admin-campaign-starts">開始</Label>
                  <Input
                    id="admin-campaign-starts"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(event) =>
                      setForm({ ...form, starts_at: event.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="admin-campaign-ends">結束</Label>
                  <Input
                    id="admin-campaign-ends"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(event) =>
                      setForm({ ...form, ends_at: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="admin-campaign-stock">庫存</Label>
                  <Input
                    id="admin-campaign-stock"
                    type="number"
                    min={1}
                    value={form.max_claims}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        max_claims: Number(event.target.value || 0),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="admin-campaign-per-user">每人限搶</Label>
                  <Input
                    id="admin-campaign-per-user"
                    type="number"
                    min={1}
                    value={form.max_claims_per_user ?? 1}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        max_claims_per_user: Number(event.target.value || 1),
                      })
                    }
                  />
                </div>
              </div>
              <Button type="button" onClick={saveCampaign} disabled={isPending}>
                儲存
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
