"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail, PinyinData } from "@/types/poem";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { CheckCheck } from "lucide-react";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { CheckInSuccessDialog } from "@/components/check-in-success-dialog";
import { setToDB, getAllFromDB, STORES } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LearnCardProps {
  poemDetail: PoemDetail | null;
  pinyinData: PinyinData | null;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onCheckInSuccess?: () => void;
}

export function LearnCard({ poemDetail, pinyinData, currentIndex, onPrev, onNext, onCheckInSuccess }: LearnCardProps) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [checkInCount, setCheckInCount] = useState(1);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // 获取用户信息
  const getUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  // 检查是否已打卡
  const checkIfCheckedInToday = async () => {
    const user = getUser();
    const poemId = poemDetail?.poem?.id;
    if (!user || !poemId) {
      setCheckedInToday(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const allRecords = await getAllFromDB<{ user_id: number; poem_id: number; check_in_time: string }>(STORES.POEM_STUDY);
    const hasCheckedInToday = allRecords.some(
      (r) => r.user_id === user.user_id && r.poem_id === poemId && r.check_in_time.startsWith(today)
    );
    setCheckedInToday(hasCheckedInToday);
  };

  // 诗词变化时检查打卡状态
  useEffect(() => {
    checkIfCheckedInToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemDetail?.poem?.id]);

  // 保存用户信息
  const saveUser = (user: { user_id: number; user_name: string }) => {
    localStorage.setItem("user", JSON.stringify(user));
  };

  // 创建用户
  const handleCreateUser = async (userName: string) => {
    const userData = {
      user_name: userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setToDB(STORES.USERS, userData);

    // 获取刚创建的用户
    const users = await getAllFromDB<{ id: number; user_name: string }>(STORES.USERS);
    const newUser = users[users.length - 1];
    saveUser({ user_id: newUser.id, user_name: newUser.user_name });

    // 创建用户后直接打卡
    await handleCheckIn({ user_id: newUser.id, user_name: newUser.user_name });
  };

  // 打卡
  const handleCheckIn = async (user?: { user_id: number; user_name: string }) => {
    if (checkingIn || checkedInToday) return;

    const currentUser = user || getUser();
    if (!currentUser) {
      setShowCreateUser(true);
      return;
    }

    const poem = poemDetail?.poem;
    if (!poem?.id) return;

    setCheckingIn(true);

    const now = new Date().toISOString();

    // 新增打卡明细
    await setToDB(STORES.POEM_STUDY, {
      user_id: currentUser.user_id,
      poem_id: poem.id,
      poem_title: poem.title || "",
      author: poem.author || "",
      dynasty: poem.dynasty || "",
      check_in_time: now,
    });

    // 更新汇总
    const allSummary = await getAllFromDB<{ id: number; user_id: number; poem_id: number; count: number; created_at: string; updated_at: string }>(STORES.POEM_STUDY_SUMMARY);
    const existingSummary = allSummary.find(
      (s) => s.user_id === currentUser.user_id && s.poem_id === poem.id
    );

    let finalCount = 1;
    if (existingSummary) {
      // 更新已有记录
      finalCount = existingSummary.count + 1;
      await setToDB(STORES.POEM_STUDY_SUMMARY, {
        ...existingSummary,
        count: finalCount,
        updated_at: now,
      });
    } else {
      // 新增记录
      await setToDB(STORES.POEM_STUDY_SUMMARY, {
        user_id: currentUser.user_id,
        poem_id: poem.id,
        poem_title: poem.title || "",
        count: 1,
        created_at: now,
        updated_at: now,
      });
    }

    // 打卡成功弹窗
    setCheckInCount(finalCount);
    setCheckedInToday(true);
    setShowCheckInSuccess(true);
    setCheckingIn(false);
    onCheckInSuccess?.();
  };

  // 打卡按钮点击
  const handleCheckInClick = () => {
    const user = getUser();
    if (!user) {
      setShowCreateUser(true);
    } else {
      handleCheckIn(user);
    }
  };

  if (!poemDetail) {
    return (
      <div className="flex items-center justify-center h-full px-6 md:px-2 py-4">
        <Card className="w-full min-w-80 max-w-4xl max-h-[70vh]">
          <CardContent className="p-4 md:p-6 space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-5/6" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4 pt-4 border-t">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full px-6 md:px-6 py-6">
      <div className="relative w-full h-full min-w-80">
        {/* 序号标记 */}
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
          {currentIndex + 1}
        </div>
        {/* 译文按钮 */}
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`absolute top-7 right-20 z-9 w-7 h-7 text-sm flex items-center justify-center rounded-full transition-all duration-200 ${showTranslation ? "bg-primary text-primary-foreground" : "bg-primary-foreground text-primary hover:bg-primary/10 hover:text-primary/90 dark:hover:text-primary70 dark:hover:bg-primary/10"} border border-${showTranslation ? "primary/50" : "primary/20"}`}
          title="显示/隐藏译文">
          译
        </button>
        {/* 拼音按钮 */}
        <button
          onClick={() => setShowPinyin(!showPinyin)}
          className={`absolute top-7 right-12 z-9 w-7 h-7 text-sm flex items-center justify-center rounded-full transition-all duration-200 ${showPinyin ? "bg-primary text-primary-foreground " : "bg-primary-foreground text-primary hover:bg-primary/10 hover:text-primary/90 dark:hover:text-primary70 dark:hover:bg-primary/10"} border border-${showPinyin ? "primary/50" : "primary/20"}`}
          title="显示/隐藏拼音">
          拼
        </button>
        <Card className="py-4 shadow-lg w-full h-full flex flex-col">
          <CardContent className="flex flex-col flex-1 overflow-hidden">
            {/* 内容区域 */}
            <ScrollArea className="p-4 py-3 flex-1 h-full max-h-[calc(100%-56px)]">
              {/* 标题+拼音 */}
              <div className="text-center space-y-1 mb-4">
                <div className="flex justify-center gap-1 flex-wrap">
                  {poemDetail.poem?.title?.split("").map((char, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      {showPinyin && (
                        <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-4">
                          {pinyinData?.title?.[idx] || ""}
                        </span>
                      )}
                      <span className="text-2xl font-bold">{char}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {poemDetail.poem?.author} [{poemDetail.poem?.dynasty}]
                </div>
              </div>

              {/* 诗词正文 */}
              {poemDetail.poem?.content?.content && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {poemDetail.poem.xu && (
                    <div className="text-center text-muted-foreground text-base mb-4 italic">
                      {poemDetail.poem.xu}
                    </div>
                  )}
                  <div
                    className={`${poemDetail.poem?.type === "文言文" ? "text-left" : "text-center"} space-y-3`}>
                    {poemDetail.poem.content.content.map((line, lineIdx) => {
                      const chars = line.split("");
                      const pinyinLine = pinyinData?.content?.[lineIdx] || [];
                      return (
                        <React.Fragment key={`${lineIdx}-fragment`}>
                          <div
                            key={`${lineIdx}-original`}
                            className="flex justify-center gap-1 flex-wrap mb-1">
                            {chars.map((char, charIdx) => (
                              <div
                                key={charIdx}
                                className="flex flex-col items-center">
                                {showPinyin && (
                                  <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-4">
                                    {pinyinLine[charIdx] || ""}
                                  </span>
                                )}
                                <span className="text-base md:text-lg">
                                  {char}
                                </span>
                              </div>
                            ))}
                          </div>
                          {showTranslation &&
                            poemDetail.detail?.yi?.content?.[lineIdx] && (
                              <div
                                key={`${lineIdx}-translation`}
                                className="mt-2">
                                <div 
                                  className="text-xs text-muted-foreground italic bg-gray-100 dark:bg-gray-700 p-2 rounded whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{ __html: poemDetail.detail.yi.content[lineIdx] }}
                                />
                              </div>
                            )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 注释 - HTML渲染 */}
              {poemDetail.detail?.zhu?.content && (
                <Section
                  title="注释"
                  content={poemDetail.detail.zhu.content}
                  isHtml
                />
              )}

              {/* 译文 */}
              {poemDetail.detail?.yi?.content && (
                <Section title="译文" content={poemDetail.detail.yi.content} />
              )}

              {/* 背景 - HTML渲染 */}
              {poemDetail.poem?.background && (
                <Section
                  title="创作背景"
                  content={[poemDetail.poem.background]}
                  isHtml
                />
              )}

              {/* 诗人介绍 - HTML渲染 */}
              {poemDetail.author?.profile && (
                <Section
                  title="诗人介绍"
                  content={[poemDetail.author.profile]}
                  isHtml
                />
              )}

              {/* 赏析 - HTML渲染 */}
              {poemDetail.detail?.shangxi?.content && (
                <Section
                  title="赏析"
                  content={poemDetail.detail.shangxi.content}
                  isHtml
                  className="mb-8"
                />
              )}
            </ScrollArea>

            {/* 底部导航 */}
            <div className="flex items-center gap-4 pt-4 border-t flex-shrink-0">
              <button
                onClick={onPrev}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                上一首
              </button>
              <button
                onClick={onNext}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                下一首
              </button>
              <button
                onClick={handleCheckInClick}
                disabled={checkedInToday || checkingIn}
                className={`flex items-center gap-1 py-2 px-4 rounded transition-colors ${
                  checkedInToday
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : checkingIn
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-wait"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                }`}>
                <CheckCheck
                  className={`h-4 w-4 ${checkingIn ? "animate-pulse" : ""}`}
                />
                {checkedInToday ? "已打卡" : checkingIn ? "打卡中..." : "打卡"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        onSubmit={handleCreateUser}
      />

      <CheckInSuccessDialog
        open={showCheckInSuccess}
        onOpenChange={setShowCheckInSuccess}
        count={checkInCount}
      />
    </div>
  );
}

/** 通用章节组件 */
function Section({ title, content, isHtml, className }: { title: string; content: string[]; isHtml?: boolean; className?: string }) {
  return (
    <div className={`mt-4 ${className || ""}`}>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      </div>
      {isHtml ? (
        <div
          className="text-muted-foreground text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.join("") }}
        />
      ) : (
        content.map((text, idx) => (
          <p key={idx} className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        ))
      )}
    </div>
  );
}
