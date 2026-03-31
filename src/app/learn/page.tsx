"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { PanelLeftOpen } from "lucide-react";
import { getAllFromDB, getFromDB, setToDB, STORES, updateLearningProgress, addReciteDetail, addReciteSummary } from "@/lib/db";
import { useUserStore } from "@/lib/api/user-store";
import { LocalDataManager } from "@/components/local-data-manager";
import { CheckInRecordsDialog } from "@/components/check-in-records-dialog";
import { ReciteRecordsDialog } from "@/components/recite-records-dialog";
import {
  Sidebar,
  StatusBar,
  LearnCard,
  ReciteCard,
  PoemDetailDialog,
  ResultDialog,
} from "@/components/learn";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CatalogItem,
  CatalogDetail,
  PoemDetail,
  PinyinData,
} from "@/types/poem";
import { Badge } from "@/components/ui/badge";
import { CheckCheck } from "lucide-react";
import { MobileButtons, PcButtons } from "./components/PageButtons";

/** 页面主组件 */
export default function LearnPage() {
  const { currentUser, initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // ==================== 状态定义 ====================
  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [catalogDetail, setCatalogDetail] = useState<CatalogDetail | null>(
    null,
  );
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
  const [notMasteredPoems, setNotMasteredPoems] = useState<Set<string>>(
    new Set(),
  );
  const [showResult, setShowResult] = useState(false);

  // 模式
  const [mode, setMode] = useState<"recite" | "learn">("learn");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [localDataOpen, setLocalDataOpen] = useState(false);
  const [checkInRecordsOpen, setCheckInRecordsOpen] = useState(false);
  const [reciteRecordsOpen, setReciteRecordsOpen] = useState(false);

  // 详情弹窗
  const [selectedPoem, setSelectedPoem] = useState<PoemDetail | null>(null);
  const [currentPoemDetail, setCurrentPoemDetail] = useState<PoemDetail | null>(
    null,
  );
  const [pinyinData, setPinyinData] = useState<PinyinData | null>(null);

  // 随机字符索引
  const [randomIndices, setRandomIndices] = useState<number[]>([]);

  // 当天打卡记录
  const [todayCheckedPoemIds, setTodayCheckedPoemIds] = useState<Set<number>>(
    new Set(),
  );

  // 背诵记录（从 IndexedDB 加载）
  const [dbMasteredPoems, setDbMasteredPoems] = useState<Set<string>>(new Set());
  const [dbNotMasteredPoems, setDbNotMasteredPoems] = useState<Set<string>>(new Set());

  const loadDbReciteRecords = useCallback(async () => {
    if (!currentUser?.user_id) {
      setDbMasteredPoems(new Set());
      setDbNotMasteredPoems(new Set());
      return;
    }
    const details = await getAllFromDB<{
      user_id: number;
      poem_id: string;
      status: boolean;
    }>(STORES.RECITE_DETAIL);
    const mastered = new Set<string>();
    const notMastered = new Set<string>();
    details.forEach((d) => {
      if (d.user_id === currentUser.user_id) {
        if (d.status) {
          mastered.add(d.poem_id);
        } else {
          notMastered.add(d.poem_id);
        }
      }
    });
    setDbMasteredPoems(mastered);
    setDbNotMasteredPoems(notMastered);
  }, [currentUser]);

  const loadTodayCheckInData = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allRecords = await getAllFromDB<{
      poem_id: number;
      check_in_time: string;
    }>(STORES.POEM_STUDY);
    const todayChecked = new Set<number>();

    allRecords.forEach((record) => {
      const checkDate = new Date(record.check_in_time);
      checkDate.setHours(0, 0, 0, 0);
      if (
        checkDate.getTime() >= today.getTime() &&
        checkDate.getTime() < tomorrow.getTime() &&
        record.poem_id
      ) {
        todayChecked.add(record.poem_id);
      }
    });

    setTodayCheckedPoemIds(todayChecked);
  }, []);

  // ==================== 诗词列表 ====================
  const poems = useMemo(() => {
    if (!selectedFascicule || !catalogDetail?.fasciculeList) return [];

    const fascData = catalogDetail.fasciculeList.find(
      (f) => f._id === selectedFascicule,
    );
    if (!fascData?.doc_list) return [];

    return fascData.doc_list.map((poem) => ({
      targetId: poem.target_id,
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      grade: fascData.fascicule_name,
    }));
  }, [catalogDetail, selectedFascicule]);

  // ==================== 数据获取 ====================
  const fetchCatalogDetail = useCallback((catalogId: string) => {
    fetch(
      `https://api.xuegushi.com/api/catalog/detail?platform=web&catalog_id=${catalogId}`,
    )
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
    fetch(
      "https://api.xuegushi.com/api/catalog/list?platform=web&page=1&size=100",
    )
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

  // 加载当天打卡数据
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTodayCheckInData();
  }, [loadTodayCheckInData, selectedFascicule]);

  // 加载背诵记录（从 IndexedDB）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDbReciteRecords();
  }, [loadDbReciteRecords]);

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
        const res = await fetch(
          `https://api.xuegushi.com/api/poem/${targetId}?platform=web`,
        );
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
        const res = await fetch(
          `https://api.xuegushi.com/api/pinyin/poem?platform=web&poem_id=${poemId}`,
        );
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
  
  // 初始化：仅在首次渲染时尝试应用 URL 中的 mode，后续由用户控制
  const urlModeSynced = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || urlModeSynced.current) return;
    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get("mode");
      if ((param === "recite" || param === "learn")) {
        // 仅在首次同步时应用
        setMode(param);
      }
    } catch {
      // ignore
    } finally {
      urlModeSynced.current = true;
    }
  }, []);

  // ==================== 事件处理 ====================
  const [skippedCount, setSkippedCount] = useState(0);

  const resetProgress = useCallback((keepMasteredState = false) => {
    setCurrentIndex(0);
    setErrorCount(0);
    setCorrectCount(0);
    setSkippedCount(0);
    if (!keepMasteredState) {
      setMasteredPoems(new Set());
      setNotMasteredPoems(new Set());
    }
    setShowResult(false);
  }, []);

  const handleSystemChange = useCallback(
    (catalogId: string | null) => {
      if (!catalogId) return;
      setSystem(catalogId);
      resetProgress();
      const selected = catalogList.find((c) => c.catalog === catalogId);
      if (selected) fetchCatalogDetail(selected._id);
    },
    [catalogList, resetProgress, fetchCatalogDetail],
  );

  const handleContinueLearning = () => {
    if (!catalogDetail?.fasciculeList || !selectedFascicule) {
      setShowResult(false);
      resetProgress();
      return;
    }

    const idx = catalogDetail.fasciculeList.findIndex(
      (f) => f._id === selectedFascicule,
    );
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

  const handleNotMastered = useCallback(
    (key: string) => {
      const isAllDone =
        masteredPoems.size + notMasteredPoems.size + 1 >= poems.length;
      setNotMasteredPoems((prev) => new Set(prev).add(key));
      setDbNotMasteredPoems((prev) => new Set(prev).add(key));
      setErrorCount((prev) => prev + 1);

      const user = currentUser;
      const poem = poems[currentIndex];
      const poemId = poem?.targetId?.toString();
      if (user?.user_id && poemId) {
        updateLearningProgress(user.user_id.toString(), poemId, false);
        addReciteDetail({
          user_id: user.user_id,
          user_name: user.user_name,
          poem_id: poemId,
          title: poem.title,
          author: poem.author,
          dynasty: poem.dynasty,
          status: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (isAllDone) {
        const user = currentUser;
        if (user?.user_id) {
          const poemIds = poems.map((p) => ({
            poem_id: p.targetId.toString(),
            title: p.title,
            status: masteredPoems.has(p.targetId.toString()),
          }));
          addReciteSummary({
            user_id: user.user_id,
            user_name: user.user_name,
            poem_ids: poemIds,
            pass_count: masteredPoems.size,
            unpass_count: notMasteredPoems.size + 1,
            skip_count: 0,
            createdAt: new Date().toISOString(),
          });
        }
        setShowResult(true);
      } else {
        setTimeout(() => nextPoem(), 100);
      }
    },
    [
      masteredPoems.size,
      notMasteredPoems.size,
      poems.length,
      nextPoem,
      currentIndex,
      poems,
    ],
  );

  const handleMastered = useCallback(
    (key: string) => {
      const isAllDone =
        masteredPoems.size + notMasteredPoems.size + 1 >= poems.length;
      setMasteredPoems((prev) => new Set(prev).add(key));
      setDbMasteredPoems((prev) => new Set(prev).add(key));
      setCorrectCount((prev) => prev + 1);

      const user = currentUser;
      const poem = poems[currentIndex];
      const poemId = poem?.targetId?.toString();
      if (user?.user_id && poemId) {
        updateLearningProgress(user.user_id.toString(), poemId, true);
        addReciteDetail({
          user_id: user.user_id,
          user_name: user.user_name,
          poem_id: poemId,
          title: poem.title,
          author: poem.author,
          dynasty: poem.dynasty,
          status: true,
          createdAt: new Date().toISOString(),
        });
      }

      if (isAllDone) {
        const user = currentUser;
        if (user?.user_id) {
          const poemIds = poems.map((p) => ({
            poem_id: p.targetId.toString(),
            title: p.title,
            status:
              masteredPoems.has(p.targetId.toString()) ||
              notMasteredPoems.has(p.targetId.toString())
                ? masteredPoems.has(p.targetId.toString())
                : false,
          }));
          addReciteSummary({
            user_id: user.user_id,
            user_name: user.user_name,
            poem_ids: poemIds,
            pass_count: masteredPoems.size + 1,
            unpass_count: notMasteredPoems.size,
            skip_count: 0,
            createdAt: new Date().toISOString(),
          });
        }
        setShowResult(true);
      } else {
        setTimeout(() => nextPoem(), 100);
      }
    },
    [
      masteredPoems.size,
      notMasteredPoems.size,
      poems.length,
      nextPoem,
      currentIndex,
      poems,
    ],
  );

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

  const accuracy =
    errorCount + correctCount > 0
      ? Math.round((correctCount / (errorCount + correctCount)) * 100)
      : 0;

  const allCompleted =
    poems.length > 0 &&
    masteredPoems.size + notMasteredPoems.size === poems.length;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] md:h-[calc(100vh-64px-48px)] transition-all duration-300">
      {/* 侧边栏 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        catalogList={catalogList}
        catalogDetail={catalogDetail}
        system={system}
        selectedFascicule={selectedFascicule}
        onSystemChange={handleSystemChange}
        onFasciculeChange={(id) => id && setSelectedFascicule(id)}
        onLocalDataClick={() => setLocalDataOpen(true)}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
      />

      {/* PC端侧边栏收起按钮 */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:flex fixed left-0 top-1/2 z-40 p-2 bg-primary/80 text-primary-foreground rounded-r-lg shadow-lg cursor-pointer"
          title="展开侧边栏">
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      {/* 本地数据管理弹窗 */}
      <LocalDataManager open={localDataOpen} onOpenChange={setLocalDataOpen} />

      {/* 打卡记录弹窗 */}
      <CheckInRecordsDialog
        open={checkInRecordsOpen}
        onOpenChange={(open) => {
          setCheckInRecordsOpen(open);
          if (open === false) {
            loadTodayCheckInData();
          }
        }}
      />

      {/* 背诵记录弹窗 */}
      <ReciteRecordsDialog
        open={reciteRecordsOpen}
        onOpenChange={setReciteRecordsOpen}
      />

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
            // PC端：切换侧边栏折叠状态
            // 移动端：切换侧边栏显示/隐藏
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }}
          onCheckInRecordsClick={() => setCheckInRecordsOpen(true)}
          checkedPoemIds={todayCheckedPoemIds}
          selectedFascicule={selectedFascicule}
          fasciculeList={catalogDetail?.fasciculeList || []}
          onFasciculeChange={(fasciculeId) => {
            setSelectedFascicule(fasciculeId);
            setCurrentIndex(0);
          }}
        />

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden min-h-0 relative flex">
          {/* 左侧诗词列表 */}
          {poems.length > 0 && (
            <div className="hidden sm:block w-46 border-r bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {poems.map((poem, idx) => {
                    const key = poem.targetId.toString();
                    const isMastered = dbMasteredPoems.has(key);
                    const isNotMastered = dbNotMasteredPoems.has(key);
                    const isCheckedInToday = todayCheckedPoemIds.has(poem.targetId);
                    return (
                      <div
                        key={poem.targetId}
                        onClick={() => setCurrentIndex(idx)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors relative ${
                          idx === currentIndex
                            ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}>
                        {mode === "recite" ? (
                          isMastered || isNotMastered ? (
                            <Badge
                              className={`absolute -top-1 -right-1 h-4 px-1 text-[10px] ${
                                isMastered
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                              }`}>
                              {isMastered ? "掌握" : "未掌握"}
                            </Badge>
                          ) : null
                        ) : isCheckedInToday ? (
                          <Badge className="absolute -top-1 -right-1 h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                            <CheckCheck className="h-3 w-3 mr-0.5" />
                          </Badge>
                        ) : null}
                        <div className="font-medium text-xs truncate pr-4">
                          {poem.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {poem.author} [{poem.dynasty}]
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 右侧主内容 */}
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
                onCheckInSuccess={loadTodayCheckInData}
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
                onViewDetail={() =>
                  setSelectedPoem(currentPoemDetail as unknown as PoemDetail)
                }
                onRandomHint={handleRandomHint}
                onShowFirstCharChange={setShowFirstChar}
                onShowLastCharChange={setShowLastChar}
                onShowRandomCharChange={setShowRandomChar}
                targetId={poems[currentIndex]?.targetId || 0}
              />
            )}

            {/* 移动端按钮 */}
            <MobileButtons
              allCompleted={allCompleted}
              onReset={() => resetProgress(mode === "recite")}
              onContinue={handleContinueLearning}
              mode={mode}
              showReset={false}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
              onReciteRecordsClick={
                mode === "recite" ? () => setReciteRecordsOpen(true) : undefined
              }
              masteredCount={dbMasteredPoems.size}
            />

            {/* PC端按钮 */}
            <PcButtons
              allCompleted={allCompleted}
              onReset={() => resetProgress(mode === "recite")}
              onContinue={handleContinueLearning}
              mode={mode}
              showReset={false}
              onReciteRecordsClick={
                mode === "recite" ? () => setReciteRecordsOpen(true) : undefined
              }
              masteredCount={dbMasteredPoems.size}
            />
          </div>
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
        skippedCount={skippedCount}
        onRestart={() => {
          setShowResult(false);
          setMasteredPoems(new Set());
          setNotMasteredPoems(new Set());
          setCorrectCount(0);
          setErrorCount(0);
          setSkippedCount(0);
          setCurrentIndex(0);
        }}
        onContinue={handleContinueLearning}
        mode={mode}
      />
    </div>
  );
}
