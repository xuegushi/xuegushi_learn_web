"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynastyArr } from "@/config/poem";
import { getAllFromDB, STORES } from "@/lib/db";
import { SquareUser, Clock, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

/** 日历面板组件 */
function CalendarPanel({
  dateCheckInCount,
  selectedDate,
  onSelect,
}: {
  dateCheckInCount: Map<string, number>;
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="px-4 py-3">
      <Calendar
        dateData={dateCheckInCount}
        selectedDate={selectedDate}
        onSelect={onSelect}
        className="border rounded-lg p-4 mx-auto"
      />
    </div>
  );
}

/** 打卡明细数据类型 */
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

/** 打卡汇总数据类型 */
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

/** 用户数据类型 */
interface User {
  id: number;
  user_name: string;
}

/** 打卡记录弹窗属性 */
interface CheckInRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 筛选栏组件 */
function FilterBar({
  users,
  selectedUser,
  onUserChange,
  searchKeyword,
  onSearchChange,
  selectedDynasty,
  onDynastyChange,
}: {
  users: User[];
  selectedUser: string;
  onUserChange: (value: string) => void;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  selectedDynasty: string;
  onDynastyChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Select value={selectedUser} onValueChange={(v) => v && onUserChange(v)}>
        <SelectTrigger className="w-32">
          <SelectValue>
            {selectedUser === "all"
              ? "全部用户"
              : users.find((u) => u.id.toString() === selectedUser)?.user_name}
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

      <input
        type="text"
        placeholder="搜索诗词或诗人"
        value={searchKeyword}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 border rounded-md text-sm bg-background w-40"
      />

      <Select
        value={selectedDynasty}
        onValueChange={(v) => v && onDynastyChange(v)}>
        <SelectTrigger className="w-28">
          <SelectValue>{selectedDynasty}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DynastyArr.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** 汇总筛选栏组件（含打卡次数排序） */
function SummaryFilterBar({
  users,
  selectedUser,
  onUserChange,
  searchKeyword,
  onSearchChange,
  selectedDynasty,
  onDynastyChange,
  countSort,
  onCountSortChange,
}: {
  users: User[];
  selectedUser: string;
  onUserChange: (value: string) => void;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  selectedDynasty: string;
  onDynastyChange: (value: string) => void;
  countSort: string;
  onCountSortChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <Select value={selectedUser} onValueChange={(v) => v && onUserChange(v)}>
        <SelectTrigger className="w-32">
          <SelectValue>
            {selectedUser === "all"
              ? "全部用户"
              : users.find((u) => u.id.toString() === selectedUser)?.user_name}
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

      <input
        type="text"
        placeholder="搜索诗词或诗人"
        value={searchKeyword}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 border rounded-md text-sm bg-background w-40"
      />

      <Select
        value={selectedDynasty}
        onValueChange={(v) => v && onDynastyChange(v)}>
        <SelectTrigger className="w-28">
          <SelectValue>{selectedDynasty}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DynastyArr.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={countSort} onValueChange={onCountSortChange}>
        <SelectTrigger className="w-32">
          <SelectValue>
            {countSort === "default" ? "默认排序" : countSort === "asc" ? "打卡次数升序" : "打卡次数降序"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">默认排序</SelectItem>
          <SelectItem value="asc">打卡次数升序</SelectItem>
          <SelectItem value="desc">打卡次数降序</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/** 打卡明细卡片 */
function DetailCard({ data }: { data: CheckInDetail[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((d) => (
        <div
          key={d.id}
          className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors relative"
        >
          <CheckCheck className="absolute top-2 right-2 h-5 w-5 text-blue-500" />
          <h4 className="font-medium text-sm mb-1 truncate pr-6" title={d.poem_title}>
            {d.poem_title}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {d.dynasty}·{d.author}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <SquareUser className="h-3.5 w-3.5" />
              <span>{d.user_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDateTime(d.check_in_time)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 打卡汇总卡片 */
function SummaryCard({ data }: { data: CheckInSummary[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((s) => (
        <div
          key={s.id}
          className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors relative"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-base truncate flex-1 mr-2" title={s.poem_title}>
              {s.poem_title}
            </h4>
            <Badge className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 font-bold text-lg">
              {s.count}
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs relative pr-6">
            <CheckCheck className="absolute bottom-0 right-0 h-5 w-5 text-blue-500" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <SquareUser className="h-3.5 w-3.5" />
              <span>{s.user_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>初次：{formatDateTime(s.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>最近：{formatDateTime(s.updated_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 打卡记录弹窗主组件 */
export function CheckInRecordsDialog({
  open,
  onOpenChange,
}: CheckInRecordsDialogProps) {
  const [details, setDetails] = useState<CheckInDetail[]>([]);
  const [summaries, setSummaries] = useState<CheckInSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 筛选状态
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDynasty, setSelectedDynasty] = useState("不限");
  const [countSort, setCountSort] = useState("default");

  // 显示数量状态（用于"查看更多"功能）
  const [detailMoreCount, setDetailMoreCount] = useState(0);
  const [summaryMoreCount, setSummaryMoreCount] = useState(0);

  // 每次加载数量
  const detailPageSize = 9;
  const summaryPageSize = 12;

  // 日历选中日期
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // 获取当前用户ID
  const currentUserId = useMemo(() => {
    const currentUserStr = localStorage.getItem("user");
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      return currentUser.user_id;
    }
    return null;
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    const [userList, detailList, summaryList] = await Promise.all([
      getAllFromDB<User>(STORES.USERS),
      getAllFromDB<CheckInDetail>(STORES.POEM_STUDY),
      getAllFromDB<CheckInSummary>(STORES.POEM_STUDY_SUMMARY),
    ]);

    // 设置默认选中当前用户
    const currentUserStr = localStorage.getItem("user");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (currentUser) {
      setSelectedUser(currentUser.user_id.toString());
    }

    // 关联用户名称
    const userMap = new Map(userList.map((u) => [u.id, u.user_name]));
    const enrichedDetails = detailList.map((d) => ({
      ...d,
      user_name: userMap.get(d.user_id) || "",
    }));
    const enrichedSummaries = summaryList.map((s) => ({
      ...s,
      user_name: userMap.get(s.user_id) || "",
    }));

    setUsers(userList);
    setDetails(enrichedDetails);
    setSummaries(enrichedSummaries);
    setLoading(false);
  }, []);

  // 计算每天打卡数量（用于日历显示）
  const dateCheckInCount = useMemo(() => {
    const countMap = new Map<string, number>();
    details.forEach((d) => {
      if (!d.check_in_time) return;
      const dateObj = new Date(d.check_in_time);
      const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
      countMap.set(date, (countMap.get(date) || 0) + 1);
    });
    return countMap;
  }, [details]);

  // 弹窗打开时加载数据
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
      setDetailMoreCount(0);
      setSummaryMoreCount(0);
    }
  }, [open, loadData]);

  // 筛选条件变化时重置显示数量
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailMoreCount(0);
  }, [selectedUser, searchKeyword, selectedDynasty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummaryMoreCount(0);
  }, [selectedUser, searchKeyword, selectedDynasty, countSort]);

  // 今日打卡数据（当前用户）
  const todayCheckIns = useMemo(() => {
    if (!currentUserId) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return details.filter((d) => {
      if (d.user_id !== currentUserId) return false;
      const checkDate = new Date(d.check_in_time);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() >= today.getTime() && checkDate.getTime() < tomorrow.getTime();
    });
  }, [details, currentUserId]);

  // 筛选明细数据（排除今日）
  const filteredDetails = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return details.filter((d) => {
      const checkDate = new Date(d.check_in_time);
      checkDate.setHours(0, 0, 0, 0);
      const isToday = checkDate.getTime() === today.getTime();
      if (isToday) return false;

      const matchUser =
        selectedUser === "all" || d.user_id.toString() === selectedUser;
      const matchKeyword =
        !searchKeyword ||
        d.poem_title?.includes(searchKeyword) ||
        d.author?.includes(searchKeyword);
      const matchDynasty =
        selectedDynasty === "不限" || d.dynasty === selectedDynasty;
      return matchUser && matchKeyword && matchDynasty;
    });
  }, [details, selectedUser, searchKeyword, selectedDynasty]);

  // 筛选汇总数据（整合今日和历史）
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      const matchUser =
        selectedUser === "all" || s.user_id.toString() === selectedUser;
      const matchKeyword =
        !searchKeyword ||
        s.poem_title?.includes(searchKeyword) ||
        s.author?.includes(searchKeyword);
      const matchDynasty =
        selectedDynasty === "不限" || s.dynasty === selectedDynasty;
      return matchUser && matchKeyword && matchDynasty;
    });
  }, [summaries, selectedUser, searchKeyword, selectedDynasty]);

  // 排序明细数据（按时间倒序）
  const sortedDetails = [...filteredDetails].sort((a, b) => {
    const valueA = a.check_in_time;
    const valueB = b.check_in_time;
    if (!valueA) return 1;
    if (!valueB) return -1;
    return String(valueB).localeCompare(String(valueA));
  });

  // 排序汇总数据
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    // 优先按打卡次数排序
    if (countSort === "asc") {
      return a.count - b.count;
    } else if (countSort === "desc") {
      return b.count - a.count;
    }
    // 默认按最近打卡时间倒序
    const valueA = a.updated_at;
    const valueB = b.updated_at;
    if (!valueA) return 1;
    if (!valueB) return -1;
    return String(valueB).localeCompare(String(valueA));
  });

  // 分页数据 - 更多打卡（排除今日，显示更多数量）
  const visibleDetailCount = detailPageSize + detailMoreCount * detailPageSize;
  const paginatedDetails = sortedDetails.slice(0, visibleDetailCount);
  const hasMoreDetails = sortedDetails.length > visibleDetailCount;

  // 分页数据 - 汇总（整合，显示更多数量）
  const visibleSummaryCount = summaryPageSize + summaryMoreCount * summaryPageSize;
  const paginatedSummaries = sortedSummaries.slice(0, visibleSummaryCount);
  const hasMoreSummaries = sortedSummaries.length > visibleSummaryCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-350 max-h-[90dvh] flex flex-col p-0 gap-0! sm:max-w-350 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>打卡记录</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">加载中...</div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
            {/* 移动端内容区域 */}
            <ScrollArea className="md:hidden h-[75vh] max-h-[calc(100%-50px)]">
              <CalendarPanel
                dateCheckInCount={dateCheckInCount}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />

              <div className="px-4 py-4">
                <Tabs defaultValue="detail" className="flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detail">打卡明细</TabsTrigger>
                    <TabsTrigger value="summary">打卡汇总</TabsTrigger>
                  </TabsList>

                  {/* 明细 */}
                  <TabsContent value="detail" className="flex flex-col mt-4">
                    <FilterBar
                      users={users}
                      selectedUser={selectedUser}
                      onUserChange={setSelectedUser}
                      searchKeyword={searchKeyword}
                      onSearchChange={setSearchKeyword}
                      selectedDynasty={selectedDynasty}
                      onDynastyChange={setSelectedDynasty}
                    />

                    {/* 今日打卡 - 不分页，全部展示 */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 text-primary">今日打卡</h3>
                      {todayCheckIns.length > 0 ? (
                        <DetailCard data={todayCheckIns} />
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          今天还没有打卡哦！「及时当勉励，岁月不待人」
                        </div>
                      )}
                    </div>

                    {/* 更多打卡 - 分页展示 */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">更多打卡</h3>
                      {paginatedDetails.length > 0 ? (
                        <>
                          <DetailCard data={paginatedDetails} />
                          {hasMoreDetails && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => setDetailMoreCount((prev) => prev + 1)}
                                className="px-6 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                查看更多
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          暂无数据
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 汇总 - 整合展示，不分今日和更多 */}
                  <TabsContent value="summary" className="flex flex-col mt-4">
                    <SummaryFilterBar
                      users={users}
                      selectedUser={selectedUser}
                      onUserChange={setSelectedUser}
                      searchKeyword={searchKeyword}
                      onSearchChange={setSearchKeyword}
                      selectedDynasty={selectedDynasty}
                      onDynastyChange={setSelectedDynasty}
                       countSort={countSort}
                      onCountSortChange={(value) => setCountSort(value ?? "default")}
                    />

                    {paginatedSummaries.length > 0 ? (
                      <>
                        <SummaryCard data={paginatedSummaries} />
                        {hasMoreSummaries && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => setSummaryMoreCount((prev) => prev + 1)}
                              className="px-6 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              查看更多
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* PC端左侧日历区域 */}
            <div className="hidden md:block w-80 flex-shrink-0 px-6 py-3 overflow-y-auto border-r">
              <Calendar
                dateData={dateCheckInCount}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                className="border rounded-lg p-4 h-full"
              />
            </div>

            {/* PC端右侧卡片区域 */}
            <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-y-auto">
              <Tabs defaultValue="detail" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detail">打卡明细</TabsTrigger>
                    <TabsTrigger value="summary">打卡汇总</TabsTrigger>
                  </TabsList>
                </div>

                {/* 明细 */}
                <TabsContent
                  value="detail"
                  className="flex-1 flex flex-col px-6 mt-4 pb-6 min-h-0">
                  <FilterBar
                    users={users}
                    selectedUser={selectedUser}
                    onUserChange={setSelectedUser}
                    searchKeyword={searchKeyword}
                    onSearchChange={setSearchKeyword}
                    selectedDynasty={selectedDynasty}
                    onDynastyChange={setSelectedDynasty}
                  />
                  <div className="flex-1 overflow-auto">
                    {/* 今日打卡 - 不分页，全部展示 */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 text-primary">今日打卡</h3>
                      {todayCheckIns.length > 0 ? (
                        <DetailCard data={todayCheckIns} />
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          今天还没有打卡哦！「及时当勉励，岁月不待人」
                        </div>
                      )}
                    </div>

                    {/* 更多打卡 - 分页展示 */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">更多打卡</h3>
                      {paginatedDetails.length > 0 ? (
                        <>
                          <DetailCard data={paginatedDetails} />
                          {hasMoreDetails && (
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => setDetailMoreCount((prev) => prev + 1)}
                                className="px-6 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                查看更多
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          暂无数据
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 汇总 - 整合展示，不分今日和更多 */}
                <TabsContent
                  value="summary"
                  className="flex-1 flex flex-col px-6 mt-4 pb-6 min-h-0">
                  <SummaryFilterBar
                    users={users}
                    selectedUser={selectedUser}
                    onUserChange={setSelectedUser}
                    searchKeyword={searchKeyword}
                    onSearchChange={setSearchKeyword}
                    selectedDynasty={selectedDynasty}
                    onDynastyChange={setSelectedDynasty}
                    countSort={countSort}
                    onCountSortChange={(value) => setCountSort(value ?? "default")}
                  />
                  <div className="flex-1 overflow-auto">
                    {paginatedSummaries.length > 0 ? (
                      <>
                        <SummaryCard data={paginatedSummaries} />
                        {hasMoreSummaries && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => setSummaryMoreCount((prev) => prev + 1)}
                              className="px-6 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              查看更多
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </div>
                    )}
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
