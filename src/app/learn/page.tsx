"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { PanelLeftOpen } from "lucide-react";
import { getFromDB, setToDB, STORES } from "@/lib/db";
import { LocalDataManager } from "@/components/local-data-manager";
import { Sidebar, StatusBar, LearnCard, ReciteCard, PoemDetailDialog, ResultDialog } from "@/components/learn";
import { CatalogItem, CatalogDetail, PoemDetail, PinyinData } from "@/types/poem";
import { MobileButtons, PcButtons } from "./components/PageButtons";

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
  const [localDataOpen, setLocalDataOpen] = useState(false);

  // 详情弹窗
  const [selectedPoem, setSelectedPoem] = useState<PoemDetail | null>(null);
  const [currentPoemDetail, setCurrentPoemDetail] = useState<PoemDetail | null>(null);
  const [pinyinData, setPinyinData] = useState<PinyinData | null>(null);

  // 随机字符索引
  const [randomIndices, setRandomIndices] = useState<number[]>([]);

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
        const currentPoem = poems[currentIndex];
        await setToDB(STORES.PINYIN, {
          poem_id: poemId,
          ...data,
          title_cn: currentPoem?.title || "",
          author: currentPoem?.author || "",
          dynasty: currentPoem?.dynasty || "",
        });
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

  const handleSystemChange = useCallback((catalogId: string | null) => {
    if (!catalogId) return;
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

  // 生成随机索引
  const generateRandomIndices = useCallback(() => {
    if (!currentPoemDetail?.poem?.content?.content) return [];
    return currentPoemDetail.poem.content.content.map((line) => {
      const chars = line.split("").filter((c) => !/[，。？！、]/.test(c));
      return chars.length > 0 ? Math.floor(Math.random() * chars.length) : -1;
    });
  }, [currentPoemDetail]);

  // 随机提示按钮
  const handleRandomHint = useCallback(() => {
    setShowRandomChar(true);
    setShowFirstChar(false);
    setShowLastChar(false);
    setRandomIndices(generateRandomIndices());
  }, [generateRandomIndices]);

  // 诗词变化时生成随机索引
  useEffect(() => {
    if (showRandomChar && currentPoemDetail?.poem?.content?.content) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRandomIndices(generateRandomIndices());
    }
  }, [showRandomChar, currentIndex, currentPoemDetail, generateRandomIndices]);

  // ==================== 渲染 ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const accuracy = errorCount + correctCount > 0
    ? Math.round((correctCount / (errorCount + correctCount)) * 100)
    : 0;

  const allCompleted = poems.length > 0 && masteredPoems.size + notMasteredPoems.size === poems.length;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px-40px)] md:h-[calc(100vh-64px-48px)]">

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
        onFasciculeChange={(id) => id && setSelectedFascicule(id)}
        onShowFirstCharChange={setShowFirstChar}
        onShowLastCharChange={setShowLastChar}
        onShowRandomCharChange={setShowRandomChar}
        onLocalDataClick={() => setLocalDataOpen(true)}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
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
          onToggleSidebar={() => {
            // 切换侧边栏显示/隐藏
            setSidebarOpen(!sidebarOpen);
          }}
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
              randomIndices={randomIndices}
              masteredPoems={masteredPoems}
              notMasteredPoems={notMasteredPoems}
              onMastered={handleMastered}
              onNotMastered={handleNotMastered}
              onSkip={nextPoem}
              onViewDetail={() => setSelectedPoem(currentPoemDetail as unknown as PoemDetail)}
              onRandomHint={handleRandomHint}
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
        mode={mode}
      />
    </div>
  );
}
