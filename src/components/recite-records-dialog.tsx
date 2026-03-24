"use client";
import React, { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynastySelect } from "@/components/ui/dynasty-select";
import { UserSquare, Clock } from "lucide-react";
import { getAllFromDB, STORES } from "@/lib/db";

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

  // Data sources (initial UI scaffolding with local state)
  const [todayDetails, setTodayDetails] = useState<ReciteDetail[]>([
    { id: 1, user_id: 'u1', poem_id: 'p1', title: '静夜思', author: '李白', dynasty: '唐', status: true, createdAt: new Date().toISOString() },
    { id: 2, user_id: 'u1', poem_id: 'p2', title: '静夜思 2', author: '李白', dynasty: '宋', status: true, createdAt: new Date().toISOString() },
    { id: 3, user_id: 'u1', poem_id: 'p3', title: '静夜思 3', author: '李白', dynasty: '唐', status: true, createdAt: new Date().toISOString() },
    { id: 4, user_id: 'u1', poem_id: 'p4', title: '静夜思 4', author: '李白', dynasty: '宋', status: true, createdAt: new Date().toISOString() },
    { id: 5, user_id: 'u1', poem_id: 'p5', title: '静夜思 5', author: '李白', dynasty: '唐', status: true, createdAt: new Date().toISOString() },
    { id: 6, user_id: 'u1', poem_id: 'p6', title: '静夜思 6', author: '李白', dynasty: '宋', status: true, createdAt: new Date().toISOString() },
  ]);
  const [historyDetails, setHistoryDetails] = useState<ReciteDetail[]>([
    { id: 2, user_id: 'u2', poem_id: 'p2', title: '登鹳雀楼', author: '王之', dynasty: '唐', status: false, createdAt: new Date().toISOString() },
  ]);
  const [summaries, setSummaries] = useState<ReciteSummary[]>([
    { id: 1, user_id: 'u1', poem_ids: [{ poem_id: 'p1', title: '静夜思', status: true }], pass_count: 1, unpass_count: 0, skip_count: 0, createdAt: new Date().toISOString() },
  ]);
  const [todayPage, setTodayPage] = useState<number>(5);
  const [historyPage, setHistoryPage] = useState<number>(5);
  const [summaryPage, setSummaryPage] = useState<number>(5);

  function DetailCard({ item }: { item: ReciteDetail }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (
      <div className="p-3 border rounded-lg bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">{item.title}</span>
          <span className="text-xs text-muted-foreground">{item.dynasty} · {item.author}</span>
        </div>
        <div className="text-xs text-muted-foreground">{dateStr}</div>
        <div className="mt-1 text-xs">状态: {item.status ? '已掌握' : '未掌握'}</div>
      </div>
    );
  }

  function SummaryCard({ item }: { item: ReciteSummary }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return (
      <div className="p-3 border rounded-lg bg-white">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>背诵汇总</span>
        </div>
        <div className="text-xs text-muted-foreground">未掌握: {item.unpass_count}  掌握: {item.pass_count}  跳过: {item.skip_count}</div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <UserSquare className="h-3 w-3" />
          当前用户
          <Clock className="h-3 w-3" />
          {dateStr}
        </div>
      </div>
    );
  }

  // 审美布局：Tabs 顶部、筛选区在其下、内容区在 ScrollArea 中

  // Data binding: load data when dialog opens (Patch 4B groundwork)
  React.useEffect(() => {
    if (open) {
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
          const now = new Date();
          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const today = data.filter((d) => d.createdAt.startsWith(todayKey));
          const hist = data.filter((d) => !d.createdAt.startsWith(todayKey));
          setTodayDetails(today);
          setHistoryDetails(hist);
          const sums = await getAllFromDB<ReciteSummary>(STORES.RECITE_SUMMARY);
          let filteredSums = sums;
          if (selectedUser !== 'all') filteredSums = sums.filter((s) => s.user_id === selectedUser);
          setSummaries(filteredSums);
        } catch {
          // ignore
        }
      })();
    }
  }, [open, selectedUser, searchKeyword, selectedDynasty]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-700 dark:text-slate-100" data-testid="recite-records-header">背诵记录</DialogTitle>
        </DialogHeader>
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
                  <SelectValue>{selectedUser === 'all' ? '全部用户' : selectedUser}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用户</SelectItem>
                  <SelectItem value="u1">用户1</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                aria-label="搜索诗词/诗人"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="ml-2 px-3 py-1.5 border rounded-md text-sm bg-background"
              />
            </div>
            <button className="ml-auto text-sm text-gray-600 hover:underline" onClick={() => {
              setSelectedUser('all');
              setSearchKeyword('');
              setSelectedDynasty('all');
            }}>重置筛选</button>
          </div>
          <ScrollArea className="flex-1" data-testid="recite-records-scrollarea">
            <div className="p-4 grid gap-4 grid-cols-1">
              <TabsContent value="detail" className="flex-1 mt-2">
                <div className="space-y-2">
                  {todayDetails.slice(0, todayPage).map((d) => (
                    <DetailCard key={d.id} item={d} />
                  ))}
                  {todayDetails.length > todayPage && (
                    <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-today" onClick={async () => {
                      const details = await getAllFromDB<ReciteDetail>(STORES.RECITE_DETAIL);
                      let data = details;
                      if (selectedUser !== 'all') data = data.filter((d) => d.user_id === selectedUser);
                      if (searchKeyword.trim()) {
                        const kw = searchKeyword.toLowerCase();
                        data = data.filter((d) => `${d.title} ${d.author} ${d.dynasty}`.toLowerCase().includes(kw));
                      }
                      if (selectedDynasty !== 'all') data = data.filter((d) => d.dynasty === selectedDynasty);
                      const now = new Date();
                      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      const todayFiltered = data.filter((d) => d.createdAt.startsWith(todayKey));
                      const hist = data.filter((d) => !d.createdAt.startsWith(todayKey));
                      const current = todayDetails.length;
                      const nextSlice = todayFiltered.slice(current, current + 5);
                      if (nextSlice.length > 0) {
                        setTodayDetails([...todayDetails, ...nextSlice]);
                        setTodayPage(current + nextSlice.length);
                      }
                      setHistoryDetails(hist);
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
                  {summaries.slice(0, summaryPage).map((s) => (
                    <SummaryCard key={s.id} item={s} />
                  ))}
                </div>
                {summaries.length > summaryPage && (
                    <button className="mt-2 text-sm text-blue-600 hover:underline" data-testid="recite-records-load-more-summaries" onClick={async () => {
                    const sums = await getAllFromDB<ReciteSummary>(STORES.RECITE_SUMMARY);
                    const current = summaries.length;
                    const nextSlice = sums.slice(current, current + 5);
                    if (nextSlice.length > 0) {
                      setSummaries([...summaries, ...nextSlice]);
                      setSummaryPage(current + nextSlice.length);
                    } else {
                      // no more data
                    }
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
