"use client";

import { PanelLeft, CheckCheck } from "lucide-react";
import { Poem } from "@/types/poem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** 状态栏属性 */
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
  selectedFascicule: string;
  fasciculeList: { _id: string; fascicule_name: string }[];
  onFasciculeChange: (fasciculeId: string) => void;
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

/** 背诵模式状态点（绿/红/灰） */
function ReciteStatusDots({
  poems,
  currentIndex,
  masteredPoems,
  notMasteredPoems,
  onJumpTo,
}: {
  poems: Poem[];
  currentIndex: number;
  masteredPoems: Set<string>;
  notMasteredPoems: Set<string>;
  onJumpTo: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 flex-1 justify-cente px-3">
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
            title={`${poem.title} (${idx + 1}/${poems.length})`}
          />
        );
      })}
    </div>
  );
}

/** 学习模式打卡方块组 */
function CheckInBlocks({
  poems,
  currentIndex,
  checkedPoemIds,
  onJumpTo,
}: {
  poems: Poem[];
  currentIndex: number;
  checkedPoemIds: Set<number>;
  onJumpTo: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 flex-1 ml-3">
      {poems.map((poem, idx) => {
        const isChecked = checkedPoemIds.has(poem.targetId);
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={idx}
            className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${
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
  );
}

/** 打卡记录按钮 */
function CheckInButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors cursor-pointer"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      打卡记录
      {count > 0 && (
        <span className="absolute -top-2 -left-2 min-w-4.5 h-4.5 bg-red-500 text-white text-[12px] font-medium rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/** 顶部状态栏：显示导航、进度、正确率等信息 */
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
  selectedFascicule,
  fasciculeList,
  onFasciculeChange,
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

        {/* 背诵模式 */}
        {mode === "recite" && poems.length > 0 && (
          <>
            <NavButton onClick={onPrev} direction="prev" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {poems.length}
            </span>
            <NavButton onClick={onNext} direction="next" />
            {fasciculeList.length > 0 && (
              <Select value={selectedFascicule} onValueChange={(v) => v && onFasciculeChange(v)}>
                <SelectTrigger className="w-32 h-7 text-sm">
                  <SelectValue>
                    {fasciculeList.find(f => f._id === selectedFascicule)?.fascicule_name || selectedFascicule}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fasciculeList.map((fasc) => (
                    <SelectItem key={fasc._id} value={fasc._id}>
                      {fasc.fascicule_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <ReciteStatusDots
              poems={poems}
              currentIndex={currentIndex}
              masteredPoems={masteredPoems}
              notMasteredPoems={notMasteredPoems}
              onJumpTo={onJumpTo}
            />
            <div className="flex gap-4 text-sm ml-auto">
              <span className="text-red-500">错误：{errorCount}</span>
              <span className="text-green-500">正确：{correctCount}</span>
              <span className="text-muted-foreground">正确率：{accuracy}%</span>
            </div>
          </>
        )}

        {/* 学习模式 */}
        {mode === "learn" && poems.length > 0 && (
          <>
            <NavButton onClick={onPrev} direction="prev" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {poems.length}
            </span>
            <NavButton onClick={onNext} direction="next" />
            {fasciculeList.length > 0 && (
              <Select value={selectedFascicule} onValueChange={(v) => v && onFasciculeChange(v)}>
                <SelectTrigger className="w-32 h-7 text-sm">
                  <SelectValue>
                    {fasciculeList.find(f => f._id === selectedFascicule)?.fascicule_name || selectedFascicule}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fasciculeList.map((fasc) => (
                    <SelectItem key={fasc._id} value={fasc._id}>
                      {fasc.fascicule_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <CheckInBlocks
              poems={poems}
              currentIndex={currentIndex}
              checkedPoemIds={checkedPoemIds}
              onJumpTo={onJumpTo}
            />
            <CheckInButton
              count={todayCheckInCount}
              onClick={onCheckInRecordsClick}
            />
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

          {/* 背诵模式 */}
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

          {/* 学习模式 */}
          {mode === "learn" && poems.length > 0 && (
            <>
              <NavButton onClick={onPrev} direction="prev" />
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {poems.length}
              </span>
              <NavButton onClick={onNext} direction="next" />
              <div className="flex-1" />
              <CheckInButton
                count={todayCheckInCount}
                onClick={onCheckInRecordsClick}
              />
            </>
          )}

          {poems.length === 0 && (
            <div className="text-lg font-medium">0 / 0</div>
          )}
        </div>

        {/* 移动端方块组单独一行 */}
        {mode === "learn" && poems.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pb-2">
            {fasciculeList.length > 0 && (
              <Select value={selectedFascicule} onValueChange={(v) => v && onFasciculeChange(v)}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue>
                    {fasciculeList.find(f => f._id === selectedFascicule)?.fascicule_name || selectedFascicule}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fasciculeList.map((fasc) => (
                    <SelectItem key={fasc._id} value={fasc._id}>
                      {fasc.fascicule_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 移动端背诵模式状态点 */}
        {mode === "recite" && poems.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {poems[currentIndex]?.grade}
            </span>
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
                    className={`w-4 h-4 rounded cursor-pointer ${color} transition-colors ${isCurrent ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"}`}
                    onClick={() => onJumpTo(idx)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
