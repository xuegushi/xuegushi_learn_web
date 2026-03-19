"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import grade01Data63 from "@/data/data_63/grade_01.json";
import grade02Data63 from "@/data/data_63/grade_02.json";
import grade03Data63 from "@/data/data_63/grade_03.json";
import grade04Data63 from "@/data/data_63/grade_04.json";
import grade05Data63 from "@/data/data_63/grade_05.json";
import grade06Data63 from "@/data/data_63/grade_06.json";
import grade07Data63 from "@/data/data_63/grade_07.json";
import grade08Data63 from "@/data/data_63/grade_08.json";
import grade09Data63 from "@/data/data_63/grade_09.json";
import grade01Data54 from "@/data/data_54/grade_01.json";
import grade02Data54 from "@/data/data_54/grade_02.json";
import grade03Data54 from "@/data/data_54/grade_03.json";
import grade04Data54 from "@/data/data_54/grade_04.json";
import grade05Data54 from "@/data/data_54/grade_05.json";
import grade06Data54 from "@/data/data_54/grade_06.json";
import grade07Data54 from "@/data/data_54/grade_07.json";
import grade08Data54 from "@/data/data_54/grade_08.json";
import grade09Data54 from "@/data/data_54/grade_09.json";

interface PoemDetail {
  标题: string;
  作者: string;
  朝代: string;
  拼音?: string[];
  原文?: string[];
  译文?: string;
  创作背景?: string;
  赏析?: string;
  注释?: string[];
}

interface GradeData {
  年级: string;
  册次: {
    册: string;
    古诗词: PoemDetail[];
  }[];
}

const data63Grades = [
  grade01Data63,
  grade02Data63,
  grade03Data63,
  grade04Data63,
  grade05Data63,
  grade06Data63,
  grade07Data63,
  grade08Data63,
  grade09Data63,
] as GradeData[];

const data54Grades = [
  grade01Data54,
  grade02Data54,
  grade03Data54,
  grade04Data54,
  grade05Data54,
  grade06Data54,
  grade07Data54,
  grade08Data54,
  grade09Data54,
] as GradeData[];

const systems = [
  { id: "63", name: "六三学制", grades: data63Grades },
  { id: "54", name: "五四学制", grades: data54Grades },
];

const semesters = ["上册", "下册"];

export default function LearnPage() {
  const [system, setSystem] = useState("63");
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["一年级"]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([
    "上册",
    "下册",
  ]);
  const [showFirstChar, setShowFirstChar] = useState(false);
  const [showLastChar, setShowLastChar] = useState(false);
  const [showRandomChar, setShowRandomChar] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedPoem, setSelectedPoem] = useState<PoemDetail | null>(null);
  const [masteredPoems, setMasteredPoems] = useState<Set<string>>(new Set());
  const [notMasteredPoems, setNotMasteredPoems] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [mode, setMode] = useState<"recite" | "learn">("recite");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resetProgress = () => {
    setCurrentIndex(0);
    setErrorCount(0);
    setCorrectCount(0);
    setMasteredPoems(new Set());
    setNotMasteredPoems(new Set());
  };

  const handleContinueLearning = () => {
    const currentGrade = poems[currentIndex]?.grade;
    const currentSemester = poems[currentIndex]?.semester;

    if (!currentGrade || !currentSemester) {
      setShowResult(false);
      resetProgress();
      return;
    }

    const allGrades = currentSystem?.grades.map(g => g.年级) || [];
    const sortedGrades = [...allGrades].sort((a, b) => {
      const gradeA = parseInt(a.replace(/[^0-9]/g, ''));
      const gradeB = parseInt(b.replace(/[^0-9]/g, ''));
      return gradeA - gradeB;
    });
    const currentGradeIndex = sortedGrades.indexOf(currentGrade);

    const bothSemestersSelected = selectedSemesters.includes("上册") && selectedSemesters.includes("下册");

    if (bothSemestersSelected) {
      if (currentGradeIndex >= 0 && currentGradeIndex < sortedGrades.length - 1) {
        const nextGrade = sortedGrades[currentGradeIndex + 1];
        setSelectedGrades([nextGrade]);
        resetProgress();
      } else {
        setShowResult(false);
        resetProgress();
      }
    } else {
      if (currentSemester === "上册") {
        setSelectedGrades([currentGrade]);
        setSelectedSemesters(["下册"]);
        resetProgress();
      } else if (currentSemester === "下册") {
        if (currentGradeIndex >= 0 && currentGradeIndex < sortedGrades.length - 1) {
          const nextGrade = sortedGrades[currentGradeIndex + 1];
          setSelectedGrades([nextGrade]);
          resetProgress();
        } else {
          setShowResult(false);
          resetProgress();
        }
      }
    }
    setShowResult(false);
  };

  const currentSystem = systems.find((s) => s.id === system);

  const poems = useMemo(() => {
    const result: { data: PoemDetail; grade: string; semester: string }[] = [];
    currentSystem?.grades
      .filter((g) => selectedGrades.includes(g.年级))
      .forEach((g) => {
        g.册次
          .filter((s) => selectedSemesters.includes(s.册))
          .forEach((s) => {
            s.古诗词.forEach((poem) => {
              result.push({ data: poem, grade: g.年级, semester: s.册 });
            });
          });
      });
    return result;
  }, [currentSystem, selectedGrades, selectedSemesters]);

  const currentPoem = poems[currentIndex]?.data;

  const handleGradeToggle = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
    resetProgress();
  };

  const handleSelectAllGrades = () => {
    if (selectedGrades.length === currentSystem?.grades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(currentSystem?.grades.map((g) => g.年级) || []);
    }
    resetProgress();
  };

  const handleSemesterToggle = (semester: string) => {
    if (selectedSemesters.includes(semester)) {
      setSelectedSemesters(selectedSemesters.filter((s) => s !== semester));
    } else {
      setSelectedSemesters([...selectedSemesters, semester]);
    }
    resetProgress();
  };

  const handleSelectAllSemesters = () => {
    if (selectedSemesters.length === semesters.length) {
      setSelectedSemesters([]);
    } else {
      setSelectedSemesters([...semesters]);
    }
    resetProgress();
  };

  const handleNotMastered = (key: string) => {
    setNotMasteredPoems(prev => new Set(prev).add(key));
    setErrorCount(prev => prev + 1);
    checkCompletion();
    nextPoem();
  };

  const handleMastered = (key: string) => {
    setMasteredPoems(prev => new Set(prev).add(key));
    setCorrectCount(prev => prev + 1);
    checkCompletion();
    nextPoem();
  };

  const checkCompletion = () => {
    if (masteredPoems.size + notMasteredPoems.size + 1 >= poems.length) {
      setShowResult(true);
    }
  };

  const nextPoem = () => {
    if (currentIndex < poems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevPoem = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(poems.length - 1);
    }
  };

  const accuracy =
    correctCount + errorCount > 0
      ? Math.round((correctCount / (correctCount + errorCount)) * 100)
      : 0;

  const allCompleted = poems.length > 0 && masteredPoems.size + notMasteredPoems.size === poems.length;

  const renderPinyinWithText = (original?: string[], pinyin?: string[]) => {
    if (!original || !pinyin || original.length === 0 || pinyin.length === 0) {
      return null;
    }

    // 如果拼音数组比原文数组长，去掉第一条数据
    let processedPinyin = pinyin;
    if (pinyin.length > original.length) {
      processedPinyin = pinyin.slice(1);
    }
    
    return original.map((line, lineIdx) => {
      const chars = line.split('');
      const pinyinLine = processedPinyin[lineIdx] || '';
      // 将拼音按汉字和标点符号位置拆分，保留每个位置的拼音或标点
      const pinyinChars = pinyinLine.split(/(，|。|？|！|、|\s+)/).filter(item => item && item.trim());
      
      return (
        <div key={lineIdx} className="flex justify-center gap-1 mb-2 flex-wrap">
          {chars.map((char, charIdx) => (
            <div key={charIdx} className="flex flex-col items-center min-w-[1.5rem]">
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {pinyinChars[charIdx] || ''}
              </span>
              <span className="text-lg">{char}</span>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px-40px)] md:h-[calc(100vh-64px-48px)]">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-20 left-4 z-50 p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex gap-2">
        <button
          onClick={resetProgress}
          className="p-2 bg-gray-500/80 text-white rounded-full shadow-lg text-sm"
        >
          重新开始
        </button>
        {allCompleted && (
          <button
            onClick={handleContinueLearning}
            className="p-2 bg-primary/80 text-primary-foreground rounded-full shadow-lg text-sm"
          >
            {mode === "learn" ? "继续学习" : "继续背诵"}
          </button>
        )}
      </div>
      
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-72 border-r bg-gray-50 dark:bg-gray-800 overflow-y-auto transition-transform duration-300 h-full`}>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="font-semibold text-lg">筛选</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            <h2 className="font-semibold mb-3">模式</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("recite")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                  mode === "recite"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}>
                背诵模式
              </button>
              <button
                onClick={() => setMode("learn")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                  mode === "learn"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}>
                学习模式
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">学段</h2>
            <div className="grid grid-cols-2 gap-2">
              {systems.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSystem(s.id);
                    setSelectedGrades(["一年级"]);
                    setSelectedSemesters(["上册", "下册"]);
                    resetProgress();
                  }}
                  className={`py-1 px-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                    system === s.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">年级</h2>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-primary">
                <Checkbox
                  checked={
                    selectedGrades.length === currentSystem?.grades.length &&
                    (currentSystem?.grades.length || 0) > 0
                  }
                  onCheckedChange={handleSelectAllGrades}
                />
                全选
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currentSystem?.grades.map((g) => (
                <label
                  key={g.年级}
                  className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedGrades.includes(g.年级)}
                    onCheckedChange={() => handleGradeToggle(g.年级)}
                  />
                  {g.年级}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">学期</h2>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-primary">
                <Checkbox
                  checked={selectedSemesters.length === semesters.length}
                  onCheckedChange={handleSelectAllSemesters}
                />
                全选
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {semesters.map((semester) => (
                <label
                  key={semester}
                  className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedSemesters.includes(semester)}
                    onCheckedChange={() => handleSemesterToggle(semester)}
                  />
                  {semester}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">背诵设置</h2>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showRandomChar && !showFirstChar && !showLastChar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'}`}>
                <input
                  type="radio"
                  name="reciteSetting"
                  checked={showRandomChar && !showFirstChar && !showLastChar}
                  onChange={() => {
                    setShowRandomChar(true);
                    setShowFirstChar(false);
                    setShowLastChar(false);
                  }}
                  className="w-3 h-3"
                />
                随机显示
              </label>
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showFirstChar && !showLastChar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'}`}>
                <input
                  type="radio"
                  name="reciteSetting"
                  checked={showFirstChar && !showLastChar}
                  onChange={() => {
                    setShowFirstChar(true);
                    setShowLastChar(false);
                    setShowRandomChar(false);
                  }}
                  className="w-3 h-3"
                />
                显示首字
              </label>
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showLastChar && !showFirstChar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'}`}>
                <input
                  type="radio"
                  name="reciteSetting"
                  checked={showLastChar && !showFirstChar}
                  onChange={() => {
                    setShowLastChar(true);
                    setShowFirstChar(false);
                    setShowRandomChar(false);
                  }}
                  className="w-3 h-3"
                />
                显示尾字
              </label>
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${!showFirstChar && !showLastChar && !showRandomChar ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'}`}>
                <input
                  type="radio"
                  name="reciteSetting"
                  checked={!showFirstChar && !showLastChar && !showRandomChar}
                  onChange={() => {
                    setShowFirstChar(false);
                    setShowLastChar(false);
                    setShowRandomChar(false);
                  }}
                  className="w-3 h-3"
                />
                都不显示
              </label>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="border-b shadow-sm py-2 md:py-3 px-2 md:px-4 bg-background/50 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2">
            {mode === "recite" && poems.length > 0 ? (
              <>
                <button onClick={prevPoem} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {poems.length}
                </span>
                <button onClick={nextPoem} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex gap-2 md:gap-4 text-xs md:text-sm ml-auto">
                  <span className="text-red-500">错误：{errorCount}</span>
                  <span className="text-green-500">正确：{correctCount}</span>
                  <span className="text-muted-foreground">正确率：{accuracy}%</span>
                </div>
              </>
            ) : mode === "learn" && poems.length > 0 ? (
              <>
                <button onClick={prevPoem} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {poems.length}
                </span>
                <button onClick={nextPoem} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {poems[currentIndex]?.grade} · {poems[currentIndex]?.semester}
                </span>
              </>
            ) : (
              <div className="text-lg font-medium">
                {poems.length > 0
                  ? `${correctCount + errorCount} / ${poems.length}`
                  : "0 / 0"}
              </div>
            )}
          </div>
        </div>

        {mode === "recite" && poems.length > 0 && (
          <div className="hidden md:block border-b py-2 px-4 bg-background/30 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-1">
              {poems.map((_, idx) => {
                const key = `${poems[idx].grade}-${poems[idx].semester}-${idx}`;
                const isMastered = masteredPoems.has(key);
                const isNotMastered = notMasteredPoems.has(key);
                const color = isMastered ? 'bg-green-500' : isNotMastered ? 'bg-red-500' : 'bg-gray-300';
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded cursor-pointer ${color}`}
                    onClick={() => setCurrentIndex(idx)}
                  ></div>
                );
              })}
            </div>
          </div>
        )}

        {mode === "recite" && poems.length > 0 && (
          <div className="md:hidden border-b py-2 px-4 bg-background/30 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-1">
              {poems.map((_, idx) => {
                const key = `${poems[idx].grade}-${poems[idx].semester}-${idx}`;
                const isMastered = masteredPoems.has(key);
                const isNotMastered = notMasteredPoems.has(key);
                const color = isMastered ? 'bg-green-500' : isNotMastered ? 'bg-red-500' : 'bg-gray-300';
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded cursor-pointer ${color}`}
                    onClick={() => setCurrentIndex(idx)}
                  ></div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden min-h-0 relative">
          <div className="h-full">
            {poems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  请选择年级和学期
                </div>
              </div>
            ) : mode === "learn" ? (
              <div className="flex items-center justify-center h-full px-6 md:px-2 py-4">
                <Card className="shadow-lg w-full max-w-2xl max-h-[70vh] flex flex-col">
                  <CardContent className="p-4 md:p-6 py-3 flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
                      <div className="text-center space-y-2">
                        <div className="font-bold text-2xl">
                          {poems[currentIndex].data.标题}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {poems[currentIndex].data.作者} [{poems[currentIndex].data.朝代}]
                        </div>
                      </div>

                    {(poems[currentIndex].data.拼音 || poems[currentIndex].data.原文) && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        {renderPinyinWithText(
                          poems[currentIndex].data.原文,
                          poems[currentIndex].data.拼音
                        )}
                      </div>
                    )}

                    {poems[currentIndex].data.译文 && (
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <h3 className="font-semibold">译文</h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {poems[currentIndex].data.译文}
                        </p>
                      </div>
                    )}

                    {poems[currentIndex].data.注释 && poems[currentIndex].data.注释.length > 0 && (
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <h3 className="font-semibold">注释</h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                          {poems[currentIndex].data.注释.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {poems[currentIndex].data.创作背景 && (
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <h3 className="font-semibold">创作背景</h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {poems[currentIndex].data.创作背景}
                        </p>
                      </div>
                    )}

                    {poems[currentIndex].data.赏析 && (
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <h3 className="font-semibold">赏析</h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {poems[currentIndex].data.赏析}
                        </p>
                      </div>
                    )}

                    </div>
                    <div className="flex gap-4 pt-4 border-t flex-shrink-0">
                      <button
                        onClick={prevPoem}
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        上一首
                      </button>
                      <button
                        onClick={nextPoem}
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        下一首
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full px-6 md:px-2 py-4">
                <Card className="shadow-lg w-full max-w-2xl max-h-[70vh] flex flex-col relative overflow-visible">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
                    {currentIndex + 1}
                  </div>
                  <CardContent className="p-4 md:p-6 space-y-3 md:space-y-6 flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${(() => {
                            const key = `${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`;
                            if (masteredPoems.has(key)) return 'bg-green-500';
                            if (notMasteredPoems.has(key)) return 'bg-red-500';
                            return 'bg-gray-300';
                          })()}`}></div>
                        </div>
                        <button
                          onClick={() => setSelectedPoem(poems[currentIndex]?.data)}
                          className="text-sm text-blue-500 hover:underline cursor-pointer">
                          查看详情
                        </button>
                      </div>
                    <div className="text-center space-y-2">
                      <div className="font-bold text-2xl">
                        {poems[currentIndex]?.data.标题}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {poems[currentIndex]?.grade} · {poems[currentIndex]?.semester}
                      </div>
                      </div>

                      <div className="overflow-y-auto max-h-[calc(70vh-180px)] min-h-42">
                      <div className="text-center py-4">
                        {showFirstChar && poems[currentIndex]?.data.原文 && poems[currentIndex]?.data.原文.length > 0 && (
                          <div className="flex flex-col items-center mt-1">
                            {poems[currentIndex]?.data.原文.map((line: string, lineIdx: number) => {
                              const chars = line.split('');
                              return (
                                <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                  {chars.map((char, charIdx) => {
                                    const isFirstChar = charIdx === 0;
                                    const isPunct = /[，。？！、]/.test(char);
                                    return (
                                      <span key={charIdx} className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm">
                                        {isFirstChar ? char : (isPunct ? <span className="text-gray-400">{char}</span> : ' ')}
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {showLastChar && poems[currentIndex]?.data.原文 && poems[currentIndex]?.data.原文.length > 0 && (
                          <div className="flex flex-col items-center mt-1">
                            {poems[currentIndex]?.data.原文.map((line: string, lineIdx: number) => {
                              const chars = line.split('');
                              let lastCharIdx = chars.length - 1;
                              while (lastCharIdx >= 0 && /[，。？！、]/.test(chars[lastCharIdx])) {
                                lastCharIdx--;
                              }
                              return (
                                <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                  {chars.map((char, charIdx) => {
                                    const isLastChar = charIdx === lastCharIdx;
                                    const isPunct = /[，。？！、]/.test(char);
                                    return (
                                      <span key={charIdx} className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm">
                                        {isLastChar ? char : (isPunct ? <span className="text-gray-400">{char}</span> : ' ')}
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {!showFirstChar && !showLastChar && !showRandomChar && poems[currentIndex]?.data.原文 && poems[currentIndex]?.data.原文.length > 0 && (
                          <div className="flex flex-col items-center mt-1">
                            {poems[currentIndex]?.data.原文.map((line: string, lineIdx: number) => {
                              const chars = line.split('');
                              return (
                                <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                  {chars.map((char, charIdx) => {
                                    const isPunct = /[，。？！、]/.test(char);
                                    return (
                                      <span key={charIdx} className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm">
                                        {isPunct ? <span className="text-gray-400">{char}</span> : ' '}
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {showRandomChar && poems[currentIndex]?.data.原文 && poems[currentIndex]?.data.原文.length > 0 && (
                          <div className="flex flex-col items-center mt-1">
                            {poems[currentIndex]?.data.原文.map((line: string, lineIdx: number) => {
                              const chars = line.split('');
                              const chineseChars = chars.filter((c: string) => !/[，。？！、]/.test(c));
                              const randomIdx = chineseChars.length > 0 ? Math.floor(Math.random() * chineseChars.length) : -1;
                              let currentChineseIdx = 0;
                              return (
                                <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                  {chars.map((char, charIdx) => {
                                    const isPunct = /[，。？！、]/.test(char);
                                    const isRandomChar = !isPunct && currentChineseIdx++ === randomIdx;
                                    return (
                                      <span key={charIdx} className="inline-flex items-center justify-center w-7 h-7 border border-gray-300 rounded text-sm">
                                        {isRandomChar ? char : (isPunct ? <span className="text-gray-400">{char}</span> : ' ')}
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-2 flex-shrink-0">
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            const key = `${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`;
                            handleNotMastered(key);
                          }}
                          className="flex-1 py-3 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 cursor-pointer"
                          disabled={notMasteredPoems.has(`${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`) || masteredPoems.has(`${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`)}>
                          未掌握
                        </button>
                        <button
                          onClick={() => {
                            const key = `${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`;
                            handleMastered(key);
                          }}
                          className="flex-1 py-3 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer"
                          disabled={notMasteredPoems.has(`${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`) || masteredPoems.has(`${poems[currentIndex]?.grade}-${poems[currentIndex]?.semester}-${currentIndex}`)}>
                          掌握
                        </button>
                        <button
                          onClick={nextPoem}
                          className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                          跳过
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          <div className="hidden md:flex absolute bottom-8 right-8 gap-2 z-10">
            <button
              onClick={resetProgress}
              className="px-4 py-2 bg-gray-500/90 text-white rounded-lg shadow-lg text-sm hover:bg-gray-600 transition-colors">
              重新开始
            </button>
            {allCompleted && (
              <button
                onClick={handleContinueLearning}
                className="px-4 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-lg text-sm hover:bg-primary transition-colors">
                {mode === "learn" ? "继续学习" : "继续背诵"}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      <Dialog open={!!selectedPoem} onOpenChange={() => setSelectedPoem(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold px-3 border-b pb-2">
              {selectedPoem?.标题}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4 px-3">
            <div className="space-y-8">
              {selectedPoem && (
                <>
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold mb-3">
                      {selectedPoem.标题}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {selectedPoem.作者} [{selectedPoem.朝代}]
                    </div>
                  </div>

                  {(selectedPoem.拼音 || selectedPoem.原文) && (
                    <div className="pt-0">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        {selectedPoem.拼音 && selectedPoem.原文 ? (
                          renderPinyinWithText(
                            selectedPoem.原文,
                            selectedPoem.拼音,
                          )
                        ) : (
                          <pre className="whitespace-pre-wrap text-lg leading-loose">
                            {(selectedPoem.原文 || selectedPoem.拼音)?.join(
                              "\n",
                            )}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPoem.译文 && (
                    <div className="pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <h3 className="font-semibold text-base">译文</h3>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedPoem.译文}
                      </p>
                    </div>
                  )}

                  {selectedPoem.注释 && selectedPoem.注释.length > 0 && (
                    <div className="pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <h3 className="font-semibold text-base">注释</h3>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {selectedPoem.注释.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPoem.创作背景 && (
                    <div className="pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <h3 className="font-semibold text-base">创作背景</h3>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedPoem.创作背景}
                      </p>
                    </div>
                  )}

                  {selectedPoem.赏析 && (
                    <div className="pb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <h3 className="font-semibold text-base">赏析</h3>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedPoem.赏析}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult} onOpenChange={() => setShowResult(false)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center py-4">
              学习完成
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <div className="text-2xl">正确率：{accuracy}%</div>
            <div className="flex justify-center gap-8">
              <div className="text-green-600">正确：{correctCount}</div>
              <div className="text-red-600">错误：{errorCount}</div>
            </div>
            <div className="text-muted-foreground">
              共 {poems.length} 首诗词
            </div>
          </div>
          <div className="flex justify-center gap-4 pb-4">
            <button
              onClick={() => {
                setShowResult(false);
                setMasteredPoems(new Set());
                setNotMasteredPoems(new Set());
                setCorrectCount(0);
                setErrorCount(0);
                setCurrentIndex(0);
              }}
              className="px-6 py-2 border border-primary text-primary rounded hover:bg-primary/10">
              重新开始
            </button>
            <button
              onClick={handleContinueLearning}
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              继续学习
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
