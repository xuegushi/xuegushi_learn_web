"use client";
import React, { useState, useMemo, useEffect } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSquare, Clock, CircleCheck, CircleX, BookOpen, BarChart3, ChevronDown, ChevronUp, Calendar as CalendarIcon, RotateCcw, Download, Trash2 } from "lucide-react";
import { exportReciteRecordsJson, clearReciteRecords } from "@/lib/db";
import { useReciteRecords } from "@/hooks/use-recite-records";
import { DynastyArr } from "@/config/poem";

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
      <PopoverTrigger>
        <Button variant="outline" size="sm" className="w-56 md:w-64 text-xs justify-start font-normal">
          <CalendarIcon className="mr-1 h-3 w-3" />
          {dateFrom || dateTo
            ? `${formatDateDisplay(dateFrom)}${dateTo ? ` - ${formatDateDisplay(dateTo)}` : ""}`
            : "选择日期区间"}
        </Button>
      </PopoverTrigger>
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

export interface ReciteSummary {
  id?: number;
  user_id: string;
  user_name: string;
  poem_ids: { poem_id: string; title: string; status: boolean }[];
  pass_count: number;
  unpass_count: number;
  skip_count: number;
  createdAt: string;
}

export interface ReciteRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReciteRecordsDialog({ open, onOpenChange }: ReciteRecordsDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedDynasty, setSelectedDynasty] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [detailSort, setDetailSort] = useState<string>("newest");
  const [summarySort, setSummarySort] = useState<string>("newest");
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const filters = useMemo(() => ({ selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort, summarySort }), [selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort, summarySort]);
  const { loading, users, todayDetails, historyDetails, summaries, stats, todayPage, historyPage, summaryPage, setTodayPage, setHistoryPage, setSummaryPage } = useReciteRecords(open, filters);

  useEffect(() => {
    if (open && users.length > 0) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.user_id && users.some(u => u.id === user.user_id)) {
            setSelectedUser(user.user_id.toString());
          }
        } catch { /* ignore */ }
      }
    }
  }, [open, users]);

  function DetailCard({ item }: { item: ReciteDetail }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (
      <div className="p-3 border rounded-lg bg-white relative">
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
      </div>
    );
  }

  function SummaryCard({ item }: { item: ReciteSummary }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const isExpanded = expandedSummaries.has(item.id || 0);

    return (
      <div className="p-3 border rounded-lg bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="text-red-600 font-semibold">{item.unpass_count}</span> 未掌握
            <span className="mx-2">|</span>
            <span className="text-green-600 font-bold text-base">{item.pass_count}</span> 掌握
            <span className="mx-2">|</span>
            <span className="text-gray-500 font-semibold">{item.skip_count}</span> 跳过
          </div>
          {item.poem_ids.length > 0 && (
            <button
              className="text-sm text-blue-600 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
              onClick={() => {
                const id = item.id || 0;
                setExpandedSummaries(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {item.poem_ids.length}首
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <UserSquare className="h-3 w-3" />
          {item.user_name}
          <Clock className="h-3 w-3 ml-2" />
          {dateStr}
        </div>
        {isExpanded && item.poem_ids.length > 0 && (
          <div className="mt-2 pt-2 border-t grid grid-cols-3 gap-1">
            {item.poem_ids.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                {p.status ? (
                  <CircleCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <CircleX className="h-3 w-3 text-red-500 flex-shrink-0" />
                )}
                <span className={p.status ? 'text-green-700 truncate' : 'text-red-700 truncate'}>{p.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const detailSortLabel = detailSort === 'newest' ? '最新' : '最早';
  const summarySortLabel = summarySort === 'newest' ? '最新' : summarySort === 'oldest' ? '最早' : '掌握率';

  function resetFilters() {
    setSelectedUser('all');
    setSearchKeyword('');
    setSelectedDynasty('all');
    setDateFrom('');
    setDateTo('');
    setDetailSort('newest');
    setSummarySort('newest');
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
          {!loading && (stats.totalCount > 0 || stats.summaryCount > 0) && (
            <div className="flex flex-wrap gap-4 px-4 py-3 bg-muted/30 rounded-lg mb-2">
              <div className="flex items-center gap-1.5 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">背诵明细</span>
                <span className="font-semibold">{stats.totalCount}</span>
                <span className="text-muted-foreground">首</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">背诵汇总</span>
                <span className="font-semibold">{stats.summaryCount}</span>
                <span className="text-muted-foreground">次</span>
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
          <Tabs defaultValue="detail" data-testid="recite-records-tabs">
            <TabsList
              className="grid w-full grid-cols-2"
              data-testid="recite-records-tablist">
              <TabsTrigger
                value="detail"
                data-testid="recite-records-detail-tab">
                背诵明细
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                data-testid="recite-records-summary-tab">
                背诵汇总
              </TabsTrigger>
            </TabsList>
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
            <TabsContent value="detail" className="p-0">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 cursor-pointer"
                    data-testid="recite-records-export"
                    onClick={() => exportReciteRecordsJson()}>
                    <Download className="h-3 w-3 mr-1" />
                    导出
                  </Button>
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
                  <div className="grid grid-cols-3 gap-2">
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
                  <div className="grid grid-cols-3 gap-2">
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
            </TabsContent>
            <TabsContent value="summary" className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">排序</span>
                <Select
                  value={summarySort}
                  onValueChange={(v) => v && setSummarySort(v)}>
                  <SelectTrigger className="w-24 text-xs shrink-0">
                    <SelectValue>{summarySortLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新</SelectItem>
                    <SelectItem value="oldest">最早</SelectItem>
                    <SelectItem value="pass-rate">掌握率</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 cursor-pointer"
                    onClick={() => exportReciteRecordsJson()}>
                    <Download className="h-3 w-3 mr-1" />
                    导出
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
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
              {!loading && summaries.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  暂无背诵汇总
                </div>
              )}
              {!loading && (
                <div className="grid grid-cols-2 gap-2">
                  {summaries.slice(0, summaryPage).map((s) => (
                    <SummaryCard key={s.id} item={s} />
                  ))}
                </div>
              )}
              {summaries.length > summaryPage && (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="default"
                    size="default"
                    className="px-5 cursor-pointer"
                    data-testid="recite-records-load-more-summaries"
                    onClick={() => setSummaryPage((p) => p + 9)}>
                    查看更多
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
    </Dialog>
  );
}
