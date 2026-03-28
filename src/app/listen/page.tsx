"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getFromDB, STORES } from "@/lib/db";
import { useUserStore } from "@/lib/api/user-store";
import { LocalDataManager } from "@/components/local-data-manager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CatalogItem, CatalogDetail, PoemDetail, PinyinData } from "@/types/poem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2, User, Headphones, HeadphoneOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  RATE_OPTIONS,
  VOLUME_OPTIONS,
  formatRate,
  formatVolume,
  speak,
  pauseSpeech,
  stopSpeech,
  loadSpeechSettings,
  saveSpeechSettings,
  SpeechSettings,
} from "@/lib/speech";

interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export default function ListenPage() {
  const { initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [catalogDetail, setCatalogDetail] = useState<CatalogDetail | null>(null);
  const [system, setSystem] = useState("");
  const [selectedFascicule, setSelectedFascicule] = useState("");
  const [localDataOpen, setLocalDataOpen] = useState(false);

  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(loadSpeechSettings());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPoemDetail, setCurrentPoemDetail] = useState<PoemDetail | null>(null);
  const [pinyinData, setPinyinData] = useState<PinyinData | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  // 保存设置到 localStorage
  const handleSaveSpeechSettings = (newSettings: SpeechSettings) => {
    setSpeechSettings(newSettings);
    saveSpeechSettings(newSettings);
  };

  // 选择声音时保存设置
  const handleVoiceSelect = (voice: VoiceOption) => {
    handleSaveSpeechSettings({ ...speechSettings, voiceURI: voice.voiceURI });
  };

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === "undefined") return;
      
      const synth = window.speechSynthesis;
      const loadedVoices = synth.getVoices();
      
      const zhVoices = loadedVoices
        .filter(v => v.lang.startsWith("zh-") && v.localService)
        .map(v => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }));
      
      if (zhVoices.length > 0) {
        setVoices(zhVoices);
        if (!speechSettings.voiceURI) {
          handleSaveSpeechSettings({ ...speechSettings, voiceURI: zhVoices[0].voiceURI });
        }
      } else {
        const allZhVoices = loadedVoices
          .filter(v => v.lang.startsWith("zh-"))
          .map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
          }));
        if (allZhVoices.length > 0) {
          setVoices(allZhVoices);
          if (!speechSettings.voiceURI) {
            handleSaveSpeechSettings({ ...speechSettings, voiceURI: allZhVoices[0].voiceURI });
          }
        } else {
          const allVoices = loadedVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
          }));
          setVoices(allVoices);
          if (!speechSettings.voiceURI && allVoices.length > 0) {
            handleSaveSpeechSettings({ ...speechSettings, voiceURI: allVoices[0].voiceURI });
          }
        }
      }
    };

    loadVoices();
    
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [speechSettings.voiceURI]);

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
      })
      .catch(() => {});
  }, [fetchCatalogDetail]);

  const handleSystemChange = (catalogId: string) => {
    setSystem(catalogId);
    const selected = catalogList.find((c) => c.catalog === catalogId);
    if (selected) fetchCatalogDetail(selected._id);
  };

  // 使用 useMemo 计算诗词列表
  const poemsList = useMemo(() => {
    if (!selectedFascicule || !catalogDetail?.fasciculeList) {
      return [];
    }

    const fascData = catalogDetail.fasciculeList.find(
      (f) => f._id === selectedFascicule,
    );
    if (!fascData || !fascData.doc_list) {
      return [];
    }

    return fascData.doc_list.map((poem: { target_id: number; title: string; author: string; dynasty: string }) => ({
      targetId: poem.target_id,
      title: poem.title || "",
      author: poem.author || "",
      dynasty: poem.dynasty || "",
    }));
  }, [selectedFascicule, catalogDetail]);

  useEffect(() => {
    const loadPoemDetail = async () => {
      if (poemsList.length === 0 || currentIndex >= poemsList.length) return;

      // 停止当前朗读
      stopSpeech();
      setIsPlaying(false);
      setPlayingSection(null);
      setShowPinyin(false);

      const targetId = poemsList[currentIndex].targetId;
      const cached = await getFromDB<PoemDetail>(STORES.POEMS, targetId);
      if (cached) {
        setCurrentPoemDetail(cached);
      }

      // 加载拼音
      const cachedPinyin = await getFromDB<PinyinData>(STORES.PINYIN, targetId);
      if (cachedPinyin) {
        setPinyinData(cachedPinyin);
      } else {
        setPinyinData(null);
      }
    };

    loadPoemDetail();
  }, [poemsList, currentIndex]);

  // 去除 HTML 标签，获取纯文本
  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  // 播放指定内容（用于各个章节）
  const handlePlaySection = (sectionName: string, content: string) => {
    if (!content) return;
    
    if (playingSection === sectionName) {
      stopSpeech();
      setPlayingSection(null);
      return;
    }
    
    if (playingSection && playingSection !== sectionName) {
      stopSpeech();
    }

    const textContent = stripHtml(content);
    
    const result = speak(textContent, speechSettings, () => {
      setPlayingSection(null);
      setCurrentCharIndex(0);
    }, (charIndex) => {
      setCurrentCharIndex(charIndex);
    });
    
    if (result.success) {
      setPlayingSection(sectionName);
    } else {
      toast.error(result.error || "播放失败");
    }
  };

  const handlePrev = () => {
    stopSpeech();
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : poemsList.length - 1));
  };

  const handleNext = () => {
    stopSpeech();
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev < poemsList.length - 1 ? prev + 1 : 0));
  };

  // 播放/暂停处理
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSpeech();
      setIsPlaying(false);
    } else {
      // 开始朗读当前诗词
      const poem = currentPoemDetail?.poem;
      if (!poem) return;
      
      // 组合诗词内容：标题 + 作者 + 朝代 + 序 + 正文
      let text = "";
      if (poem.title) text += poem.title + "，";
      if (poem.author) text += poem.author + "，";
      if (poem.dynasty) text += poem.dynasty + "，";
      if (poem.xu) text += poem.xu + "，";
      if (poem.content?.content) {
        text += poem.content.content.join("，");
      }
      
      if (text) {
        setCurrentCharIndex(0);
        const result = speak(text, speechSettings, () => {
          setIsPlaying(false);
          setCurrentCharIndex(0);
        }, (charIndex) => {
          setCurrentCharIndex(charIndex);
        });
        if (result.success) {
          setIsPlaying(true);
        } else {
          toast.error(result.error || "播放失败");
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px-48px)]">
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 选集和分册选择 */}
          {catalogList.length > 0 && (
            <div className="hidden md:block w-52 border-r bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* 选集 */}
                <div>
                  <div className="text-sm font-semibold mb-3">选集</div>
                  <div className="grid grid-cols-2 gap-2">
                    {catalogList.map((item) => (
                      <button
                        key={item.catalog}
                        onClick={() => handleSystemChange(item.catalog)}
                        className={`p-2 py-1.5 rounded-lg border text-xs text-center transition-colors ${
                          system === item.catalog
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        {item.catalog_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分册 */}
                {catalogDetail?.fasciculeList && catalogDetail.fasciculeList.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-3">分册</div>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogDetail.fasciculeList.map((fasc) => (
                        <button
                          key={fasc._id}
                          onClick={() => {
                            setSelectedFascicule(fasc._id);
                            setCurrentIndex(0);
                          }}
                          className={`p-2 py-1.5 rounded-lg border text-xs text-center transition-colors ${
                            selectedFascicule === fasc._id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          {fasc.fascicule_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 左侧诗词列表 */}
          {poemsList.length > 0 && (
            <div className="hidden md:block w-36 border-r bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {poemsList.map((poem, idx) => (
                    <div
                      key={poem.targetId}
                      onClick={() => setCurrentIndex(idx)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        idx === currentIndex
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}>
                      <div className="font-medium text-sm truncate">{poem.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {poem.author} [{poem.dynasty}]
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 中间主内容 */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-6 h-full">
            {poemsList.length === 0 ? (
              <div className="text-muted-foreground">请选择分册</div>
            ) : (
              <Card className="w-full h-full overflow-hidden">
                <ScrollArea className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="text-center flex-1">
                        <div className="font-bold text-2xl">{currentPoemDetail?.poem?.title}</div>
                        <div className="text-muted-foreground mt-2">
                          {currentPoemDetail?.poem?.author} [{currentPoemDetail?.poem?.dynasty}]
                        </div>
                      </div>
                      {currentPoemDetail && (
                        <button
                          onClick={() => setShowPinyin(!showPinyin)}
                          className={`px-2 py-1 rounded text-xs ${
                            showPinyin 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-100 dark:bg-gray-700 text-muted-foreground"
                          }`}
                        >
                          拼
                        </button>
                      )}
                    </div>

                    {/* 播放控制 */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <Button variant="outline" size="icon" onClick={handlePrev}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5" />
                        )}
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleNext}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 诗词内容（可滚动） */}
                    <div className="text-center space-y-2 py-2">
                      {currentPoemDetail?.poem?.xu && (
                        <div className="text-muted-foreground text-sm italic">
                          {currentPoemDetail.poem.xu}
                        </div>
                      )}
                      {currentPoemDetail?.poem?.content?.content?.map((line, lineIdx) => {
                        const chars = line.split("");
                        const pinyinLine = pinyinData?.content?.[lineIdx] || [];
                        // 计算当前行在完整文本中的起始位置（不包括标题、作者、朝代、序）
                        let lineStartOffset = 0;
                        if (currentPoemDetail?.poem?.title) lineStartOffset += currentPoemDetail.poem.title.length + 1;
                        if (currentPoemDetail?.poem?.author) lineStartOffset += currentPoemDetail.poem.author.length + 1;
                        if (currentPoemDetail?.poem?.dynasty) lineStartOffset += currentPoemDetail.poem.dynasty.length + 1;
                        if (currentPoemDetail?.poem?.xu) lineStartOffset += currentPoemDetail.poem.xu.length + 1;
                        for (let i = 0; i < lineIdx; i++) {
                          const prevLine = currentPoemDetail.poem?.content?.content?.[i];
                          lineStartOffset += (prevLine?.length || 0) + 1;
                        }
                        
                        return (
                          <div key={lineIdx} className="flex justify-center gap-1 flex-wrap">
                            {chars.map((char, charIdx) => {
                              const globalCharIdx = lineStartOffset + charIdx;
                              const isHighlighted = isPlaying && currentCharIndex > lineStartOffset && globalCharIdx <= currentCharIndex;
                              return (
                                <div key={charIdx} className="flex flex-col items-center">
                                  {showPinyin && (
                                    <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-4">
                                      {pinyinLine[charIdx] || ""}
                                    </span>
                                  )}
                                  <span className={`text-lg ${isHighlighted ? "text-blue-500 dark:text-blue-400 font-bold" : ""}`}>{char}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* 注释 */}
                    {currentPoemDetail?.detail?.zhu?.content && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            注释
                            <button
                              onClick={() => handlePlaySection("zhu", currentPoemDetail.detail?.zhu?.content?.join("") || "")}
                              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            >
                              {playingSection === "zhu" ? (
                                <>
                                  <HeadphoneOff className="h-3.5 w-3.5" />
                                  <span className="flex items-end h-3 gap-0.5 ml-0.5">
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-1" style={{ height: "40%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-2" style={{ height: "60%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-3" style={{ height: "80%" }} />
                                  </span>
                                </>
                              ) : (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div 
                          className="text-muted-foreground text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPoemDetail.detail.zhu.content.join("") }}
                        />
                      </div>
                    )}

                    {/* 译文 */}
                    {currentPoemDetail?.detail?.yi?.content && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            译文
                            <button
                              onClick={() => handlePlaySection("yi", currentPoemDetail.detail?.yi?.content?.join("") || "")}
                              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            >
                              {playingSection === "yi" ? (
                                <>
                                  <HeadphoneOff className="h-3.5 w-3.5" />
                                  <span className="flex items-end h-3 gap-0.5 ml-0.5">
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-1" style={{ height: "40%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-2" style={{ height: "60%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-3" style={{ height: "80%" }} />
                                  </span>
                                </>
                              ) : (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div 
                          className="text-muted-foreground text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPoemDetail.detail.yi.content.join("") }}
                        />
                      </div>
                    )}

                    {/* 创作背景 */}
                    {currentPoemDetail?.poem?.background && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            创作背景
                            <button
                              onClick={() => handlePlaySection("background", currentPoemDetail.poem?.background || "")}
                              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            >
                              {playingSection === "background" ? (
                                <>
                                  <HeadphoneOff className="h-3.5 w-3.5" />
                                  <span className="flex items-end h-3 gap-0.5 ml-0.5">
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-1" style={{ height: "40%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-2" style={{ height: "60%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-3" style={{ height: "80%" }} />
                                  </span>
                                </>
                              ) : (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div 
                          className="text-muted-foreground text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPoemDetail.poem.background }}
                        />
                      </div>
                    )}

                    {/* 诗人介绍 */}
                    {currentPoemDetail?.author?.profile && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            诗人介绍
                            <button
                              onClick={() => handlePlaySection("author", currentPoemDetail.author?.profile || "")}
                              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            >
                              {playingSection === "author" ? (
                                <>
                                  <HeadphoneOff className="h-3.5 w-3.5" />
                                  <span className="flex items-end h-3 gap-0.5 ml-0.5">
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-1" style={{ height: "40%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-2" style={{ height: "60%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-3" style={{ height: "80%" }} />
                                  </span>
                                </>
                              ) : (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div 
                          className="text-muted-foreground text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPoemDetail.author.profile }}
                        />
                      </div>
                    )}

                    {/* 赏析 */}
                    {currentPoemDetail?.detail?.shangxi?.content && (
                      <div className="mt-4 mb-8">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            赏析
                            <button
                              onClick={() => handlePlaySection("shangxi", currentPoemDetail.detail?.shangxi?.content?.join("") || "")}
                              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            >
                              {playingSection === "shangxi" ? (
                                <>
                                  <HeadphoneOff className="h-3.5 w-3.5" />
                                  <span className="flex items-end h-3 gap-0.5 ml-0.5">
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-1" style={{ height: "40%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-2" style={{ height: "60%" }} />
                                    <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer-3" style={{ height: "80%" }} />
                                  </span>
                                </>
                              ) : (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </h3>
                          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div 
                          className="text-muted-foreground text-base leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPoemDetail.detail.shangxi.content.join("") }}
                        />
                      </div>
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            )}
          </div>

          {/* 右侧设置卡片 */}
          <div className="w-64 border-l bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 p-4">
            <Card className="h-full">
              <CardContent className="px-4 space-y-4">
                <div className="font-semibold text-sm">朗读设置</div>
                
                {/* 选择声音 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    选择您喜欢的声音
                  </div>
                  <ScrollArea className="h-60">
                    <div className="space-y-2">
                      {voices.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2">
                          加载中...
                        </div>
                      ) : (
                        voices.map((voice) => (
                          <div
                            key={voice.voiceURI}
                            onClick={() => handleVoiceSelect(voice)}
                            className={`p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                              speechSettings.voiceURI === voice.voiceURI
                                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <div className="font-medium">{voice.name}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                const poem = currentPoemDetail?.poem;
                                let previewText = "";
                                if (poem?.title) previewText += poem.title + "，";
                                if (poem?.author) previewText += poem.author + "，";
                                if (poem?.dynasty) previewText += poem.dynasty + "，";
                                if (poem?.xu) previewText += poem.xu + "，";
                                if (poem?.content?.content) {
                                  previewText += poem.content.content.join("，");
                                }
                                const result = speak(previewText || "请先选择一首诗词", {
                                  voiceURI: voice.voiceURI,
                                  rate: speechSettings.rate,
                                  pitch: speechSettings.pitch,
                                  volume: speechSettings.volume,
                                });
                                if (!result.success) {
                                  toast.error(result.error || "播放失败");
                                }
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              试听音色
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* 调节语速 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Volume2 className="h-4 w-4" />
                    调节语速
                  </div>
                  <Select
                    value={speechSettings.rate.toString()}
                    onValueChange={(v) => v && handleSaveSpeechSettings({ ...speechSettings, rate: parseFloat(v) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatRate(speechSettings.rate)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_OPTIONS.map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {formatRate(rate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 调节音量 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    调节音量
                  </div>
                  <Select
                    value={speechSettings.volume.toString()}
                    onValueChange={(v) => v && handleSaveSpeechSettings({ ...speechSettings, volume: parseFloat(v) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{formatVolume(speechSettings.volume)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {VOLUME_OPTIONS.map((vol) => (
                        <SelectItem key={vol} value={vol.toString()}>
                          {formatVolume(vol)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LocalDataManager open={localDataOpen} onOpenChange={setLocalDataOpen} />
    </div>
  );
}
