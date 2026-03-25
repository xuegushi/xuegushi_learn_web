"use client";

import { useState, useEffect, useCallback } from "react";
import { getFromDB, STORES } from "@/lib/db";
import { useUserStore } from "@/lib/api/user-store";
import { LocalDataManager } from "@/components/local-data-manager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CatalogItem, CatalogDetail, PoemDetail } from "@/types/poem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, User } from "lucide-react";

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

  const [poems, setPoems] = useState<{ targetId: number; title: string; author: string; dynasty: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPoemDetail, setCurrentPoemDetail] = useState<PoemDetail | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 声音设置
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === "undefined") return;
      
      const synth = window.speechSynthesis;
      const loadedVoices = synth.getVoices();
      
      // 筛选 localService 为 true 的中文声音
      const zhVoices = loadedVoices
        .filter(v => v.lang.startsWith("zh-CN") && v.localService)
        .map(v => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }));
      
      if (zhVoices.length > 0) {
        setVoices(zhVoices);
        setSelectedVoice(zhVoices[0]);
      } else {
        // 如果没有符合条件的本地声音，使用所有本地服务的中文声音
        const allZhVoices = loadedVoices
          .filter(v => v.lang.startsWith("zh-CN"))
          .map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
          }));
        if (allZhVoices.length > 0) {
          setVoices(allZhVoices);
          setSelectedVoice(allZhVoices[0]);
        } else {
          // 如果还是没有，使用所有可用声音
          const allVoices = loadedVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
          }));
          setVoices(allVoices);
          setSelectedVoice(allVoices[0] || null);
        }
      }
    };

    loadVoices();
    
    // 某些浏览器需要等待 voiceschanged 事件
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 试听音色
  const handlePreviewVoice = () => {
    if (typeof window === "undefined" || !selectedVoice) return;
    
    const synth = window.speechSynthesis;
    synth.cancel(); // 停止当前朗读
    
    const utterance = new SpeechSynthesisUtterance("鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。");
    
    // 找到对应的 voice 对象
    const allVoices = synth.getVoices();
    const voiceObj = allVoices.find(v => v.voiceURI === selectedVoice.voiceURI);
    if (voiceObj) {
      utterance.voice = voiceObj;
    }
    utterance.lang = "zh-CN";
    utterance.rate = 0.8; // 语速稍慢
    
    synth.speak(utterance);
  };

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

  useEffect(() => {
    if (!selectedFascicule || !catalogDetail?.fasciculeList) {
      setPoems([]);
      return;
    }

    const fascData = catalogDetail.fasciculeList.find(
      (f) => f._id === selectedFascicule,
    );
    if (!fascData || !fascData.doc_list) {
      setPoems([]);
      return;
    }

    setPoems(
      fascData.doc_list.map((poem: { target_id: number; title: string; author: string; dynasty: string }) => ({
        targetId: poem.target_id,
        title: poem.title || "",
        author: poem.author || "",
        dynasty: poem.dynasty || "",
      })),
    );
    setCurrentIndex(0);
  }, [selectedFascicule, catalogDetail]);

  useEffect(() => {
    const loadPoemDetail = async () => {
      if (poems.length === 0 || currentIndex >= poems.length) return;

      const targetId = poems[currentIndex].targetId;
      const cached = await getFromDB<PoemDetail>(STORES.POEMS, targetId);
      if (cached) {
        setCurrentPoemDetail(cached);
      }
    };

    loadPoemDetail();
  }, [poems, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : poems.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < poems.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧诗词列表 */}
          {poems.length > 0 && (
            <div className="hidden md:block w-48 border-r bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {poems.map((poem, idx) => (
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
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            {poems.length === 0 ? (
              <div className="text-muted-foreground">请选择分册</div>
            ) : (
              <Card className="w-full max-w-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="font-bold text-2xl">{currentPoemDetail?.poem?.title}</div>
                    <div className="text-muted-foreground mt-1">
                      {currentPoemDetail?.poem?.author} [{currentPoemDetail?.poem?.dynasty}]
                    </div>
                  </div>

                  {/* 播放控制 */}
                  <div className="flex items-center justify-center gap-4 py-4">
                    <Button variant="outline" size="icon" onClick={handlePrev}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => setIsPlaying(!isPlaying)}
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
                  <ScrollArea className="h-64">
                    <div className="text-center space-y-2 py-4">
                      {currentPoemDetail?.poem?.xu && (
                        <div className="text-muted-foreground text-sm italic">
                          {currentPoemDetail.poem.xu}
                        </div>
                      )}
                      {currentPoemDetail?.poem?.content?.content?.map((line, idx) => (
                        <div key={idx} className="text-lg">
                          {line}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* 提示信息 */}
                  <div className="text-center text-sm text-muted-foreground">
                    <Volume2 className="h-4 w-4 inline mr-1" />
                    听诗功能开发中...
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧设置卡片 */}
          <div className="w-64 border-l bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 p-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="font-semibold text-sm">朗读设置</div>
                
                {/* 选择声音 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    选择您喜欢的声音
                  </div>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {voices.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2">
                          加载中...
                        </div>
                      ) : (
                        voices.map((voice, idx) => (
                          <div
                            key={voice.voiceURI}
                            onClick={() => setSelectedVoice(voice)}
                            className={`p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                              selectedVoice?.voiceURI === voice.voiceURI
                                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <div className="font-medium">{voice.name}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                const synth = window.speechSynthesis;
                                synth.cancel();
                                const utterance = new SpeechSynthesisUtterance("鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。");
                                const allVoices = synth.getVoices();
                                const voiceObj = allVoices.find(v => v.voiceURI === voice.voiceURI);
                                if (voiceObj) utterance.voice = voiceObj;
                                utterance.lang = "zh-CN";
                                utterance.rate = 0.8;
                                synth.speak(utterance);
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LocalDataManager open={localDataOpen} onOpenChange={setLocalDataOpen} />
    </div>
  );
}
