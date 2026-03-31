"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail } from "@/types/poem";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleX, CheckCircle2, Timer, Square, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReciteRecordsDialog } from "@/components/recite-records-dialog";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { useUserStore } from "@/lib/api/user-store";
import { useState, useEffect, useRef } from "react";
import {
  addReciteTimeStat,
  getReciteTimeStatsByPoem,
  ReciteTimeStat,
} from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReciteCardProps {
  poemDetail: PoemDetail | null;
  currentIndex: number;
  showFirstChar: boolean;
  showLastChar: boolean;
  showRandomChar: boolean;
  randomIndices: number[];
  masteredPoems: Set<string>;
  notMasteredPoems: Set<string>;
  onMastered: (key: string) => void;
  onNotMastered: (key: string) => void;
  onSkip: () => void;
  onViewDetail: () => void;
  onRandomHint: () => void;
  onShowFirstCharChange: (show: boolean) => void;
  onShowLastCharChange: (show: boolean) => void;
  onShowRandomCharChange: (show: boolean) => void;
  targetId: number;
  onReciteRecordsClick?: () => void;
}

export function ReciteCard({
  poemDetail,
  currentIndex,
  showFirstChar,
  showLastChar,
  showRandomChar,
  randomIndices,
  masteredPoems,
  notMasteredPoems,
  onMastered,
  onNotMastered,
  onSkip,
  onViewDetail,
  onRandomHint,
  onShowFirstCharChange,
  onShowLastCharChange,
  onShowRandomCharChange,
  targetId,
  onReciteRecordsClick,
}: ReciteCardProps) {
  const key = targetId?.toString();

  const isMastered = masteredPoems.has(key ?? "");
  const isNotMastered = notMasteredPoems.has(key ?? "");
  const isDisabled = isMastered || isNotMastered;

  const { currentUser, addUser, switchUser } = useUserStore();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [reciteRecordsOpen, setReciteRecordsOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "mastered" | "not_mastered" | null
  >(null);

  // 计时相关状态
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [timeStats, setTimeStats] = useState<ReciteTimeStat[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 开始计时
  const startTimer = () => {
    setIsTiming(true);
    setElapsedSeconds(0);
    setHasSaved(false);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 99 * 60) {
          // 超过99分钟自动结束
          stopTimer(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // 停止计时
  const stopTimer = (auto = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTiming(false);
    // 计时结束时自动保存记录
    if (elapsedSeconds > 0 && currentUser && poemDetail?.poem) {
      addReciteTimeStat({
        user_id: currentUser.user_id,
        user_name: currentUser.user_name,
        poem_id: poemDetail?.poem?.id || 0,
        title: poemDetail?.poem?.title || "",
        author: poemDetail?.poem?.author || "",
        recite_spend: elapsedSeconds,
      }).then(() => {
        // 刷新统计数据
        getReciteTimeStatsByPoem(
          poemDetail?.poem?.id || 0,
          currentUser.user_id,
        ).then(setTimeStats);
      });
    }
    setShowTimeDialog(true);
  };

  // 保存时间记录
  const saveTimeRecord = async () => {
    if (!currentUser || !poemDetail?.poem) {
      console.log("saveTimeRecord: 用户或诗词信息不完整", {
        currentUser,
        poemDetail,
      });
      return;
    }

    console.log("saveTimeRecord 开始保存:", {
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      poem_id: poemDetail.poem.id,
      title: poemDetail.poem.title,
      elapsedSeconds,
    });

    try {
      const success = await addReciteTimeStat({
        user_id: currentUser.user_id,
        user_name: currentUser.user_name,
        poem_id: poemDetail.poem.id || 0,
        title: poemDetail.poem.title || "",
        author: poemDetail.poem.author || "",
        recite_spend: elapsedSeconds,
      });

      console.log("saveTimeRecord 保存结果:", success);

      if (success) {
        setHasSaved(true);

        // 刷新统计数据
        const stats = await getReciteTimeStatsByPoem(
          poemDetail.poem.id || 0,
          currentUser.user_id,
        );
        setTimeStats(stats);
        console.log("保存后刷新统计数据:", stats);
      }
    } catch (error) {
      console.error("保存时间记录失败:", error);
    }
  };

  // 加载时间统计
  useEffect(() => {
    const loadTimeStats = async () => {
      if (!currentUser || !poemDetail?.poem?.id) return;
      const stats = await getReciteTimeStatsByPoem(
        poemDetail.poem.id,
        currentUser.user_id,
      );
      setTimeStats(stats);
      console.log(
        "加载时间统计:",
        stats,
        "用户ID:",
        currentUser.user_id,
        "诗词ID:",
        poemDetail.poem.id,
      );
    };
    loadTimeStats();
  }, [currentUser, poemDetail?.poem?.id]);

  // 弹窗打开时重新加载数据
  useEffect(() => {
    if (showTimeDialog && currentUser && poemDetail?.poem?.id) {
      getReciteTimeStatsByPoem(poemDetail.poem.id, currentUser.user_id).then(
        setTimeStats,
      );
    }
  }, [showTimeDialog, currentUser, poemDetail?.poem?.id]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleCreateUserSubmit = async (userName: string) => {
    const newUser = await addUser(userName);
    if (newUser) {
      await switchUser(newUser);
      if (pendingKey) {
        if (pendingAction === "mastered") onMastered(pendingKey);
        else if (pendingAction === "not_mastered") onNotMastered(pendingKey);
      }
    }
    setPendingKey(null);
    setPendingAction(null);
    setShowCreateUser(false);
  };

  if (!poemDetail) {
    return (
      <div className="flex items-center justify-center h-full px-6 md:px-2 py-4">
        <Card className="w-full max-w-2xl max-h-[70vh]">
          <CardContent className="p-4 md:p-6 space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-center space-x-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-7" />
              ))}
            </div>
            <div className="flex justify-center space-x-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-7" />
              ))}
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNotMasteredClick = () => {
    if (!currentUser) {
      setPendingKey(key ?? null);
      setPendingAction("not_mastered");
      setShowCreateUser(true);
    } else {
      onNotMastered(key ?? "");
    }
  };
  const handleMasteredClick = () => {
    if (!currentUser) {
      setPendingKey(key ?? null);
      setPendingAction("mastered");
      setShowCreateUser(true);
    } else {
      onMastered(key ?? "");
    }
  };

  return (
    <div className="flex items-center justify-center h-[100%]  px-6 md:px-6 py-5">
      <div className="relative w-full h-full min-w-80 max-w-4xl">
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
          {currentIndex + 1}
        </div>
        <Card className="shadow-lg w-full h-full  flex flex-col relative overflow-visible">
          <CardContent className="px-4 md:px-5 md:py-2 space-y-3 md:space-y-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onShowRandomCharChange(true);
                    onShowFirstCharChange(false);
                    onShowLastCharChange(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    showRandomChar && !showFirstChar && !showLastChar
                      ? "bg-blue-500 text-white"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  }`}
                  title="随机显示每行一个汉字">
                  随机
                </button>
                <button
                  onClick={() => {
                    onShowFirstCharChange(true);
                    onShowLastCharChange(false);
                    onShowRandomCharChange(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    showFirstChar && !showLastChar
                      ? "bg-blue-500 text-white"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  }`}
                  title="显示每行首字">
                  首字
                </button>
                <button
                  onClick={() => {
                    onShowLastCharChange(true);
                    onShowFirstCharChange(false);
                    onShowRandomCharChange(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    showLastChar && !showFirstChar
                      ? "bg-blue-500 text-white"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  }`}
                  title="显示每行尾字">
                  尾字
                </button>
                <button
                  onClick={() => {
                    onShowFirstCharChange(false);
                    onShowLastCharChange(false);
                    onShowRandomCharChange(false);
                  }}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    !showFirstChar && !showLastChar && !showRandomChar
                      ? "bg-blue-500 text-white"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  }`}
                  title="隐藏文字">
                  隐藏
                </button>
              </div>
              <button
                onClick={onViewDetail}
                className="text-sm text-blue-500 hover:underline cursor-pointer">
                查看详情
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="font-bold text-2xl">{poemDetail.poem?.title}</div>
              <div className="text-sm text-muted-foreground">
                {poemDetail.poem?.author} [{poemDetail.poem?.dynasty}]
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[calc(100%-140px)] min-h-40">
              <div className="text-center py-4">
                {poemDetail.poem?.xu && (
                  <div className="text-muted-foreground text-sm mb-2 italic">
                    {poemDetail.poem.xu}
                  </div>
                )}

                {showFirstChar && poemDetail.poem?.content?.content && (
                  <ContentDisplay
                    lines={poemDetail.poem.content.content}
                    mode="first"
                  />
                )}

                {showLastChar && poemDetail.poem?.content?.content && (
                  <ContentDisplay
                    lines={poemDetail.poem.content.content}
                    mode="last"
                  />
                )}

                {showRandomChar &&
                  randomIndices.length > 0 &&
                  poemDetail.poem?.content?.content && (
                    <ContentDisplay
                      lines={poemDetail.poem.content.content}
                      mode="random"
                      randomIndices={randomIndices}
                    />
                  )}

                {!showFirstChar &&
                  !showLastChar &&
                  !showRandomChar &&
                  poemDetail.poem?.content?.content && (
                    <ContentDisplay
                      lines={poemDetail.poem.content.content}
                      mode="none"
                    />
                  )}
              </div>
            </ScrollArea>

            <div className="mt-auto pt-1 shrink-0">
              {/* 计时器和时间统计 */}
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (isTiming ? stopTimer() : startTimer())}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      isTiming
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                    {isTiming ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Timer className="h-4 w-4" />
                    )}
                    {isTiming ? "结束计时" : "开始计时"}
                  </button>

                  {/* 计时显示 */}
                  <div className="flex items-center gap-2">
                    {isTiming && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg">
                        <Clock className="h-5 w-5" />
                        <span className="font-mono text-sm">
                          {formatTime(elapsedSeconds)}
                        </span>
                      </div>
                    )}

                    {/* 统计显示 */}
                    {timeStats.length > 0 && !isTiming && (
                      <button
                        onClick={() => setShowTimeDialog(true)}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
                        <Clock className="h-4 w-4" />
                        {timeStats.length}次
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full mt-2 sm:mt-0 ml-0 sm:w-auto flex justify-end sm:ml-3 gap-3">
                  {onReciteRecordsClick && (
                    <button
                      onClick={onReciteRecordsClick}
                      className="py-1.5 px-3 sm:px-2 text-base sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer transition-colors">
                      背诵记录
                    </button>
                  )}
                  <button
                    onClick={onSkip}
                    className="py-1.5 px-3 sm:px-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                    跳过
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <ReciteRecordsDialog
          open={reciteRecordsOpen}
          onOpenChange={setReciteRecordsOpen}
        />
      </div>
      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        onSubmit={handleCreateUserSubmit}
      />

      {/* 时间统计弹窗 */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="border-b pb-1.5">背诵时间统计</DialogTitle>
            <DialogDescription>
              {elapsedSeconds > 0
                ? `本次背诵花费时间: ${formatTime(elapsedSeconds)}`
                : "查看背诵时间记录"}
            </DialogDescription>
          </DialogHeader>

          {elapsedSeconds > 0 && !hasSaved && (
            <div className="flex gap-2 py-3">
              <button
                onClick={() => {
                  handleNotMasteredClick();
                  setShowTimeDialog(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 cursor-pointer transition-colors">
                <CircleX className="h-4 w-4" />
                未掌握
              </button>
              <button
                onClick={() => {
                  handleMasteredClick();
                  setShowTimeDialog(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer transition-colors">
                <CheckCircle2 className="h-4 w-4" />
                掌握
              </button>
            </div>
          )}

          {timeStats.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-sm font-medium">历史记录</div>
              {timeStats
                .slice()
                .reverse()
                .map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-muted rounded-lg text-sm">
                    <span>{formatTime(stat.recite_spend)}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(stat.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ContentDisplayProps {
  lines: string[];
  mode: "first" | "last" | "random" | "none";
  randomIndices?: number[];
}

function ContentDisplay({ lines, mode, randomIndices }: ContentDisplayProps) {
  return (
    <div className="flex flex-col items-center mt-1">
      {lines.map((line, lineIdx) => {
        const chars = line.split("");
        let specialIdx = -1;

        if (mode === "first") {
          specialIdx = 0;
        } else if (mode === "last") {
          let lastIdx = chars.length - 1;
          while (lastIdx >= 0 && /[，。？！、]/.test(chars[lastIdx])) {
            lastIdx--;
          }
          specialIdx = lastIdx;
        } else if (mode === "random" && randomIndices) {
          let count = 0;
          for (let i = 0; i < chars.length; i++) {
            if (!/[，。？！、]/.test(chars[i])) {
              if (count === randomIndices[lineIdx]) {
                specialIdx = i;
                break;
              }
              count++;
            }
          }
        }

        return (
          <div
            key={lineIdx}
            className="flex gap-1 mb-1 flex-wrap justify-center">
            {chars.map((char, charIdx) => {
              const isSpecial = charIdx === specialIdx;
              const isPunct = /[，。？！、]/.test(char);

              return (
                <span
                  key={charIdx}
                  className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm">
                  {isSpecial ? (
                    char
                  ) : isPunct ? (
                    <span className="text-gray-400">{char}</span>
                  ) : (
                    " "
                  )}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
