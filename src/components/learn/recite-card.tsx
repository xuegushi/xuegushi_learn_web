"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail } from "@/types/poem";

interface ReciteCardProps {
  poemDetail: PoemDetail | null;
  currentIndex: number;
  showFirstChar: boolean;
  showLastChar: boolean;
  showRandomChar: boolean;
  masteredPoems: Set<string>;
  notMasteredPoems: Set<string>;
  onMastered: (key: string) => void;
  onNotMastered: (key: string) => void;
  onSkip: () => void;
  onViewDetail: () => void;
  targetId: number;
}

export function ReciteCard({
  poemDetail,
  currentIndex,
  showFirstChar,
  showLastChar,
  showRandomChar,
  masteredPoems,
  notMasteredPoems,
  onMastered,
  onNotMastered,
  onSkip,
  onViewDetail,
  targetId,
}: ReciteCardProps) {
  // 随机字符索引 - 使用ref保持稳定性
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const prevPoemIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (showRandomChar && poemDetail?.poem?.content?.content) {
      // 仅当诗词变化时重新生成
      if (poemDetail.poem.id !== prevPoemIdRef.current) {
        prevPoemIdRef.current = poemDetail.poem.id || null;
        const indices = poemDetail.poem.content.content.map((line) => {
          const chars = line.split("").filter((c) => !/[，。？！、]/.test(c));
          return chars.length > 0 ? Math.floor(Math.random() * chars.length) : -1;
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRandomIndices(indices);
      }
    }
  }, [showRandomChar, poemDetail]);

  const key = targetId?.toString();
  const isMastered = masteredPoems.has(key);
  const isNotMastered = notMasteredPoems.has(key);
  const isDisabled = isMastered || isNotMastered;

  const statusColor = isMastered ? "bg-green-500" : isNotMastered ? "bg-red-500" : "bg-gray-300";

  if (!poemDetail) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full px-6 md:px-2 py-4">
      <div className="relative">
        {/* 序号标记 */}
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
          {currentIndex + 1}
        </div>
        <Card className="shadow-lg w-full max-w-2xl max-h-[70vh] flex flex-col">
          <CardContent className="p-4 md:p-6 space-y-3 md:space-y-6 flex flex-col flex-1 overflow-hidden">
            {/* 顶部状态栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${statusColor} transition-colors`} />
              </div>
              <button
                onClick={onViewDetail}
                className="text-sm text-blue-500 hover:underline cursor-pointer"
              >
                查看详情
              </button>
            </div>

            {/* 标题 */}
            <div className="text-center space-y-2 pt-4">
              <div className="font-bold text-2xl">
                {poemDetail.poem?.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {poemDetail.poem?.author} [{poemDetail.poem?.dynasty}]
            </div>
          </div>

          {/* 诗词内容 */}
          <div className="overflow-y-auto max-h-[calc(70vh-220px)] min-h-40">
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
              {showRandomChar && poemDetail.poem?.content?.content && (
                <ContentDisplay
                  lines={poemDetail.poem.content.content}
                  mode="random"
                  randomIndices={randomIndices}
                />
              )}

              {/* 都不显示 */}
              {!showFirstChar && !showLastChar && !showRandomChar && poemDetail.poem?.content?.content && (
                <ContentDisplay
                  lines={poemDetail.poem.content.content}
                  mode="none"
                />
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="mt-auto pt-2 flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => onNotMastered(key)}
                className="flex-1 py-3 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isDisabled}
              >
                未掌握
              </button>
              <button
                onClick={() => onMastered(key)}
                className="flex-1 py-3 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isDisabled}
              >
                掌握
              </button>
              <button
                onClick={onSkip}
                className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                跳过
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
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
          <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
            {chars.map((char, charIdx) => {
              const isSpecial = charIdx === specialIdx;
              const isPunct = /[，。？！、]/.test(char);

              return (
                <span
                  key={charIdx}
                  className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm"
                >
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
