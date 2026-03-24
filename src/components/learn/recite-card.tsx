"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail } from "@/types/poem";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, CircleX, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addReciteDetail, addReciteSummary } from "@/lib/db";
import { ReciteRecordsDialog } from "@/components/recite-records-dialog";
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
  const isMastered = masteredPoems.has(key);
  const isNotMastered = notMasteredPoems.has(key);
  const isDisabled = isMastered || isNotMastered;

  const statusColor = isMastered
    ? "bg-green-500"
    : isNotMastered
      ? "bg-red-500"
      : "bg-gray-300";
  const [reciteRecordsOpen, setReciteRecordsOpen] = useState(false);
  // Write-back helper for recite detail/summary (Patch 3)
  const logReciteRecord = async (status: boolean) => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      let userId = "guest";
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userId = userObj?.id ?? "guest";
      }
      const poem = (poemDetail?.poem ?? {}) as { title?: string; author?: string; dynasty?: string; id?: string | number };
      const title = poem.title ?? "";
      const poemId = String(poem.id ?? 0);
      const detail = {
        user_id: userId,
        poem_id: poemId,
        title,
        author: poem.author ?? "",
        dynasty: poem.dynasty ?? "",
        status,
        createdAt: new Date().toISOString(),
      } as const;
      await addReciteDetail(detail);
      const summary = {
        user_id: userId,
        poem_ids: [{ poem_id: poemId, title, status }],
        pass_count: status ? 1 : 0,
        unpass_count: status ? 0 : 1,
        skip_count: 0,
        createdAt: new Date().toISOString(),
      };
      await addReciteSummary(summary);
    } catch {
      // ignore
    }
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
                  className={`w-4 h-4 rounded ${statusColor} transition-colors`}
                />
                <button
                  onClick={onRandomHint}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                  title="点击随机显示每行一个汉字">
                  <Shuffle className="h-3 w-3" />
                  随机提示
                </button>
              </div>
              <button
                onClick={onViewDetail}
                className="text-sm text-blue-500 hover:underline cursor-pointer">
                查看详情
              </button>
            </div>
            {/* 诗词内容 */}
            <ScrollArea className="flex-1 max-h-[calc(100%-100px)] min-h-40">
              {/* 标题 */}
              <div className="text-center space-y-2 pt-4">
                <div className="font-bold text-2xl">
                  {poemDetail.poem?.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {poemDetail.poem?.author} [{poemDetail.poem?.dynasty}]
                </div>
              </div>

              <div className="text-center py-4">
                {poemDetail.poem?.xu && (
                  <div className="text-muted-foreground text-sm mb-2 italic">
                    {poemDetail.poem.xu}
                  </div>
                )}

                {/* 显示首字 */}
                {showFirstChar && poemDetail.poem?.content?.content && (
                  <ContentDisplay
                    lines={poemDetail.poem.content.content}
                    mode="first"
                  />
                )}

                {/* 显示尾字 */}
                {showLastChar && poemDetail.poem?.content?.content && (
                  <ContentDisplay
                    lines={poemDetail.poem.content.content}
                    mode="last"
                  />
                )}

                {/* 随机显示 */}
                {showRandomChar &&
                  randomIndices.length > 0 &&
                  poemDetail.poem?.content?.content && (
                    <ContentDisplay
                      lines={poemDetail.poem.content.content}
                      mode="random"
                      randomIndices={randomIndices}
                    />
                  )}

                {/* 隐藏文字 */}
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

            {/* 底部按钮 */}
            <div className="mt-auto pt-2 flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setReciteRecordsOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer"
              >
                背诵记录
              </button>
                <button
                  onClick={async () => { await logReciteRecord(false); onNotMastered(key); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isDisabled}>
                  <CircleX className="h-5 w-5" />
                  未掌握
                </button>
                <button
                  onClick={async () => { await logReciteRecord(true); onMastered(key); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isDisabled}>
                  <CheckCircle2 className="h-5 w-5" />
                  掌握
                </button>
                <button
                  onClick={onSkip}
                  className="py-2.5 px-3 sm:px-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  跳过
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <ReciteRecordsDialog open={reciteRecordsOpen} onOpenChange={setReciteRecordsOpen} />
      </div>
    </div>
  );
}

/** 诗词内容显示组件 */
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
