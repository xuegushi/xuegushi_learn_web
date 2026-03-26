"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail, PinyinData } from "@/types/poem";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { CheckCheck, Headphones, HeadphoneOff } from "lucide-react";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { CheckInSuccessDialog } from "@/components/check-in-success-dialog";
import { setToDB, getAllFromDB, STORES } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/lib/api/user-store";
import { speak, stopSpeech, loadSpeechSettings } from "@/lib/speech";

interface LearnCardProps {
  poemDetail: PoemDetail | null;
  pinyinData: PinyinData | null;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onCheckInSuccess?: () => void;
}

export function LearnCard({
  poemDetail,
  pinyinData,
  currentIndex,
  onPrev,
  onNext,
  onCheckInSuccess,
}: LearnCardProps) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [checkInCount, setCheckInCount] = useState(1);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { currentUser, addUser, switchUser, initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 加载本地语音设置
  const speechSettings = loadSpeechSettings();

  // 播放/停止语音
  const handlePlaySpeech = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    const poem = poemDetail?.poem;
    if (!poem) return;

    // 组合诗词内容：标题 + 作者 + 朝代 + 正文
    let text = "";
    if (poem.title) text += poem.title + "，";
    if (poem.author) text += poem.author + "，";
    if (poem.dynasty) text += poem.dynasty + "，";
    if (poem.xu) text += poem.xu + "，";
    if (poem.content?.content) {
      text += poem.content.content.join("，");
    }

    if (text) {
      speak(text, speechSettings, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // 切换诗词时停止播放
  useEffect(() => {
    stopSpeech();
    setIsPlaying(false);
  }, [poemDetail?.poem?.id]);

  const checkIfCheckedInToday = useCallback(async () => {
    if (!currentUser) {
      setCheckedInToday(false);
      return;
    }
    const poemId = poemDetail?.poem?.id;
    if (!poemId) {
      setCheckedInToday(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const allRecords = await getAllFromDB<{
      user_id: number;
      poem_id: number;
      check_in_time: string;
    }>(STORES.POEM_STUDY);
    const hasCheckedInToday = allRecords.some(
      (r) =>
        r.user_id === currentUser.user_id &&
        r.poem_id === poemId &&
        r.check_in_time.startsWith(today),
    );
    setCheckedInToday(hasCheckedInToday);
  }, [currentUser, poemDetail?.poem?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkIfCheckedInToday();
  }, [poemDetail?.poem?.id, currentUser, checkIfCheckedInToday]);

  const handleCreateUser = async (userName: string) => {
    const newUser = await addUser(userName);
    if (newUser) {
      await switchUser(newUser);
      await handleCheckIn({
        user_id: newUser.id,
        user_name: newUser.user_name,
      });
    }
  };

  const handleCheckIn = async (user?: {
    user_id: number;
    user_name: string;
  }) => {
    if (checkingIn || checkedInToday) return;

    const userToUse = user || currentUser;
    if (!userToUse) {
      setShowCreateUser(true);
      return;
    }

    const poem = poemDetail?.poem;
    if (!poem?.id) return;

    setCheckingIn(true);

    const now = new Date().toISOString();

    await setToDB(STORES.POEM_STUDY, {
      user_id: userToUse.user_id,
      poem_id: poem.id,
      poem_title: poem.title || "",
      author: poem.author || "",
      dynasty: poem.dynasty || "",
      check_in_time: now,
    });

    const allSummary = await getAllFromDB<{
      id: number;
      user_id: number;
      poem_id: number;
      count: number;
      created_at: string;
      updated_at: string;
    }>(STORES.POEM_STUDY_SUMMARY);
    const existingSummary = allSummary.find(
      (s) => s.user_id === userToUse.user_id && s.poem_id === poem.id,
    );

    let finalCount = 1;
    if (existingSummary) {
      finalCount = existingSummary.count + 1;
      await setToDB(STORES.POEM_STUDY_SUMMARY, {
        ...existingSummary,
        count: finalCount,
        updated_at: now,
      });
    } else {
      await setToDB(STORES.POEM_STUDY_SUMMARY, {
        user_id: userToUse.user_id,
        poem_id: poem.id,
        poem_title: poem.title || "",
        count: 1,
        created_at: now,
        updated_at: now,
      });
    }

    setCheckInCount(finalCount);
    setCheckedInToday(true);
    setShowCheckInSuccess(true);
    setCheckingIn(false);
    onCheckInSuccess?.();
  };

  const handleCheckInClick = () => {
    if (!currentUser) {
      setShowCreateUser(true);
    } else {
      handleCheckIn(currentUser);
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
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">
          {currentIndex + 1}
        </div>
        <button
          onClick={handlePlaySpeech}
          className="absolute -top-3 left-8 z-10 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"
          title="播放语音">
          {isPlaying ? (
            <HeadphoneOff className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`absolute top-7 right-20 z-9 w-7 h-7 text-sm flex items-center justify-center rounded-full transition-all duration-200 ${showTranslation ? "bg-primary text-primary-foreground" : "bg-primary-foreground text-primary hover:bg-primary/10 hover:text-primary/90 dark:hover:text-primary70 dark:hover:bg-primary/10"} border border-${showTranslation ? "primary/50" : "primary/20"}`}
          title="显示/隐藏译文">
          译
        </button>
        <button
          onClick={() => setShowPinyin(!showPinyin)}
          className={`absolute top-7 right-12 z-9 w-7 h-7 text-sm flex items-center justify-center rounded-full transition-all duration-200 ${showPinyin ? "bg-primary text-primary-foreground " : "bg-primary-foreground text-primary hover:bg-primary/10 hover:text-primary/90 dark:hover:text-primary70 dark:hover:bg-primary/10"} border border-${showPinyin ? "primary/50" : "primary/20"}`}
          title="显示/隐藏拼音">
          拼
        </button>
        <Card className="py-4 shadow-lg w-full  h-[calc(100%-50px)] sm:h-full flex flex-col">
          <CardContent className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="p-4 py-3 flex-1 h-full max-h-[calc(100%-56px)]">
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
                                <div className="text-xs text-muted-foreground italic bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                  {poemDetail.detail.yi.content[lineIdx]}
                                </div>
                              </div>
                            )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {poemDetail.detail?.zhu?.content && (
                <Section
                  title="注释"
                  content={poemDetail.detail.zhu.content}
                  isHtml
                />
              )}

              {poemDetail.detail?.yi?.content && (
                <Section
                  title="译文"
                  content={poemDetail.detail.yi.content}
                  isHtml
                />
              )}

              {poemDetail.poem?.background && (
                <Section
                  title="创作背景"
                  content={[poemDetail.poem.background]}
                  isHtml
                />
              )}

              {poemDetail.author?.profile && (
                <Section
                  title="诗人介绍"
                  content={[poemDetail.author.profile]}
                  isHtml
                />
              )}

              {poemDetail.detail?.shangxi?.content && (
                <Section
                  title="赏析"
                  content={poemDetail.detail.shangxi.content}
                  isHtml
                  className="mb-8"
                />
              )}
            </ScrollArea>

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

function Section({
  title,
  content,
  isHtml,
  className,
}: {
  title: string;
  content: string[];
  isHtml?: boolean;
  className?: string;
}) {
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
          <p
            key={idx}
            className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        ))
      )}
    </div>
  );
}
