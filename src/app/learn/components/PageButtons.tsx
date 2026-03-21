/** 移动端浮动按钮 */
export function MobileButtons({
  allCompleted,
  onReset,
  onContinue,
  onEarlyEnd,
  mode,
  showEarlyEnd,
  onSidebarToggle,
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  onEarlyEnd: () => void;
  mode: string;
  showEarlyEnd: boolean;
  onSidebarToggle: () => void;
}) {
  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={onSidebarToggle}
        className="md:hidden fixed bottom-20 left-4 z-50 p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* 重新开始/继续学习 */}
      <div className="md:hidden fixed bottom-20 right-4 z-30 flex gap-2">
        <button
          onClick={onReset}
          className="p-2 bg-gray-500/80 text-white rounded-full shadow-lg text-sm"
        >
          重新开始
        </button>
        {showEarlyEnd && (
          <button
            onClick={onEarlyEnd}
            className="p-2 bg-orange-500/80 text-white rounded-full shadow-lg text-sm"
          >
            提前结束
          </button>
        )}
        {allCompleted && (
          <button
            onClick={onContinue}
            className="p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg text-sm"
          >
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
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  onEarlyEnd: () => void;
  mode: string;
  showEarlyEnd: boolean;
}) {
  return (
    <div className="hidden md:flex absolute bottom-8 right-8 gap-2 z-10">
      <button
        onClick={onReset}
        className="px-4 py-2 bg-gray-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-gray-600 transition-colors cursor-pointer"
      >
        重新开始
      </button>
      {showEarlyEnd && (
        <button
          onClick={onEarlyEnd}
          className="px-4 py-2 bg-orange-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-orange-600 transition-colors cursor-pointer"
        >
          提前结束
        </button>
      )}
      {allCompleted && (
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-lg text-sm hover:bg-primary transition-colors cursor-pointer"
        >
          {mode === "learn" ? "继续学习" : "继续背诵"}
        </button>
      )}
    </div>
  );
}
