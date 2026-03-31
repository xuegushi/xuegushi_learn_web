"use client";
import React, { useState, useMemo, useEffect } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSquare, Clock, CircleCheck, CircleX, BookOpen, Calendar as CalendarIcon, RotateCcw, Download, Trash2 } from "lucide-react";
import { exportReciteRecordsJson, exportReciteRecordsExcel, clearReciteRecords, deleteFromDB, STORES } from "@/lib/db";
import { useReciteRecords } from "@/hooks/use-recite-records";
import { DynastyArr } from "@/config/poem";
import { useUserStore } from "@/lib/api/user-store";

function RangeCalendarSelect({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "选择日期";
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatDateValue = (date: Date | undefined) => {
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      onDateFromChange(formatDateValue(range.from));
    }
    if (range?.to) {
      onDateToChange(formatDateValue(range.to));
    }
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const selected = dateFrom || dateTo
    ? {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
      }
    : undefined;

  const zhLocale = { code: "zh-CN" };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="w-56 md:w-64 text-xs justify-start font-normal">
        <CalendarIcon className="mr-1 h-3 w-3" />
        {dateFrom || dateTo
          ? `${formatDateDisplay(dateFrom)}${dateTo ? ` - ${formatDateDisplay(dateTo)}` : ""}`
          : "选择日期区间"}
      </Button>} />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={zhLocale}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DBUser {
  id: number;
  user_name: string;
}

export interface ReciteDetail {
  id?: number;
  user_id: string;
  user_name: string;
  poem_id: string;
  title: string;
  author: string;
  dynasty: string;
  status: boolean;
  createdAt: string;
}

export interface ReciteRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReciteRecordsDialog({ open, onOpenChange }: ReciteRecordsDialogProps) {
  const { currentUser, initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedDynasty, setSelectedDynasty] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [detailSort, setDetailSort] = useState<string>("newest");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const defaultUserSet = React.useRef(false);

  const filters = useMemo(() => ({ selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort }), [selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort]);
  const { loading, users, todayDetails, historyDetails, stats, todayPage, historyPage, setTodayPage, setHistoryPage } = useReciteRecords(open, filters);

  useEffect(() => {
    if (!open) {
      defaultUserSet.current = false;
      return;
    }
    if (defaultUserSet.current) return;
    if (users.length === 0) return;
    defaultUserSet.current = true;
    if (currentUser && users.some(u => u.id === currentUser.user_id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUser(currentUser.user_id.toString());
    }
  }, [open, users, currentUser]);

  function DetailCard({ item }: { item: ReciteDetail }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (
      <div className="p-3 border rounded-lg bg-white relative group">
        <div className="pr-8">
          <div className="text-sm font-semibold">{item.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.dynasty} · {item.author}</div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <UserSquare className="h-3 w-3" />
          {item.user_name}
          <Clock className="h-3 w-3 ml-2" />
          {dateStr}
        </div>
        <div className="absolute top-2 right-2">
          {item.status ? (
            <CircleCheck className="h-5 w-5 text-green-500" />
          ) : (
            <CircleX className="h-5 w-5 text-red-500" />
          )}
        </div>
        <button
          onClick={() => item.id !== undefined && handleDeleteDetail(item.id)}
          className="absolute bottom-2 right-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          title="删除记录"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const detailSortLabel = detailSort === 'newest' ? '最新' : '最早';

  const handleDeleteDetail = async (id: number) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteDetail = async () => {
    if (pendingDeleteId !== null) {
      await deleteFromDB(STORES.RECITE_DETAIL, pendingDeleteId);
      setPendingDeleteId(null);
      setDeleteConfirmOpen(false);
      // 重新加载数据：关闭再打开弹窗
      onOpenChange(false);
      setTimeout(() => onOpenChange(true), 100);
    }
  };

  function resetFilters() {
    setSelectedUser('all');
    setSearchKeyword('');
    setSelectedDynasty('all');
    setDateFrom('');
    setDateTo('');
    setDetailSort('newest');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[85vh] flex flex-col min-h-[70vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-semibold text-slate-700 dark:text-slate-100"
            data-testid="recite-records-header">
            背诵记录
          </DialogTitle>
        </DialogHeader>
        <div className="border-b border-gray-200 dark:border-gray-700" />
        <ScrollArea className="h-120 max-h-[70vh]">
          <div className="space-y-2">
            {!loading && stats.totalCount > 0 && (
              <div className="flex flex-wrap gap-4 px-4 py-3 bg-muted/30 rounded-lg mb-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">背诵明细</span>
                  <span className="font-semibold">{stats.totalCount}</span>
                  <span className="text-muted-foreground">首</span>
                </div>
                {stats.totalCount > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CircleCheck className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">
                        {stats.passCount}
                      </span>
                      <span className="text-muted-foreground">掌握</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CircleX className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-red-600">
                        {stats.unpassCount}
                      </span>
                      <span className="text-muted-foreground">未掌握</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm ml-auto">
                      <span className="text-muted-foreground">掌握率</span>
                      <span
                        className={`font-semibold ${stats.passRate >= 70 ? "text-green-600" : stats.passRate >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                        {stats.passRate}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            <div
              className="flex flex-wrap items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 overflow-x-auto"
              data-testid="recite-records-filter-bar">
              <input
                type="text"
                aria-label="搜索诗词/诗人"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm bg-background shrink-0"
                placeholder="搜索诗词/诗人"
              />
              <Select
                value={selectedUser}
                onValueChange={(v) => v !== null && setSelectedUser(v)}>
                <SelectTrigger className="w-28 md:w-32 shrink-0">
                  <SelectValue>
                    {selectedUser === "all"
                      ? "全部用户"
                      : users.find((u) => u.id.toString() === selectedUser)
                          ?.user_name || selectedUser}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用户</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDynasty}
                onValueChange={(v) => setSelectedDynasty(v ?? "all")}>
                <SelectTrigger className="w-24 md:w-28 shrink-0">
                  <SelectValue>
                    {selectedDynasty === "all" ? "全部朝代" : selectedDynasty}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部朝代</SelectItem>
                  {DynastyArr.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RangeCalendarSelect
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
              />
              <Button
                variant="default"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={resetFilters}>
                <RotateCcw className="h-3 w-3 mr-1" />
                重置
              </Button>
            </div>
            <div className="p-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">排序</span>
                <Select
                  value={detailSort}
                  onValueChange={(v) => v && setDetailSort(v)}>
                  <SelectTrigger className="w-24 text-xs shrink-0">
                    <SelectValue>{detailSortLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新</SelectItem>
                    <SelectItem value="oldest">最早</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto flex gap-2">
                  <Select defaultValue="json" onValueChange={(v) => {
                    if (v === 'json') exportReciteRecordsJson();
                    else exportReciteRecordsExcel();
                  }}>
                    <SelectTrigger className="w-28 text-xs shrink-0">
                      <SelectValue placeholder="导出格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="excel">Excel (CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                    data-testid="recite-records-clear"
                    onClick={() => setClearConfirmOpen(true)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    清空
                  </Button>
                </div>
              </div>
              {loading && (
                <div className="text-center text-muted-foreground py-8">
                  加载中...
                </div>
              )}
              {!loading &&
                todayDetails.length === 0 &&
                historyDetails.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    暂无背诵明细
                  </div>
                )}
              {!loading && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {todayDetails.slice(0, todayPage).map((d) => (
                      <DetailCard key={d.id} item={d} />
                    ))}
                  </div>
                  {todayDetails.length > todayPage && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="default"
                        size="default"
                        className="cursor-pointer px-5"
                        data-testid="recite-records-load-more-today"
                        onClick={() => setTodayPage((p) => p + 9)}>
                        查看更多
                      </Button>
                    </div>
                  )}
                </>
              )}
              {historyDetails.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-sm mb-2">历史背诵</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {historyDetails.slice(0, historyPage).map((d) => (
                      <DetailCard key={d.id} item={d} />
                    ))}
                  </div>
                  {historyDetails.length > historyPage && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="default"
                        size="default"
                        className="px-5 cursor-pointer"
                        data-testid="recite-records-load-more-history"
                        onClick={() => setHistoryPage((p) => p + 9)}>
                        查看更多
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认清空</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            确定要清空所有背诵记录吗？此操作不可恢复。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setClearConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await clearReciteRecords();
                setClearConfirmOpen(false);
                onOpenChange(false);
                setTimeout(() => onOpenChange(true), 0);
              }}>
              确认清空
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条背诵记录吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteDetail}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
