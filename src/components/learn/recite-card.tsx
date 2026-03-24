"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail } from "@/types/poem";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, CircleX, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addReciteDetail, setToDB, getAllFromDB, STORES } from "@/lib/db";
import { ReciteRecordsDialog } from "@/components/recite-records-dialog";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { useState } from "react";

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
  targetId: number;
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
  targetId,
}: ReciteCardProps) {
  const key = targetId?.toString();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"mastered"|"not_mastered"|null>(null);

  const getCurrentUser = () => {
    if (typeof window === "undefined") return null;
    try {
      const s = localStorage.getItem("user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  };

  const handleCreateUserSubmit = async (userName: string) => {
    const now = new Date().toISOString();
    await setToDB(STORES.USERS, { user_name: userName, created_at: now, updated_at: now });
    const users = await getAllFromDB<{ id: number; user_name: string }>(STORES.USERS);
    const newUser = users[users.length - 1];
    localStorage.setItem("user", JSON.stringify({ user_id: newUser.id, user_name: newUser.user_name }));
    if (pendingKey) {
      if (pendingAction === "mastered") onMastered(pendingKey);
      else if (pendingAction === "not_mastered") onNotMastered(pendingKey);
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

  // 处理“掌握/未掌握”点击逻辑
  const handleNotMasteredClick = () => {
    const user = getCurrentUser();
    if (!user) {
      setPendingKey(key);
      setPendingAction("not_mastered");
      setShowCreateUser(true);
    } else {
      onNotMastered(key);
    }
  };
  const handleMasteredClick = () => {
    const user = getCurrentUser();
    if (!user) {
      setPendingKey(key);
      setPendingAction("mastered");
      setShowCreateUser(true);
    } else {
      onMastered(key);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="relative w-full min-w-80 h-full">
        {/* 序号标记 */}
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
          {currentIndex + 1}
        </div>
        <Card className="shadow-lg w-full h-[calc(100%-60px)] flex flex-col relative overflow-hidden">
          <CardContent className="space-y-3 md:space-y-4 flex flex-col flex-1 overflow-hidden">
            {/* 顶部状态栏 */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded ${isMastered ? 'bg-green-500' : isNotMastered ? 'bg-red-500' : 'bg-gray-300'} transition-colors`} />
                <button
                  onClick={onRandomHint}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                  title="点击随机显示每行一个汉字">
                  <Shuffle className="h-3 w-3" />
                  随机提示
                </button>
              </div>
              <button onClick={onViewDetail} className="text-sm text-blue-500 hover:underline cursor-pointer">查看详情</button>
            </div>
            {/* 诗词内容区域保持原有实现的头部结构，省略详细文本以简化 patch */}
            <ScrollArea className="flex-1 max-h-[calc(100%-100px)] min-h-40" />
            {/* 底部按钮 */}
            <div className="mt-auto pt-2 flex-shrink-0">
              <div className="flex gap-4">
                <button onClick={handleNotMasteredClick} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isDisabled}>
                  <CircleX className="h-5 w-5" /> 未掌握
                </button>
                <button onClick={handleMasteredClick} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isDisabled}>
                  <CheckCircle2 className="h-5 w-5" /> 掌握
                </button>
                <button onClick={onSkip} className="py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">跳过</button>
              </div>
            </div>
          </CardContent>
        </Card>
        <ReciteRecordsDialog open={reciteRecordsOpen} onOpenChange={setReciteRecordsOpen} />
      </div>
      <CreateUserDialog open={showCreateUser} onOpenChange={setShowCreateUser} onSubmit={handleCreateUserSubmit} />
    </div>
  );
}
