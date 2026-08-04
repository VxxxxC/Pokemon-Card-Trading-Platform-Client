"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { listAdminRewardTemplates, setAdminRewardTemplateStatus } from "@/app/actions/admin-rewards";
import { RewardTemplateWizard } from "@/app/admin/campaigns/wizard/RewardTemplateWizard";
import { Button } from "@/components/ui/button";
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
  AdminRewardTemplateRow,
  AdminRewardTemplateStatus,
} from "@/lib/admin-rewards/types";
import {
  formatStock,
  STATUS_LABELS,
  TYPE_LABELS,
} from "@/lib/admin-rewards/template-form";

type AdminRewardTemplatesClientProps = {
  initialRows: AdminRewardTemplateRow[];
  initialTotal: number;
  loadError: string | null;
};

export function AdminRewardTemplatesClient({
  initialRows,
  initialTotal,
  loadError,
}: AdminRewardTemplatesClientProps) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [statusFilter, setStatusFilter] = useState<
    AdminRewardTemplateStatus | "all"
  >("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminRewardTemplateRow | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const refreshList = () => {
    startTransition(async () => {
      const result = await listAdminRewardTemplates({
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

  const handleStatus = (templateId: string, status: AdminRewardTemplateStatus) => {
    startTransition(async () => {
      const result = await setAdminRewardTemplateStatus(templateId, status);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        status === "active"
          ? "已發布"
          : status === "archived"
            ? "已封存"
            : "已更新狀態",
      );
      refreshList();
    });
  };

  const openCreate = () => {
    setEditingRow(null);
    setWizardOpen(true);
  };

  const openEdit = (row: AdminRewardTemplateRow) => {
    setEditingRow(row);
    setWizardOpen(true);
  };

  const filteredNote = useMemo(() => {
    if (statusFilter === "all") {
      return `共 ${total} 個模板`;
    }
    return `${STATUS_LABELS[statusFilter]} · ${rows.length} 筆`;
  }, [rows.length, statusFilter, total]);

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sans text-lg font-semibold text-[#eae1da]">
              獎勵模板
            </h2>
            <p className="text-sm text-[#d4c4b7]">
              建立積分、折扣券、免運券模板。發布後條件達成會自動發放。
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                const next = value as AdminRewardTemplateStatus | "all";
                setStatusFilter(next);
                startTransition(async () => {
                  const result = await listAdminRewardTemplates({
                    status: next,
                    page: 1,
                    pageSize: 50,
                  });
                  if (result.success) {
                    setRows(result.data.rows);
                    setTotal(result.data.total);
                  }
                });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="active">已發布</SelectItem>
                <SelectItem value="archived">已封存</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={openCreate}>
              新增模板
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#8A8680]">{filteredNote}</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>標題</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>庫存</TableHead>
              <TableHead>更新</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#8A8680]">
                  暫無模板
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{TYPE_LABELS[row.type]}</TableCell>
                  <TableCell>{STATUS_LABELS[row.status]}</TableCell>
                  <TableCell>{formatStock(row)}</TableCell>
                  <TableCell>
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleString("zh-HK")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row)}
                      >
                        編輯
                      </Button>
                      {row.status === "draft" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleStatus(row.id, "active")}
                          disabled={isPending}
                        >
                          發布
                        </Button>
                      ) : null}
                      {row.status !== "archived" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatus(row.id, "archived")}
                          disabled={isPending}
                        >
                          封存
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RewardTemplateWizard
        key={editingRow?.id ?? "new"}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialRow={editingRow}
        onSaved={refreshList}
      />
    </div>
  );
}
