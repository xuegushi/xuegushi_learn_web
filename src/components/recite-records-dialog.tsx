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
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllFromDB, STORES } from "@/lib/db";
import { DynastyArr } from "@/config/poem";

/** 用户类型 */
interface User {
  id: number;
  user_name: string;
}
import {
  CircleX,
  CircleCheck,
  UserSquare,
  Clock,
  ChevronDown,
} from "lucide-react";

interface ReciteRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 背诵明细 */
interface ReciteDetail {
  id?: number;
  user_id: string;
  poem_id: string;
  title: string;
  author: string;
  dynasty: string;
  status: boolean; // false 未掌握，true 已掌握
  createdAt: string;
}

/** 背诵汇总 */
interface ReciteSummary {
  id?: number;
  user_id: string;
  poem_ids: { poem_id: string; title: string; status: boolean }[];
  pass_count: number;
  unpass_count: number;
  skip_count: number;
  createdAt: string;
}

/** 背诵记录弹窗 */
export function ReciteRecordsDialog({
  open,
  onOpenChange,
}: ReciteRecordsDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<ReciteDetail[]>([]);
  const [summaries, setSummaries] = useState<ReciteSummary[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedDynasty, setSelectedDynasty] = useState<string>("all");

  const [detailPage, setDetailPage] = useState<number>(5);
  const [summaryPage, setSummaryPage] = useState<number>(5);

  // 加载数据
  const loadData = useCallback(async () => {
    const [usersData, detailsData, summariesData] = await Promise.all([
      getAllFromDB<User>(STORES.USERS),
      getAllFromDB<ReciteDetail>(STORES.RECITE_DETAIL),
      getAllFromDB<ReciteSummary>(STORES.RECITE_SUMMARY),
    ]);
    setUsers(usersData);
    setDetails(
      detailsData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    setSummaries(
      summariesData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }, []);

  useEffect(() => {
    if (open) {
      (async () => {
        await loadData();
        setDetailPage(5);
        setSummaryPage(5);
      })();
    }
  }, [open, loadData]);

  // 筛选后的明细
  const filteredDetails = useMemo(() => {
    return details.filter((item) => {
      if (selectedUser !== "all" && item.user_id !== selectedUser)
        return false;
      if (
        selectedDynasty !== "all" &&
        !item.dynasty.includes(selectedDynasty)
      )
        return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(keyword);
        const matchesAuthor = item.author.toLowerCase().includes(keyword);
        if (!matchesTitle && !matchesAuthor) return false;
      }
      return true;
    });
  }, [details, selectedUser, selectedDynasty, searchKeyword]);

  // 筛选后的汇总
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      if (selectedUser !== "all" && item.user_id !== selectedUser)
        return false;
      return true;
    });
  }, [summaries, selectedUser]);

  // 今日背诵
  const todayDetails = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return filteredDetails.filter((item) =>
      item.createdAt.startsWith(todayStr)
    );
  }, [filteredDetails]);

  // 历史背诵（排除今日）
  const historyDetails = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return filteredDetails.filter(
      (item) => !item.createdAt.startsWith(todayStr)
    );
  }, [filteredDetails]);

  // 显示的历史背诵
  const displayedHistoryDetails = historyDetails.slice(0, detailPage);
  const hasMoreHistory = detailPage < historyDetails.length;

  // 显示的汇总
  const displayedSummaries = filteredSummaries.slice(0, summaryPage);
  const hasMoreSummaries = summaryPage < filteredSummaries.length;

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // 获取用户名
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === Number(userId));
    return user?.user_name || "未知用户";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">背诵记录</DialogTitle>
        </DialogHeader>

        {/* 筛选部分 */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* 用户筛选 */}
          <Select value={selectedUser} onValueChange={(v) => v && setSelectedUser(v)}>
            <SelectTrigger className="w-32">
              <SelectValue>
                {selectedUser === "all"
                  ? "全部用户"
                  : users.find((u) => u.id === Number(selectedUser))
                      ?.user_name || "选择用户"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部用户</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 搜索 */}
          <input
            type="text"
            placeholder="搜索诗词/诗人..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm bg-background w-40 sm:w-48"
          />

          {/* 朝代筛选 */}
          <Select value={selectedDynasty} onValueChange={(v) => v && setSelectedDynasty(v)}>
            <SelectTrigger className="w-32">
              <SelectValue>
                {selectedDynasty === "all" ? "全部朝代" : selectedDynasty}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部朝代</SelectItem>
              {DynastyArr.map((dynasty) => (
                <SelectItem key={dynasty} value={dynasty}>
                  {dynasty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detail" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detail">背诵明细</TabsTrigger>
            <TabsTrigger value="summary">背诵汇总</TabsTrigger>
          </TabsList>

          {/* 背诵明细 */}
          <TabsContent
            value="detail"
            className="flex-1 flex flex-col min-h-0 mt-4"
          >
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* 今日背诵 */}
                {todayDetails.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-blue-600 dark:text-blue-400">
                      今日背诵
                    </h3>
                    <div className="space-y-2">
                      {todayDetails.map((item) => (
                        <DetailCard
                          key={item.id}
                          item={item}
                          userName={getUserName(item.user_id)}
                          formatDateTime={formatDateTime}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 历史背诵 */}
                {displayedHistoryDetails.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">历史背诵</h3>
                    <div className="space-y-2">
                      {displayedHistoryDetails.map((item) => (
                        <DetailCard
                          key={item.id}
                          item={item}
                          userName={getUserName(item.user_id)}
                          formatDateTime={formatDateTime}
                        />
                      ))}
                    </div>

                    {/* 查看更多 */}
                    {hasMoreHistory && (
                      <button
                        onClick={() => setDetailPage((p) => p + 10)}
                        className="w-full mt-4 py-2 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-center gap-1"
                      >
                        查看更多
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                {todayDetails.length === 0 && historyDetails.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无背诵记录
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 背诵汇总 */}
          <TabsContent
            value="summary"
            className="flex-1 flex flex-col min-h-0 mt-4"
          >
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {displayedSummaries.map((item) => (
                  <SummaryCard
                    key={item.id}
                    item={item}
                    userName={getUserName(item.user_id)}
                    formatDateTime={formatDateTime}
                  />
                ))}

                {hasMoreSummaries && (
                  <button
                    onClick={() => setSummaryPage((p) => p + 10)}
                    className="w-full mt-4 py-2 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-center gap-1"
                  >
                    查看更多
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}

                {filteredSummaries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无背诵汇总记录
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/** 明细卡片 */
function DetailCard({
  item,
  userName,
  formatDateTime,
}: {
  item: ReciteDetail;
  userName: string;
  formatDateTime: (date: string) => string;
}) {
  return (
    <div className="relative p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 状态图标 */}
      <div className="absolute top-3 right-3">
        {item.status ? (
          <CircleCheck className="h-5 w-5 text-green-500" />
        ) : (
          <CircleX className="h-5 w-5 text-red-500" />
        )}
      </div>

      {/* 诗词标题 */}
      <div className="font-medium text-sm pr-8">{item.title}</div>

      {/* 朝代·作者 */}
      <div className="text-xs text-muted-foreground mt-1">
        {item.dynasty}·{item.author}
      </div>

      {/* 用户和时间 */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <UserSquare className="h-3 w-3" />
          {userName}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDateTime(item.createdAt)}
        </div>
      </div>
    </div>
  );
}

/** 汇总卡片 */
function SummaryCard({
  item,
  userName,
  formatDateTime,
}: {
  item: ReciteSummary;
  userName: string;
  formatDateTime: (date: string) => string;
}) {
  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 数量统计 */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-red-600 dark:text-red-400">
          未掌握：{item.unpass_count}
        </span>
        <span className="text-green-600 dark:text-green-400">
          掌握：{item.pass_count}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          跳过：{item.skip_count}
        </span>
      </div>

      {/* 用户和时间 */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <UserSquare className="h-3 w-3" />
          {userName}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDateTime(item.createdAt)}
        </div>
      </div>
    </div>
  );
}
