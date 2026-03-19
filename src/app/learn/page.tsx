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
  const [showRandomChar, setShowRandomChar] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedPoem, setSelectedPoem] = useState<PoemDetail | null>(null);
  const [masteredPoems, setMasteredPoems] = useState<Set<string>>(new Set());
  const [notMasteredPoems, setNotMasteredPoems] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [mode, setMode] = useState<"recite" | "learn">("recite");

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
    setCurrentIndex(0);
  };

  const handleSelectAllGrades = () => {
    if (selectedGrades.length === currentSystem?.grades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(currentSystem?.grades.map((g) => g.年级) || []);
    }
    setCurrentIndex(0);
  };

  const handleSemesterToggle = (semester: string) => {
    if (selectedSemesters.includes(semester)) {
      setSelectedSemesters(selectedSemesters.filter((s) => s !== semester));
    } else {
      setSelectedSemesters([...selectedSemesters, semester]);
    }
    setCurrentIndex(0);
  };

  const handleSelectAllSemesters = () => {
    if (selectedSemesters.length === semesters.length) {
      setSelectedSemesters([]);
    } else {
      setSelectedSemesters([...semesters]);
    }
    setCurrentIndex(0);
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
    <div className="flex h-[calc(100vh-64px-48px)]">
      <aside className="w-80 border-r bg-gray-50 dark:bg-gray-800 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="font-semibold mb-3">模式</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("recite")}
                className={`py-1 px-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                  mode === "recite"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}>
                背诵模式
              </button>
              <button
                onClick={() => setMode("learn")}
                className={`py-1 px-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
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
                    setCurrentIndex(0);
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b shadow-sm pb-4 pt-2 px-4 bg-background/50 backdrop-blur">
          <div className="flex justify-between items-center">
            {mode === "learn" && poems.length > 0 ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : (
              <div className="text-lg font-medium">
                {poems.length > 0
                  ? `${correctCount + errorCount} / ${poems.length}`
                  : "0 / 0"}
              </div>
            )}
            {mode === "recite" && (
              <div className="flex gap-4 text-sm">
                <span className="text-red-500">错误：{errorCount}</span>
                <span className="text-green-500">正确：{correctCount}</span>
                <span className="text-muted-foreground">正确率：{accuracy}%</span>
              </div>
            )}
            {mode === "learn" && poems.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {poems[currentIndex]?.grade} · {poems[currentIndex]?.semester}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 px-12">
            {poems.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                请选择年级和学期
              </div>
            ) : mode === "learn" ? (
              <div className="flex justify-center">
                <Card className="shadow-lg w-full max-w-2xl">
                  <CardContent className="p-6 space-y-6">
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

                    <div className="flex gap-4 pt-4 border-t">
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
              <div className="grid grid-cols-4 gap-6 auto-rows-min">
                {poems.map((item, idx) => (
                  <Card
                    key={`${item.grade}-${item.semester}-${idx}`}
                    className="hover:shadow-md transition-shadow min-h-40">
                    <CardContent className="space-y-3 flex flex-col h-full justify-between">
                      <div className="text-center mb-4">
                        <div className="font-bold text-xl">
                          {item.data.标题}
                        </div>
                      </div>
                      <ScrollArea className="max-h-60 h-40">
                        <div className="text-center h-full flex items-end justify-center">
                          {showFirstChar && item.data.原文 && item.data.原文.length > 0 && (
                            <div className="flex flex-col items-center mt-1">
                              {item.data.原文.map((line, lineIdx) => {
                                const chars = line.split('');
                                return (
                                  <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                    {chars.map((char, charIdx) => {
                                      const isFirstChar = charIdx === 0;
                                      const isPunct = /[，。？！、]/.test(char);
                                      return (
                                        <span key={charIdx} className="inline-flex items-center justify-center w-5.5 h-5.5 border border-gray-300 rounded text-xs">
                                          {isFirstChar ? char : (isPunct ? <span className="text-gray-400">{char}</span> : ' ')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {showLastChar && item.data.原文 && item.data.原文.length > 0 && (
                            <div className="flex flex-col items-center mt-1">
                              {item.data.原文.map((line, lineIdx) => {
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
                                        <span key={charIdx} className="inline-flex items-center justify-center w-5.5 h-5.5 border border-gray-300 rounded text-xs">
                                          {isLastChar ? char : (isPunct ? <span className="text-gray-400">{char}</span> : ' ')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {!showFirstChar && !showLastChar && !showRandomChar && item.data.原文 && item.data.原文.length > 0 && (
                            <div className="flex flex-col items-center mt-1">
                              {item.data.原文.map((line, lineIdx) => {
                                const chars = line.split('');
                                return (
                                  <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                    {chars.map((char, charIdx) => {
                                      const isPunct = /[，。？！、]/.test(char);
                                      return (
                                        <span key={charIdx} className="inline-flex items-center justify-center w-5.5 h-5.5 border border-gray-300 rounded text-xs">
                                          {isPunct ? <span className="text-gray-400">{char}</span> : ' '}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {showRandomChar && item.data.原文 && item.data.原文.length > 0 && (
                            <div className="flex flex-col items-center mt-1">
                              {item.data.原文.map((line, lineIdx) => {
                                const chars = line.split('');
                                const chineseChars = chars.filter(c => !/[，。？！、]/.test(c));
                                const randomIdx = chineseChars.length > 0 ? Math.floor(Math.random() * chineseChars.length) : -1;
                                let currentChineseIdx = 0;
                                return (
                                  <div key={lineIdx} className="flex gap-1 mb-1 flex-wrap justify-center">
                                    {chars.map((char, charIdx) => {
                                      const isPunct = /[，。？！、]/.test(char);
                                      const isRandomChar = !isPunct && currentChineseIdx++ === randomIdx;
                                      return (
                                        <span key={charIdx} className="inline-flex items-center justify-center w-5.5 h-5.5 border border-gray-300 rounded text-xs">
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
                      </ScrollArea>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedPoem(item.data)}
                          className="w-full text-sm text-blue-500 hover:underline cursor-pointer">
                          查看古诗详情
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentIndex(idx);
                              const key = `${item.grade}-${item.semester}-${idx}`;
                              handleNotMastered(key);
                            }}
                            className="flex-1 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={notMasteredPoems.has(`${item.grade}-${item.semester}-${idx}`) || masteredPoems.has(`${item.grade}-${item.semester}-${idx}`)}>
                            未掌握
                          </button>
                          <button
                            onClick={() => {
                              setCurrentIndex(idx);
                              const key = `${item.grade}-${item.semester}-${idx}`;
                              handleMastered(key);
                            }}
                            className="flex-1 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={notMasteredPoems.has(`${item.grade}-${item.semester}-${idx}`) || masteredPoems.has(`${item.grade}-${item.semester}-${idx}`)}>
                            掌握
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
          <div className="flex justify-center pb-4">
            <button
              onClick={() => {
                setShowResult(false);
                setMasteredPoems(new Set());
                setNotMasteredPoems(new Set());
                setCorrectCount(0);
                setErrorCount(0);
                setCurrentIndex(0);
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              重新开始
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
