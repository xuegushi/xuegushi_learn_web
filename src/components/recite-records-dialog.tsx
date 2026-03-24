"use client";
import React, { useState, useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynastySelect } from "@/components/ui/dynasty-select";
import { UserSquare, Clock, CircleCheck, CircleX, BookOpen, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { getAllFromDB, STORES, exportReciteRecordsJson, clearReciteRecords } from "@/lib/db";

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
  // UI skeleton states (Patch 4A)
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedDynasty, setSelectedDynasty] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());
  const [users, setUsers] = useState<DBUser[]>([]);

  // Data sources (loaded from IndexedDB)
  const [loading, setLoading] = useState(false);
  const [todayDetails, setTodayDetails] = useState<ReciteDetail[]>([]);
  const [historyDetails, setHistoryDetails] = useState<ReciteDetail[]>([]);
  const [summaries, setSummaries] = useState<ReciteSummary[]>([]);
  const [todayPage, setTodayPage] = useState<number>(5);
  const [historyPage, setHistoryPage] = useState<number>(5);
  const [summaryPage, setSummaryPage] = useState<number>(5);
  const [detailSort, setDetailSort] = useState<string>("newest");
  const [summarySort, setSummarySort] = useState<string>("newest");

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

  // 审美布局：Tabs 顶部、筛选区在其下、内容区在 ScrollArea 中

  // Load users list
  React.useEffect(() => {
    (async () => {
      const userList = await getAllFromDB<DBUser>(STORES.USERS);
      setUsers(userList);
    })();
  }, []);

  // Data binding: load data when dialog opens or filters change
  React.useEffect(() => {
    if (open) {
      setTodayPage(5);
      setHistoryPage(5);
      setSummaryPage(5);
      setLoading(true);
      (async () => {
        try {
          const details = await getAllFromDB<ReciteDetail>(STORES.RECITE_DETAIL);
          let data = details;
          if (selectedUser !== 'all') data = data.filter((d) => d.user_id === selectedUser);
          if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            data = data.filter((d) => `${d.title} ${d.author} ${d.dynasty}`.toLowerCase().includes(kw));
          }
          if (selectedDynasty !== 'all') data = data.filter((d) => d.dynasty === selectedDynasty);
          if (dateFrom) data = data.filter((d) => d.createdAt >= dateFrom);
          if (dateTo) data = data.filter((d) => d.createdAt <= dateTo + 'T23:59:59.999Z');
          const now = new Date();
          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          let today = data.filter((d) => d.createdAt.startsWith(todayKey));
          let hist = data.filter((d) => !d.createdAt.startsWith(todayKey));
          if (detailSort === 'newest') {
            today.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            hist.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          } else if (detailSort === 'oldest') {
            today.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            hist.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          }
          setTodayDetails(today);
          setHistoryDetails(hist);
          const sums = await getAllFromDB<ReciteSummary>(STORES.RECITE_SUMMARY);
          let filteredSums = sums;
          if (selectedUser !== 'all') filteredSums = filteredSums.filter((s) => s.user_id === selectedUser);
          if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            filteredSums = filteredSums.filter((s) =>
              s.poem_ids.some((p) => p.title.toLowerCase().includes(kw))
            );
          }
          if (dateFrom) filteredSums = filteredSums.filter((s) => s.createdAt >= dateFrom);
          if (dateTo) filteredSums = filteredSums.filter((s) => s.createdAt <= dateTo + 'T23:59:59.999Z');
          if (summarySort === 'newest') {
            filteredSums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          } else if (summarySort === 'oldest') {
            filteredSums.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          } else if (summarySort === 'pass-rate') {
            filteredSums.sort((a, b) => {
              const aTotal = a.pass_count + a.unpass_count;
              const bTotal = b.pass_count + b.unpass_count;
              const aRate = aTotal > 0 ? a.pass_count / aTotal : 0;
              const bRate = bTotal > 0 ? b.pass_count / bTotal : 0;
              return bRate - aRate;
            });
          }
          setSummaries(filteredSums);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, selectedUser, searchKeyword, selectedDynasty, dateFrom, dateTo, detailSort, summarySort]);

  // Compute statistics
  const stats = useMemo(() => {
    const allDetails = [...todayDetails, ...historyDetails];
    const totalCount = allDetails.length;
    const passCount = allDetails.filter(d => d.status).length;
    const unpassCount = totalCount - passCount;
    const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
    const summaryCount = summaries.length;
    const totalSummaryPoems = summaries.reduce((acc, s) => acc + s.poem_ids.length, 0);
    return { totalCount, passCount, unpassCount, passRate, summaryCount, totalSummaryPoems };
  }, [todayDetails, historyDetails, summaries]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-700 dark:text-slate-100" data-testid="recite-records-header">背诵记录</DialogTitle>
        </DialogHeader>
        {/* Statistics overview */}
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
        <Tabs defaultValue="detail" className="flex-1 flex flex-col min-h-0" data-testid="recite-records-tabs">
          <TabsList className="grid w-full grid-cols-2" data-testid="recite-records-tablist">
            <TabsTrigger value="detail" data-testid="recite-records-detail-tab">背诵明细</TabsTrigger>
            <TabsTrigger value="summary" data-testid="recite-records-summary-tab">背诵汇总</TabsTrigger>
          </TabsList>
          {/* Filter area moved below Tabs header (Patch 4A) */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95" data-testid="recite-records-filter-bar">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">筛选</span>
              <DynastySelect value={selectedDynasty} onValueChange={setSelectedDynasty} />
              <Select value={selectedUser} onValueChange={(v) => v !== null && setSelectedUser(v)}>
                <SelectTrigger className="w-40 md:w-48 ml-2">
                  <SelectValue>{selectedUser === 'all' ? '全部用户' : users.find(u => u.id.toString() === selectedUser)?.user_name || selectedUser}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用户</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="text"
                aria-label="搜索诗词/诗人"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="ml-2 px-3 py-1.5 border rounded-md text-sm bg-background"
              />
              <input
                type="date"
                aria-label="开始日期"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="ml-2 px-2 py-1.5 border rounded-md text-sm bg-background"
              />
              <span className="text-xs text-muted-foreground">至</span>
              <input
                type="date"
                aria-label="结束日期"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">明细</span>
              <Select value={detailSort} onValueChange={(v) => v && setDetailSort(v)}>
                <SelectTrigger className="w-24 text-xs py-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新优先</SelectItem>
                  <SelectItem value="oldest">最早优先</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-2">汇总</span>
              <Select value={summarySort} onValueChange={(v) => v && setSummarySort(v)}>
                <SelectTrigger className="w-24 text-xs py-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新优先</SelectItem>
                  <SelectItem value="oldest">最早优先</SelectItem>
                  <SelectItem value="pass-rate">掌握率</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="ml-auto text-sm text-gray-600 hover:underline" onClick={() => {
              setSelectedUser('all');
              setSearchKeyword('');
              setSelectedDynasty('all');
              setDateFrom('');
              setDateTo('');
              setDetailSort('newest');
              setSummarySort('newest');
            }}>重置筛选</button>
            <button className="ml-2 text-sm text-green-600 hover:underline" data-testid="recite-records-export" onClick={async () => {
              await exportReciteRecordsJson();
            }}>导出</button>
            <button className="ml-2 text-sm text-red-600 hover:underline" data-testid="recite-records-clear" onClick={async () => {
              if (confirm('确定要清空所有背诵记录吗？此操作不可恢复。')) {
                await clearReciteRecords();
                setTodayDetails([]);
                setHistoryDetails([]);
                setSummaries([]);
              }
            }}>清空</button>
          </div>
          <ScrollArea className="flex-1" data-testid="recite-records-scrollarea">
            <div className="p-4 grid gap-4 grid-cols-1">
              <TabsContent value="detail" className="flex-1 mt-2">
                <div className="space-y-2">
                  {loading && <div className="text-center text-muted-foreground py-8">加载中...</div>}
                  {!loading && todayDetails.length === 0 && historyDetails.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">暂无背诵明细</div>
                  )}
                  {!loading && todayDetails.slice(0, todayPage).map((d) => (
                    <DetailCard key={d.id} item={d} />
                  ))}
                  {todayDetails.length > todayPage && (
                    <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-today" onClick={() => {
                      setTodayPage(p => p + 5);
                    }}>
                      查看更多
                    </button>
                  )}
                </div>
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
              <TabsContent value="summary" className="flex-1 mt-2">
                <div className="space-y-2">
                  {loading && <div className="text-center text-muted-foreground py-8">加载中...</div>}
                  {!loading && summaries.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">暂无背诵汇总</div>
                  )}
                  {!loading && summaries.slice(0, summaryPage).map((s) => (
                    <SummaryCard key={s.id} item={s} />
                  ))}
                </div>
                {summaries.length > summaryPage && (
                    <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-summaries" onClick={() => {
                    setSummaryPage(p => p + 5);
                  }}>
                    查看更多
                  </button>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
