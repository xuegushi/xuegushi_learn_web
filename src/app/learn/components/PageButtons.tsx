import { Badge } from "@/components/ui/badge";

/** 移动端浮动按钮 */
export function MobileButtons({
  allCompleted,
  onReset,
  onContinue,
  onEarlyEnd,
  mode,
  showEarlyEnd,
  showReset = true,
  onSidebarToggle,
  onReciteRecordsClick,
  masteredCount = 0,
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  onEarlyEnd: () => void;
  mode: string;
  showEarlyEnd: boolean;
  showReset?: boolean;
  onSidebarToggle: () => void;
  onReciteRecordsClick?: () => void;
  masteredCount?: number;
}) {
  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={onSidebarToggle}
        className="md:hidden fixed bottom-4 sm:bottom-14 left-4 z-50 p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 重新开始/继续学习 */}
      <div className="md:hidden fixed items-center bottom-4 sm:bottom-14 right-4 z-30 flex gap-2">
        <div className="flex-1">
          {onReciteRecordsClick && (
            <button
              onClick={onReciteRecordsClick}
              className="p-2 bg-blue-500/80 text-white rounded-full shadow-lg text-sm relative">
              背诵记录
              {masteredCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 px-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px]">
                  {masteredCount}
                </Badge>
              )}
            </button>
          )}
        </div>

        {showReset && (
          <button
            onClick={onReset}
            className="p-2 bg-gray-500/80 text-white rounded-full shadow-lg text-sm">
            重新开始
          </button>
        )}
        {showEarlyEnd && (
          <button
            onClick={onEarlyEnd}
            className="p-2 bg-orange-500/80 text-white rounded-full shadow-lg text-sm">
            提前结束
          </button>
        )}
        {allCompleted && (
          <button
            onClick={onContinue}
            className="p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg text-sm">
            {mode === "learn" ? "继续学习" : "继续背诵"}
          </button>
        )}
      </div>
    </>
  );
}

/** PC端固定按钮 */
export function PcButtons({
  allCompleted,
  onReset,
  onContinue,
  onEarlyEnd,
  mode,
  showEarlyEnd,
  showReset = true,
  onReciteRecordsClick,
  masteredCount = 0,
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  onEarlyEnd: () => void;
  mode: string;
  showEarlyEnd: boolean;
  showReset?: boolean;
  onReciteRecordsClick?: () => void;
  masteredCount?: number;
}) {
  return (
    <div className="hidden md:flex left-8 absolute bottom-4 right-8 gap-2 z-10">
      <div className="flex-1">
        {onReciteRecordsClick && (
          <button
            onClick={onReciteRecordsClick}
            className="px-4 py-2 bg-blue-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-blue-600 transition-colors cursor-pointer relative">
            背诵记录
            {masteredCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 px-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs">
                {masteredCount}
              </Badge>
            )}
          </button>
        )}
      </div>
      {showReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-gray-600 transition-colors cursor-pointer">
          重新开始
        </button>
      )}
      {showEarlyEnd && (
        <button
          onClick={onEarlyEnd}
          className="px-4 py-2 bg-orange-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-orange-600 transition-colors cursor-pointer">
          提前结束
        </button>
      )}
      {allCompleted && (
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-lg text-sm hover:bg-primary transition-colors cursor-pointer">
          {mode === "learn" ? "继续学习" : "继续背诵"}
        </button>
      )}
    </div>
  );
}
