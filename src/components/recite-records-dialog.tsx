"use client";
import React, { useState, useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynastySelect } from "@/components/ui/dynasty-select";
import { UserSquare, Clock, CircleCheck, CircleX, BookOpen, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { exportReciteRecordsJson, clearReciteRecords } from "@/lib/db";
import { useReciteRecords } from "@/hooks/use-recite-records";

export interface DBUser {
  id: number;
  user_name: string;
}

export interface ReciteDetail {
  id?: number;
  user_id: string;
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

  const filters = useMemo(() => ({ selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort, summarySort }), [selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort, summarySort]);
  const { loading, users, todayDetails, historyDetails, summaries, stats, todayPage, historyPage, summaryPage, setTodayPage, setHistoryPage, setSummaryPage } = useReciteRecords(open, filters);

  function DetailCard({ item }: { item: ReciteDetail }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const userName = users.find(u => u.id.toString() === item.user_id)?.user_name || item.user_id;
    return (
      <div className="p-3 border rounded-lg bg-white relative">
        <div className="flex items-center justify-between mb-1 pr-8">
          <span className="text-sm font-semibold">{item.title}</span>
          <span className="text-xs text-muted-foreground">{item.dynasty} · {item.author}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <UserSquare className="h-3 w-3" />
          {userName}
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
    const userName = users.find(u => u.id.toString() === item.user_id)?.user_name || item.user_id;
    const isExpanded = expandedSummaries.has(item.id || 0);

    return (
      <div className="p-3 border rounded-lg bg-white">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            未掌握：{item.unpass_count} &nbsp; 掌握：{item.pass_count} &nbsp; 跳过：{item.skip_count}
          </div>
          {item.poem_ids.length > 0 && (
            <button
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {item.poem_ids.length}首
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <UserSquare className="h-3 w-3" />
          {userName}
          <Clock className="h-3 w-3 ml-2" />
          {dateStr}
        </div>
        {isExpanded && item.poem_ids.length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1">
            {item.poem_ids.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {p.status ? (
                  <CircleCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <CircleX className="h-3 w-3 text-red-500 flex-shrink-0" />
                )}
                <span className={p.status ? 'text-green-700' : 'text-red-700'}>{p.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-700 dark:text-slate-100" data-testid="recite-records-header">背诵记录</DialogTitle>
        </DialogHeader>
        <div className="border-b border-gray-200 dark:border-gray-700" />
        <div className="flex-1 min-h-0 overflow-y-auto">
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
                    <span className="font-semibold text-green-600">{stats.passCount}</span>
                    <span className="text-muted-foreground">掌握</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CircleX className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-600">{stats.unpassCount}</span>
                    <span className="text-muted-foreground">未掌握</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm ml-auto">
                    <span className="text-muted-foreground">掌握率</span>
                    <span className={`font-semibold ${stats.passRate >= 70 ? 'text-green-600' : stats.passRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.passRate}%
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          <Tabs defaultValue="detail" data-testid="recite-records-tabs">
            <TabsList className="grid w-full grid-cols-2" data-testid="recite-records-tablist">
              <TabsTrigger value="detail" data-testid="recite-records-detail-tab">背诵明细</TabsTrigger>
              <TabsTrigger value="summary" data-testid="recite-records-summary-tab">背诵汇总</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 overflow-x-auto" data-testid="recite-records-filter-bar">
              <input
                type="text"
                aria-label="搜索诗词/诗人"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm bg-background shrink-0"
                placeholder="搜索诗词/诗人"
              />
              <Select value={selectedUser} onValueChange={(v) => v !== null && setSelectedUser(v)}>
                <SelectTrigger className="w-40 md:w-48 shrink-0">
                  <SelectValue>{selectedUser === 'all' ? '全部用户' : users.find(u => u.id.toString() === selectedUser)?.user_name || selectedUser}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用户</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DynastySelect value={selectedDynasty} onValueChange={setSelectedDynasty} />
              <input
                type="date"
                aria-label="开始日期"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-sm bg-background shrink-0"
              />
              <span className="text-xs text-muted-foreground shrink-0">至</span>
              <input
                type="date"
                aria-label="结束日期"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-sm bg-background shrink-0"
              />
              <button className="ml-auto text-sm text-gray-600 hover:underline shrink-0" onClick={resetFilters}>重置</button>
              <button className="text-sm text-green-600 hover:underline shrink-0" data-testid="recite-records-export" onClick={() => exportReciteRecordsJson()}>导出</button>
              <button className="text-sm text-red-600 hover:underline shrink-0" data-testid="recite-records-clear" onClick={async () => {
                if (confirm('确定要清空所有背诵记录吗？此操作不可恢复。')) {
                  await clearReciteRecords();
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 0);
                }
              }}>清空</button>
            </div>
            <TabsContent value="detail" className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">排序</span>
                <Select value={detailSort} onValueChange={(v) => v && setDetailSort(v)}>
                  <SelectTrigger className="w-24 text-xs shrink-0">
                    <SelectValue placeholder="最新" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新</SelectItem>
                    <SelectItem value="oldest">最早</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading && <div className="text-center text-muted-foreground py-8">加载中...</div>}
              {!loading && todayDetails.length === 0 && historyDetails.length === 0 && (
                <div className="text-center text-muted-foreground py-8">暂无背诵明细</div>
              )}
              {!loading && todayDetails.slice(0, todayPage).map((d) => (
                <DetailCard key={d.id} item={d} />
              ))}
              {todayDetails.length > todayPage && (
                <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-today" onClick={() => setTodayPage(p => p + 5)}>
                  查看更多
                </button>
              )}
              {historyDetails.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-sm mb-2">历史背诵</div>
                  <div className="space-y-2">
                    {historyDetails.slice(0, historyPage).map((d) => (
                      <DetailCard key={d.id} item={d} />
                    ))}
                  </div>
                  {historyDetails.length > historyPage && (
                    <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-history" onClick={() => setHistoryPage(p => p + 5)}>查看更多</button>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="summary" className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">排序</span>
                <Select value={summarySort} onValueChange={(v) => v && setSummarySort(v)}>
                  <SelectTrigger className="w-24 text-xs shrink-0">
                    <SelectValue placeholder="最新" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新</SelectItem>
                    <SelectItem value="oldest">最早</SelectItem>
                    <SelectItem value="pass-rate">掌握率</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading && <div className="text-center text-muted-foreground py-8">加载中...</div>}
              {!loading && summaries.length === 0 && (
                <div className="text-center text-muted-foreground py-8">暂无背诵汇总</div>
              )}
              {!loading && summaries.slice(0, summaryPage).map((s) => (
                <SummaryCard key={s.id} item={s} />
              ))}
              {summaries.length > summaryPage && (
                <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-summaries" onClick={() => setSummaryPage(p => p + 5)}>
                  查看更多
                </button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
