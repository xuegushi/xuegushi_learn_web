"use client";

import { Poem } from "@/types/poem";

interface StatusBarProps {
  poems: Poem[];
  currentIndex: number;
  mode: "recite" | "learn";
  errorCount: number;
  correctCount: number;
  masteredPoems: Set<string>;
  notMasteredPoems: Set<string>;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
}

/**
 * 顶部状态栏：显示导航、进度、正确率等信息
 */
export function StatusBar({
  poems,
  currentIndex,
  mode,
  errorCount,
  correctCount,
  masteredPoems,
  notMasteredPoems,
  onPrev,
  onNext,
  onJumpTo,
}: StatusBarProps) {
  const accuracy = errorCount + correctCount > 0
    ? Math.round((correctCount / (errorCount + correctCount)) * 100)
    : 0;

  return (
    <div className="border-b shadow-sm py-2 md:py-3 px-2 md:px-4 bg-background/50 backdrop-blur flex-shrink-0">
      <div className="flex items-center gap-2">
        {mode === "recite" && poems.length > 0 && (
          <>
            <NavButton onClick={onPrev} direction="prev" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {poems.length}
            </span>
            <NavButton onClick={onNext} direction="next" />
            <div className="flex gap-2 md:gap-4 text-xs md:text-sm ml-auto">
              <span className="text-red-500">错误：{errorCount}</span>
              <span className="text-green-500">正确：{correctCount}</span>
              <span className="text-muted-foreground">正确率：{accuracy}%</span>
            </div>
          </>
        )}

        {mode === "learn" && poems.length > 0 && (
          <>
            <NavButton onClick={onPrev} direction="prev" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {poems.length}
            </span>
            <NavButton onClick={onNext} direction="next" />
            <span className="text-sm text-muted-foreground ml-auto">
              {poems[currentIndex]?.grade} · {poems[currentIndex]?.semester}
            </span>
          </>
        )}

        {poems.length === 0 && (
          <div className="text-lg font-medium">
            0 / 0
          </div>
        )}
      </div>

      {/* 状态指示点 - PC端 */}
      {mode === "recite" && poems.length > 0 && (
        <div className="hidden md:flex flex-wrap items-center gap-1 mt-2">
          {poems.map((poem, idx) => {
            const key = poem.targetId?.toString();
            const isMastered = masteredPoems.has(key);
            const isNotMastered = notMasteredPoems.has(key);
            const color = isMastered ? "bg-green-500" : isNotMastered ? "bg-red-500" : "bg-gray-300";
            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded cursor-pointer ${color} transition-colors hover:ring-2 hover:ring-primary`}
                onClick={() => onJumpTo(idx)}
                title={`${poem.title} (${idx + 1}/${poems.length})`}
              />
            );
          })}
        </div>
      )}

      {/* 状态指示点 - 移动端 */}
      {mode === "recite" && poems.length > 0 && (
        <div className="md:hidden flex flex-wrap items-center gap-1 mt-2">
          {poems.map((poem, idx) => {
            const key = poem.targetId?.toString();
            const isMastered = masteredPoems.has(key);
            const isNotMastered = notMasteredPoems.has(key);
            const color = isMastered ? "bg-green-500" : isNotMastered ? "bg-red-500" : "bg-gray-300";
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded cursor-pointer ${color} transition-colors hover:ring-2 hover:ring-primary`}
                onClick={() => onJumpTo(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 导航按钮 */
function NavButton({ onClick, direction }: { onClick: () => void; direction: "prev" | "next" }) {
  return (
    <button
      onClick={onClick}
      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={direction === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}
