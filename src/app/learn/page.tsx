"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getFromDB, setToDB, STORES } from "@/lib/db";
import { LocalDataManager } from "@/components/local-data-manager";
import { Sidebar, StatusBar, LearnCard, ReciteCard, PoemDetailDialog, ResultDialog } from "@/components/learn";
import { CatalogItem, CatalogDetail, PoemDetail, PinyinData } from "@/types/poem";

/** 页面主组件 */
export default function LearnPage() {
  // ==================== 状态定义 ====================
  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [catalogDetail, setCatalogDetail] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [system, setSystem] = useState("");
  const [selectedFascicule, setSelectedFascicule] = useState("");
  const [showFirstChar, setShowFirstChar] = useState(false);
  const [showLastChar, setShowLastChar] = useState(false);
  const [showRandomChar, setShowRandomChar] = useState(false);

  // 学习状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [masteredPoems, setMasteredPoems] = useState<Set<string>>(new Set());
  const [notMasteredPoems, setNotMasteredPoems] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  // 模式
  const [mode, setMode] = useState<"recite" | "learn">("recite");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [localDataOpen, setLocalDataOpen] = useState(false);

  // 详情弹窗
  const [selectedPoem, setSelectedPoem] = useState<PoemDetail | null>(null);
  const [currentPoemDetail, setCurrentPoemDetail] = useState<PoemDetail | null>(null);
  const [pinyinData, setPinyinData] = useState<PinyinData | null>(null);

  // ==================== 诗词列表 ====================
  const poems = useMemo(() => {
    if (!selectedFascicule || !catalogDetail?.fasciculeList) return [];

    const fascData = catalogDetail.fasciculeList.find((f) => f._id === selectedFascicule);
    if (!fascData?.doc_list) return [];

    return fascData.doc_list.map((poem) => ({
      targetId: poem.target_id,
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      grade: fascData.fascicule_name,
      semester: "",
    }));
  }, [catalogDetail, selectedFascicule]);

  // ==================== 数据获取 ====================
  const fetchCatalogDetail = useCallback((catalogId: string) => {
    fetch(`https://api.xuegushi.com/api/catalog/detail?platform=web&catalog_id=${catalogId}`)
      .then((res) => res.json())
      .then((data) => {
        setCatalogDetail(data);
        if (data.fasciculeList?.length > 0) {
          setSelectedFascicule(data.fasciculeList[0]._id);
          setCurrentIndex(0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://api.xuegushi.com/api/catalog/list?platform=web&page=1&size=100")
      .then((res) => res.json())
      .then((data) => {
        setCatalogList(data.list || []);
        if (data.list?.length > 0) {
          const first = data.list[0];
          setSystem(first.catalog);
          fetchCatalogDetail(first._id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchCatalogDetail]);

  // 获取诗词详情和拼音
  useEffect(() => {
    if (poems.length === 0 || currentIndex >= poems.length) return;

    const targetId = poems[currentIndex].targetId;

    const loadPoemDetail = async () => {
      // 先检查缓存
      const cached = await getFromDB<PoemDetail>(STORES.POEMS, targetId);
      if (cached) {
        setCurrentPoemDetail(cached);
        if (cached.poem?.id) loadPinyin(cached.poem.id);
        return;
      }

      // 请求API
      try {
        const res = await fetch(`https://api.xuegushi.com/api/poem/${targetId}?platform=web`);
        const data = await res.json();
        setCurrentPoemDetail(data);
        await setToDB(STORES.POEMS, { id: targetId, ...data });
        if (data.poem?.id) loadPinyin(data.poem.id);
      } catch {
        // 静默失败
      }
    };

    const loadPinyin = async (poemId: number) => {
      const cached = await getFromDB<PinyinData>(STORES.PINYIN, poemId);
      if (cached) {
        setPinyinData(cached);
        return;
      }

      try {
        const res = await fetch(`https://api.xuegushi.com/api/pinyin/poem?platform=web&poem_id=${poemId}`);
        const data = await res.json();
        setPinyinData(data);
        await setToDB(STORES.PINYIN, { poem_id: poemId, ...data });
      } catch {
        // 静默失败
      }
    };

    loadPoemDetail();
  }, [currentIndex, poems]);

  // ==================== 事件处理 ====================
  const resetProgress = useCallback(() => {
    setCurrentIndex(0);
    setErrorCount(0);
    setCorrectCount(0);
    setMasteredPoems(new Set());
    setNotMasteredPoems(new Set());
    setShowResult(false);
  }, []);

  const handleSystemChange = useCallback((catalogId: string) => {
    setSystem(catalogId);
    resetProgress();
    const selected = catalogList.find((c) => c.catalog === catalogId);
    if (selected) fetchCatalogDetail(selected._id);
  }, [catalogList, resetProgress, fetchCatalogDetail]);

  const handleContinueLearning = () => {
    if (!catalogDetail?.fasciculeList || !selectedFascicule) {
      setShowResult(false);
      resetProgress();
      return;
    }

    const idx = catalogDetail.fasciculeList.findIndex((f) => f._id === selectedFascicule);
    if (idx >= 0 && idx < catalogDetail.fasciculeList.length - 1) {
      setSelectedFascicule(catalogDetail.fasciculeList[idx + 1]._id);
      resetProgress();
    } else {
      setShowResult(false);
      resetProgress();
    }
  };

  const nextPoem = useCallback(() => {
    setCurrentIndex((prev) => (prev < poems.length - 1 ? prev + 1 : 0));
  }, [poems.length]);

  const prevPoem = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : poems.length - 1));
  }, [poems.length]);

  const handleNotMastered = useCallback((key: string) => {
    const isAllDone = masteredPoems.size + notMasteredPoems.size + 1 >= poems.length;
    setNotMasteredPoems((prev) => new Set(prev).add(key));
    setErrorCount((prev) => prev + 1);
    if (isAllDone) {
      setShowResult(true);
    } else {
      setTimeout(() => nextPoem(), 100);
    }
  }, [masteredPoems.size, notMasteredPoems.size, poems.length, nextPoem]);

  const handleMastered = useCallback((key: string) => {
    const isAllDone = masteredPoems.size + notMasteredPoems.size + 1 >= poems.length;
    setMasteredPoems((prev) => new Set(prev).add(key));
    setCorrectCount((prev) => prev + 1);
    if (isAllDone) {
      setShowResult(true);
    } else {
      setTimeout(() => nextPoem(), 100);
    }
  }, [masteredPoems.size, notMasteredPoems.size, poems.length, nextPoem]);

  const accuracy = errorCount + correctCount > 0
    ? Math.round((correctCount / (errorCount + correctCount)) * 100)
    : 0;

  const allCompleted = poems.length > 0 && masteredPoems.size + notMasteredPoems.size === poems.length;

  // ==================== 渲染 ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-[calc(100vh-56px-40px)] md:h-[calc(100vh-64px-48px)] ${sidebarCollapsed ? "md:w-full" : ""}`}>
      {/* 侧边栏收起时的展开按钮 */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:flex fixed left-0 top-1/2 z-40 p-2 bg-primary/80 text-primary-foreground rounded-r-lg shadow-lg cursor-pointer ml-0"
          title="展开侧边栏"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      {/* 侧边栏 */}
      <Sidebar
        catalogList={catalogList}
        catalogDetail={catalogDetail}
        system={system}
        selectedFascicule={selectedFascicule}
        showFirstChar={showFirstChar}
        showLastChar={showLastChar}
        showRandomChar={showRandomChar}
        onSystemChange={handleSystemChange}
        onFasciculeChange={setSelectedFascicule}
        onShowFirstCharChange={setShowFirstChar}
        onShowLastCharChange={setShowLastChar}
        onShowRandomCharChange={setShowRandomChar}
        onLocalDataClick={() => setLocalDataOpen(true)}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 本地数据管理弹窗 */}
      <LocalDataManager open={localDataOpen} onOpenChange={setLocalDataOpen} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* 顶部状态栏 */}
        <StatusBar
          poems={poems}
          currentIndex={currentIndex}
          mode={mode}
          errorCount={errorCount}
          correctCount={correctCount}
          masteredPoems={masteredPoems}
          notMasteredPoems={notMasteredPoems}
          onPrev={prevPoem}
          onNext={nextPoem}
          onJumpTo={setCurrentIndex}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden min-h-0 relative">
          {poems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">请选择分册</div>
            </div>
          ) : mode === "learn" ? (
            <LearnCard
              poemDetail={currentPoemDetail}
              pinyinData={pinyinData}
              currentIndex={currentIndex}
              onPrev={prevPoem}
              onNext={nextPoem}
            />
          ) : (
            <ReciteCard
              poemDetail={currentPoemDetail}
              currentIndex={currentIndex}
              showFirstChar={showFirstChar}
              showLastChar={showLastChar}
              showRandomChar={showRandomChar}
              masteredPoems={masteredPoems}
              notMasteredPoems={notMasteredPoems}
              onMastered={handleMastered}
              onNotMastered={handleNotMastered}
              onSkip={nextPoem}
              onViewDetail={() => setSelectedPoem(currentPoemDetail as unknown as PoemDetail)}
              targetId={poems[currentIndex]?.targetId || 0}
            />
          )}

          {/* 移动端按钮 */}
          <MobileButtons
            allCompleted={allCompleted}
            onReset={resetProgress}
            onContinue={handleContinueLearning}
            mode={mode}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* PC端按钮 */}
          <PcButtons
            allCompleted={allCompleted}
            onReset={resetProgress}
            onContinue={handleContinueLearning}
            mode={mode}
          />
        </div>
      </div>

      {/* 诗词详情弹窗 */}
      <PoemDetailDialog
        open={!!selectedPoem}
        onOpenChange={(open) => !open && setSelectedPoem(null)}
        poemDetail={currentPoemDetail}
        pinyinData={pinyinData}
      />

      {/* 结果弹窗 */}
      <ResultDialog
        open={showResult}
        onOpenChange={setShowResult}
        accuracy={accuracy}
        correctCount={correctCount}
        errorCount={errorCount}
        totalCount={poems.length}
        onRestart={() => {
          setShowResult(false);
          setMasteredPoems(new Set());
          setNotMasteredPoems(new Set());
          setCorrectCount(0);
          setErrorCount(0);
          setCurrentIndex(0);
        }}
        onContinue={handleContinueLearning}
      />
    </div>
  );
}

/** 移动端浮动按钮 */
function MobileButtons({
  allCompleted,
  onReset,
  onContinue,
  mode,
  onSidebarToggle,
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  mode: string;
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
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex gap-2">
        <button
          onClick={onReset}
          className="p-2 bg-gray-500/80 text-white rounded-full shadow-lg text-sm"
        >
          重新开始
        </button>
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
function PcButtons({
  allCompleted,
  onReset,
  onContinue,
  mode,
}: {
  allCompleted: boolean;
  onReset: () => void;
  onContinue: () => void;
  mode: string;
}) {
  return (
    <div className="hidden md:flex absolute bottom-8 right-8 gap-2 z-10">
      <button
        onClick={onReset}
        className="px-4 py-2 bg-gray-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-gray-600 transition-colors cursor-pointer"
      >
        重新开始
      </button>
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
