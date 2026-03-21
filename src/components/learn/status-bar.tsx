"use client";

import { PanelLeft, CheckCheck } from "lucide-react";
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
  onToggleSidebar: () => void;
  onCheckInRecordsClick: () => void;
  checkedPoemIds?: Set<number>;
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
  onToggleSidebar,
  onCheckInRecordsClick,
  checkedPoemIds = new Set(),
}: StatusBarProps) {
  const accuracy = errorCount + correctCount > 0
    ? Math.round((correctCount / (errorCount + correctCount)) * 100)
    : 0;

  const todayCheckInCount = checkedPoemIds.size;

  return (
    <div className="border-b shadow-sm py-2 md:py-3 px-2 md:px-4 bg-background/50 backdrop-blur flex-shrink-0">
      {/* PC端：一行显示 */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <button
          onClick={onToggleSidebar}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
          title="切换侧边栏"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {mode === "recite" && poems.length > 0 && (
          <>
            <NavButton onClick={onPrev} direction="prev" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {poems.length}
            </span>
            <NavButton onClick={onNext} direction="next" />

            <div className="flex flex-wrap items-center gap-1 flex-1 justify-center">
              {poems.map((poem, idx) => {
                const key = poem.targetId?.toString();
                const isMastered = masteredPoems.has(key);
                const isNotMastered = notMasteredPoems.has(key);
                const color = isMastered ? "bg-green-500" : isNotMastered ? "bg-red-500" : "bg-gray-300";
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded cursor-pointer ${color} transition-colors ${isCurrent ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"}`}
                    onClick={() => onJumpTo(idx)}
                    title={`${poem.title} (${idx + 1}/${poems.length})`}
                  />
                );
              })}
            </div>

            <div className="flex gap-4 text-sm ml-auto">
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
            <span className="text-sm text-muted-foreground">
              {poems[currentIndex]?.grade}
            </span>

            <div className="flex flex-wrap items-center gap-1 flex-1 justify-center">
              {poems.map((poem, idx) => {
                const isChecked = checkedPoemIds.has(poem.targetId);
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                      isChecked 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                    onClick={() => onJumpTo(idx)}
                    title={`${poem.title} (${idx + 1}/${poems.length})`}
                  >
                    {isChecked && <CheckCheck className="h-3 w-3" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onCheckInRecordsClick}
              className="relative flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              打卡记录
              {todayCheckInCount > 0 && (
                <span className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {todayCheckInCount > 99 ? '99+' : todayCheckInCount}
                </span>
              )}
            </button>
          </>
        )}

        {poems.length === 0 && (
          <div className="text-lg font-medium">0 / 0</div>
        )}
      </div>

      {/* 移动端：多行显示 */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
            title="切换侧边栏"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          {mode === "recite" && poems.length > 0 && (
            <>
              <NavButton onClick={onPrev} direction="prev" />
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {poems.length}
              </span>
              <NavButton onClick={onNext} direction="next" />
              <div className="flex gap-2 text-xs ml-auto">
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
              <span className="text-sm text-muted-foreground">
                {poems[currentIndex]?.grade}
              </span>
              <button
                onClick={onCheckInRecordsClick}
                className="relative flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors cursor-pointer ml-auto"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                打卡记录
                {todayCheckInCount > 0 && (
                  <span className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {todayCheckInCount > 99 ? '99+' : todayCheckInCount}
                  </span>
                )}
              </button>
            </>
          )}

          {poems.length === 0 && (
            <div className="text-lg font-medium">0 / 0</div>
          )}
        </div>

        {/* 移动端方块组单独一行 */}
        {mode === "learn" && poems.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-2 pb-2">
            {poems.map((poem, idx) => {
              const isChecked = checkedPoemIds.has(poem.targetId);
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    isChecked 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  onClick={() => onJumpTo(idx)}
                />
              );
            })}
          </div>
        )}

        {/* 状态指示点 - 移动端单独显示在下方 */}
        {mode === "recite" && poems.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
            {poems.map((poem, idx) => {
              const key = poem.targetId?.toString();
              const isMastered = masteredPoems.has(key);
              const isNotMastered = notMasteredPoems.has(key);
              const color = isMastered ? "bg-green-500" : isNotMastered ? "bg-red-500" : "bg-gray-300";
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded cursor-pointer ${color} transition-colors ${isCurrent ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"}`}
                  onClick={() => onJumpTo(idx)}
                />
              );
            })}
          </div>
        )}
      </div>
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
