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
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { SimplePagination } from "@/components/ui/pagination";
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

/** 排序键类型 */
type DetailSortKey = "check_in_time";
type SummarySortKey = "created_at" | "updated_at" | "count";

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

/** 打卡明细表格 */
function DetailTable({
  data,
  sort,
  onSort,
  renderSortIcon,
}: {
  data: CheckInDetail[];
  sort: { key: DetailSortKey; direction: "asc" | "desc" };
  onSort: (key: DetailSortKey) => void;
  renderSortIcon: (
    active: boolean,
    direction: "asc" | "desc",
  ) => React.ReactNode;
}) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/50 sticky top-0">
        <tr>
          <th className="px-2 py-2 text-left">ID</th>
          <th className="px-2 py-2 text-left">用户</th>
          <th className="px-2 py-2 text-left">标题</th>
          <th className="px-2 py-2 text-left">诗人</th>
          <th
            className="px-2 py-2 text-left cursor-pointer"
            onClick={() => onSort("check_in_time")}>
            <span className="flex items-center gap-1">
              打卡时间
              {renderSortIcon(sort.key === "check_in_time", sort.direction)}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-8 text-muted-foreground">
              暂无数据
            </td>
          </tr>
        ) : (
          data.map((d) => (
            <tr key={d.id} className="border-b hover:bg-muted/30">
              <td className="px-2 py-2">{d.id}</td>
              <td className="px-2 py-2">{d.user_name}</td>
              <td className="px-2 py-2">{d.poem_title}</td>
              <td className="px-2 py-2">
                {d.author}·{d.dynasty}
              </td>
              <td className="px-2 py-2">
                {new Date(d.check_in_time).toLocaleString()}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

/** 打卡汇总表格 */
function SummaryTable({
  data,
  sort,
  onSort,
  renderSortIcon,
}: {
  data: CheckInSummary[];
  sort: { key: SummarySortKey; direction: "asc" | "desc" };
  onSort: (key: SummarySortKey) => void;
  renderSortIcon: (
    active: boolean,
    direction: "asc" | "desc",
  ) => React.ReactNode;
}) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/50 sticky top-0">
        <tr>
          <th className="px-2 py-2 text-left">ID</th>
          <th className="px-2 py-2 text-left">用户</th>
          <th className="px-2 py-2 text-left">诗词</th>
          <th
            className="px-2 py-2 text-left cursor-pointer"
            onClick={() => onSort("count")}>
            <span className="flex items-center gap-1">
              打卡次数
              {renderSortIcon(sort.key === "count", sort.direction)}
            </span>
          </th>
          <th
            className="px-2 py-2 text-left cursor-pointer"
            onClick={() => onSort("created_at")}>
            <span className="flex items-center gap-1">
              初次打卡
              {renderSortIcon(sort.key === "created_at", sort.direction)}
            </span>
          </th>
          <th
            className="px-2 py-2 text-left cursor-pointer"
            onClick={() => onSort("updated_at")}>
            <span className="flex items-center gap-1">
              最后打卡
              {renderSortIcon(sort.key === "updated_at", sort.direction)}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-8 text-muted-foreground">
              暂无数据
            </td>
          </tr>
        ) : (
          data.map((s) => (
            <tr key={s.id} className="border-b hover:bg-muted/30">
              <td className="px-2 py-2">{s.id}</td>
              <td className="px-2 py-2">{s.user_name}</td>
              <td className="px-2 py-2">{s.poem_title}</td>
              <td className="px-2 py-2">{s.count}</td>
              <td className="px-2 py-2">
                {new Date(s.created_at).toLocaleString()}
              </td>
              <td className="px-2 py-2">
                {new Date(s.updated_at).toLocaleString()}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
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

  // 排序状态
  const [detailSort, setDetailSort] = useState<{
    key: DetailSortKey;
    direction: "asc" | "desc";
  }>({
    key: "check_in_time",
    direction: "desc",
  });
  const [summarySort, setSummarySort] = useState<{
    key: SummarySortKey;
    direction: "asc" | "desc";
  }>({
    key: "updated_at",
    direction: "desc",
  });

  // 分页状态
  const [detailPage, setDetailPage] = useState(1);
  const [summaryPage, setSummaryPage] = useState(1);
  const pageSize = 10;

  // 日历选中日期
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

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
      const date = d.check_in_time.split("T")[0];
      countMap.set(date, (countMap.get(date) || 0) + 1);
    });
    return countMap;
  }, [details]);

  // 弹窗打开时加载数据
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [open, loadData]);

  // 筛选条件变化时重置分页
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailPage(1);
  }, [selectedUser, searchKeyword, selectedDynasty, detailSort]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummaryPage(1);
  }, [selectedUser, searchKeyword, selectedDynasty, summarySort]);

  // 筛选明细数据
  const filteredDetails = details.filter((d) => {
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

  // 筛选汇总数据
  const filteredSummaries = summaries.filter((s) => {
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

  // 排序明细数据
  const sortedDetails = [...filteredDetails].sort((a, b) => {
    const valueA = a[detailSort.key];
    const valueB = b[detailSort.key];
    if (!valueA) return 1;
    if (!valueB) return -1;
    return detailSort.direction === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // 排序汇总数据
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    const valueA = a[summarySort.key];
    const valueB = b[summarySort.key];
    if (valueA === undefined || valueA === null) return 1;
    if (valueB === undefined || valueB === null) return -1;
    if (typeof valueA === "number" && typeof valueB === "number") {
      return summarySort.direction === "asc"
        ? valueA - valueB
        : valueB - valueA;
    }
    return summarySort.direction === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // 分页数据
  const paginatedDetails = sortedDetails.slice(
    (detailPage - 1) * pageSize,
    detailPage * pageSize,
  );
  const paginatedSummaries = sortedSummaries.slice(
    (summaryPage - 1) * pageSize,
    summaryPage * pageSize,
  );
  const detailTotalPages = Math.ceil(sortedDetails.length / pageSize) || 1;
  const summaryTotalPages = Math.ceil(sortedSummaries.length / pageSize) || 1;

  // 切换明细排序
  const toggleDetailSort = (key: DetailSortKey) => {
    setDetailSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // 切换汇总排序
  const toggleSummarySort = (key: SummarySortKey) => {
    setSummarySort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // 渲染排序图标
  const renderSortIcon = (active: boolean, direction: "asc" | "desc") => {
    if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return direction === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

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
            {/* 移动端内容区域 - ScrollArea 滚动 */}
            <ScrollArea className="md:hidden h-[75vh] max-h-[calc(100%-50px)]">
              {/* 移动端日历区域 - Accordion 折叠 */}

              <CalendarPanel
                dateCheckInCount={dateCheckInCount}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />

              <div className="px-4 py-4">
                <Tabs
                  defaultValue="detail"
                  className="flex flex-col"
                  onValueChange={() => {
                    setDetailPage(1);
                    setSummaryPage(1);
                  }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detail">打卡明细</TabsTrigger>
                    <TabsTrigger value="summary">打卡汇总</TabsTrigger>
                  </TabsList>

                  {/* 明细表格 */}
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
                    <div className="overflow-auto">
                      <DetailTable
                        data={paginatedDetails}
                        sort={detailSort}
                        onSort={toggleDetailSort}
                        renderSortIcon={renderSortIcon}
                      />
                    </div>
                    <SimplePagination
                      currentPage={detailPage}
                      totalPages={detailTotalPages}
                      totalCount={sortedDetails.length}
                      onPageChange={setDetailPage}
                    />
                  </TabsContent>

                  {/* 汇总表格 */}
                  <TabsContent value="summary" className="flex flex-col mt-4">
                    <FilterBar
                      users={users}
                      selectedUser={selectedUser}
                      onUserChange={setSelectedUser}
                      searchKeyword={searchKeyword}
                      onSearchChange={setSearchKeyword}
                      selectedDynasty={selectedDynasty}
                      onDynastyChange={setSelectedDynasty}
                    />
                    <div className="overflow-auto">
                      <SummaryTable
                        data={paginatedSummaries}
                        sort={summarySort}
                        onSort={toggleSummarySort}
                        renderSortIcon={renderSortIcon}
                      />
                    </div>
                    <SimplePagination
                      currentPage={summaryPage}
                      totalPages={summaryTotalPages}
                      totalCount={sortedSummaries.length}
                      onPageChange={setSummaryPage}
                    />
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

            {/* PC端右侧表格区域 */}
            <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-y-auto">
              <Tabs
                defaultValue="detail"
                className="flex-1 flex flex-col overflow-hidden"
                onValueChange={() => {
                  setDetailPage(1);
                  setSummaryPage(1);
                }}>
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detail">打卡明细</TabsTrigger>
                    <TabsTrigger value="summary">打卡汇总</TabsTrigger>
                  </TabsList>
                </div>

                {/* 明细表格 */}
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
                  <div className="flex-1 overflow-auto sm:min-h-90">
                    <DetailTable
                      data={paginatedDetails}
                      sort={detailSort}
                      onSort={toggleDetailSort}
                      renderSortIcon={renderSortIcon}
                    />
                  </div>
                  <SimplePagination
                    currentPage={detailPage}
                    totalPages={detailTotalPages}
                    totalCount={sortedDetails.length}
                    onPageChange={setDetailPage}
                  />
                </TabsContent>

                {/* 汇总表格 */}
                <TabsContent
                  value="summary"
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
                  <div className="flex-1 overflow-auto sm:min-h-90">
                    <SummaryTable
                      data={paginatedSummaries}
                      sort={summarySort}
                      onSort={toggleSummarySort}
                      renderSortIcon={renderSortIcon}
                    />
                  </div>
                  <SimplePagination
                    currentPage={summaryPage}
                    totalPages={summaryTotalPages}
                    totalCount={sortedSummaries.length}
                    onPageChange={setSummaryPage}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
