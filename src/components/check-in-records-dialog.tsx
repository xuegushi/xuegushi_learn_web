"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynastyArr } from "@/config/poem";
import { getAllFromDB, STORES } from "@/lib/db";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface CheckInDetail {
  id: number;
  user_id: number;
  user_name: string;
  poem_id: number;
  poem_title: string;
  author: string;
  dynasty: string;
  check_in_time: string;
}

interface CheckInSummary {
  id: number;
  user_id: number;
  user_name: string;
  poem_id: number;
  poem_title: string;
  author: string;
  dynasty: string;
  count: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  user_name: string;
}

interface CheckInRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DetailSortKey = 'check_in_time';
type SummarySortKey = 'created_at' | 'updated_at' | 'count';

export function CheckInRecordsDialog({ open, onOpenChange }: CheckInRecordsDialogProps) {
  const [details, setDetails] = useState<CheckInDetail[]>([]);
  const [summaries, setSummaries] = useState<CheckInSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDynasty, setSelectedDynasty] = useState("不限");

  // Sort state
  const [detailSort, setDetailSort] = useState<{ key: DetailSortKey; direction: 'asc' | 'desc' }>({
    key: 'check_in_time',
    direction: 'desc'
  });
  const [summarySort, setSummarySort] = useState<{ key: SummarySortKey; direction: 'asc' | 'desc' }>({
    key: 'updated_at',
    direction: 'desc'
  });

  // Pagination state
  const [detailPage, setDetailPage] = useState(1);
  const [summaryPage, setSummaryPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [userList, detailList, summaryList] = await Promise.all([
      getAllFromDB<User>(STORES.USERS),
      getAllFromDB<CheckInDetail>(STORES.POEM_STUDY),
      getAllFromDB<CheckInSummary>(STORES.POEM_STUDY_SUMMARY),
    ]);

    const currentUserStr = localStorage.getItem("user");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (currentUser) {
      setSelectedUser(currentUser.user_id.toString());
    }

    // Enrich with user names
    const userMap = new Map(userList.map(u => [u.id, u.user_name]));
    const enrichedDetails = detailList.map(d => ({
      ...d,
      user_name: userMap.get(d.user_id) || ''
    }));
    const enrichedSummaries = summaryList.map(s => ({
      ...s,
      user_name: userMap.get(s.user_id) || ''
    }));

    setUsers(userList);
    setDetails(enrichedDetails);
    setSummaries(enrichedSummaries);
    setLoading(false);
  }, []);

  const dateCheckInCount = useMemo(() => {
    const countMap = new Map<string, number>();
    details.forEach(d => {
      const date = d.check_in_time.split('T')[0];
      countMap.set(date, (countMap.get(date) || 0) + 1);
    });
    return countMap;
  }, [details]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [open, loadData]);

  useEffect(() => {
    setDetailPage(1);
  }, [selectedUser, searchKeyword, selectedDynasty, detailSort]);

  useEffect(() => {
    setSummaryPage(1);
  }, [selectedUser, searchKeyword, selectedDynasty, summarySort]);

  // Filter details
  const filteredDetails = details.filter(d => {
    const matchUser = selectedUser === 'all' || d.user_id.toString() === selectedUser;
    const matchKeyword = !searchKeyword ||
      d.poem_title?.includes(searchKeyword) ||
      d.author?.includes(searchKeyword);
    const matchDynasty = selectedDynasty === '不限' || d.dynasty === selectedDynasty;
    return matchUser && matchKeyword && matchDynasty;
  });

  // Sort details
  const sortedDetails = [...filteredDetails].sort((a, b) => {
    const valueA = a[detailSort.key];
    const valueB = b[detailSort.key];
    if (!valueA) return 1;
    if (!valueB) return -1;
    return detailSort.direction === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // Filter summaries
  const filteredSummaries = summaries.filter(s => {
    const matchUser = selectedUser === 'all' || s.user_id.toString() === selectedUser;
    const matchKeyword = !searchKeyword ||
      s.poem_title?.includes(searchKeyword) ||
      s.author?.includes(searchKeyword);
    const matchDynasty = selectedDynasty === '不限' || s.dynasty === selectedDynasty;
    return matchUser && matchKeyword && matchDynasty;
  });

  // Sort summaries
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    const valueA = a[summarySort.key];
    const valueB = b[summarySort.key];
    if (valueA === undefined || valueA === null) return 1;
    if (valueB === undefined || valueB === null) return -1;
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return summarySort.direction === 'asc' ? valueA - valueB : valueB - valueA;
    }
    return summarySort.direction === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // Paginated data
  const paginatedDetails = sortedDetails.slice((detailPage - 1) * pageSize, detailPage * pageSize);
  const paginatedSummaries = sortedSummaries.slice((summaryPage - 1) * pageSize, summaryPage * pageSize);
  const detailTotalPages = Math.ceil(sortedDetails.length / pageSize) || 1;
  const summaryTotalPages = Math.ceil(sortedSummaries.length / pageSize) || 1;

  const toggleDetailSort = (key: DetailSortKey) => {
    setDetailSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleSummarySort = (key: SummarySortKey) => {
    setSummarySort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const renderSortIcon = (active: boolean, direction: 'asc' | 'desc') => {
    if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-[1400px] max-h-[85vh] flex flex-col p-0 !gap-0 sm:max-w-[1400px]">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>打卡记录</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">加载中...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-80 flex-shrink-0 px-6 py-3 overflow-y-auto border-r">
              <h3 className="font-medium mb-4">打卡日历</h3>
              <Calendar
                dateData={dateCheckInCount}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                className="border rounded-lg p-4"
              />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs defaultValue="detail" className="flex-1 flex flex-col overflow-hidden" onValueChange={() => { setDetailPage(1); setSummaryPage(1); }}>
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detail">打卡明细</TabsTrigger>
                <TabsTrigger value="summary">打卡汇总</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detail" className="flex-1 overflow-hidden flex flex-col px-6 mt-4 pb-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={selectedUser} onValueChange={(v) => v && setSelectedUser(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      {selectedUser === "all" ? "全部用户" : users.find(u => u.id.toString() === selectedUser)?.user_name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部用户</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.user_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <input
                  type="text"
                  placeholder="搜索诗词或诗人"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm bg-background w-40"
                />

                <Select value={selectedDynasty} onValueChange={(v) => v && setSelectedDynasty(v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue>{selectedDynasty}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DynastyArr.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">ID</th>
                      <th className="px-2 py-2 text-left">用户</th>
                      <th className="px-2 py-2 text-left">诗词标题</th>
                      <th className="px-2 py-2 text-left">诗人</th>
                      <th className="px-2 py-2 text-left cursor-pointer" onClick={() => toggleDetailSort('check_in_time')}>
                        <span className="flex items-center gap-1">
                          打卡时间
                          {renderSortIcon(detailSort.key === 'check_in_time', detailSort.direction)}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDetails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">暂无数据</td>
                      </tr>
                    ) : (
                      paginatedDetails.map(d => (
                        <tr key={d.id} className="border-b hover:bg-muted/30">
                          <td className="px-2 py-2">{d.id}</td>
                          <td className="px-2 py-2">{d.user_name}</td>
                          <td className="px-2 py-2">{d.poem_title}</td>
                          <td className="px-2 py-2">{d.author}「{d.dynasty}」</td>
                          <td className="px-2 py-2">{new Date(d.check_in_time).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>

              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-xs text-muted-foreground">
                  共 {sortedDetails.length} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailPage(p => Math.max(1, p - 1))}
                    disabled={detailPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs">
                    {detailPage} / {detailTotalPages}
                  </span>
                  <button
                    onClick={() => setDetailPage(p => Math.min(detailTotalPages, p + 1))}
                    disabled={detailPage === detailTotalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="flex-1 overflow-hidden flex flex-col px-6 mt-4 pb-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={selectedUser} onValueChange={(v) => v && setSelectedUser(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      {selectedUser === "all" ? "全部用户" : users.find(u => u.id.toString() === selectedUser)?.user_name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部用户</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.user_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <input
                  type="text"
                  placeholder="搜索诗词或诗人"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm bg-background w-40"
                />

                <Select value={selectedDynasty} onValueChange={(v) => v && setSelectedDynasty(v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue>{selectedDynasty}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DynastyArr.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">ID</th>
                      <th className="px-2 py-2 text-left">用户</th>
                      <th className="px-2 py-2 text-left">诗词标题</th>
                      <th className="px-2 py-2 text-left cursor-pointer" onClick={() => toggleSummarySort('count')}>
                        <span className="flex items-center gap-1">
                          打卡次数
                          {renderSortIcon(summarySort.key === 'count', summarySort.direction)}
                        </span>
                      </th>
                      <th className="px-2 py-2 text-left cursor-pointer" onClick={() => toggleSummarySort('created_at')}>
                        <span className="flex items-center gap-1">
                          初次打卡
                          {renderSortIcon(summarySort.key === 'created_at', summarySort.direction)}
                        </span>
                      </th>
                      <th className="px-2 py-2 text-left cursor-pointer" onClick={() => toggleSummarySort('updated_at')}>
                        <span className="flex items-center gap-1">
                          最后打卡
                          {renderSortIcon(summarySort.key === 'updated_at', summarySort.direction)}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">暂无数据</td>
                      </tr>
                    ) : (
                      paginatedSummaries.map(s => (
                        <tr key={s.id} className="border-b hover:bg-muted/30">
                          <td className="px-2 py-2">{s.id}</td>
                          <td className="px-2 py-2">{s.user_name}</td>
                          <td className="px-2 py-2">{s.poem_title}</td>
                          <td className="px-2 py-2">{s.count}</td>
                          <td className="px-2 py-2">{new Date(s.created_at).toLocaleString()}</td>
                          <td className="px-2 py-2">{new Date(s.updated_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>

              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-xs text-muted-foreground">
                  共 {sortedSummaries.length} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSummaryPage(p => Math.max(1, p - 1))}
                    disabled={summaryPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs">
                    {summaryPage} / {summaryTotalPages}
                  </span>
                  <button
                    onClick={() => setSummaryPage(p => Math.min(summaryTotalPages, p + 1))}
                    disabled={summaryPage === summaryTotalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </TabsContent>
            </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
