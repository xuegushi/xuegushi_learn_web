"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllFromDB, deleteFromDB, setToDB, STORES } from "@/lib/db";

interface PoemCache {
  id: number;
  poem?: {
    id?: number;
    title?: string;
    author?: string;
    dynasty?: string;
  };
}

interface PinyinCache {
  poem_id: number;
  title?: string[];
}

interface LocalDataManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 10;

export function LocalDataManager({ open, onOpenChange }: LocalDataManagerProps) {
  const [poems, setPoems] = useState<PoemCache[]>([]);
  const [pinyins, setPinyins] = useState<PinyinCache[]>([]);
  const [selectedPoems, setSelectedPoems] = useState<Set<number>>(new Set());
  const [selectedPinyins, setSelectedPinyins] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
  const [poemPage, setPoemPage] = useState(1);
  const [pinyinPage, setPinyinPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"poems" | "pinyins">("poems");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [poemData, pinyinData] = await Promise.all([
      getAllFromDB<PoemCache>(STORES.POEMS),
      getAllFromDB<PinyinCache>(STORES.PINYIN),
    ]);
    setPoems(poemData);
    setPinyins(pinyinData);
    setSelectedPoems(new Set());
    setSelectedPinyins(new Set());
    setPoemPage(1);
    setPinyinPage(1);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [open, loadData]);

  const togglePoem = (id: number) => {
    setSelectedPoems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const togglePinyin = (poemId: number) => {
    setSelectedPinyins((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(poemId)) {
        newSet.delete(poemId);
      } else {
        newSet.add(poemId);
      }
      return newSet;
    });
  };

  const toggleAllPoems = () => {
    if (selectedPoems.size === poems.length) {
      setSelectedPoems(new Set());
    } else {
      setSelectedPoems(new Set(poems.map((p) => p.id)));
    }
  };

  const toggleAllPinyins = () => {
    if (selectedPinyins.size === pinyins.length) {
      setSelectedPinyins(new Set());
    } else {
      setSelectedPinyins(new Set(pinyins.map((p) => p.poem_id)));
    }
  };

  const deleteSelected = async () => {
    const poemIds = Array.from(selectedPoems);
    const pinyinIds = Array.from(selectedPinyins);

    for (const id of poemIds) {
      await deleteFromDB(STORES.POEMS, id);
    }
    for (const id of pinyinIds) {
      await deleteFromDB(STORES.PINYIN, id);
    }

    await loadData();
  };

  const updateSelected = async () => {
    const poemIds = Array.from(selectedPoems);
    if (poemIds.length === 0) return;

    setUpdating(true);
    setUpdateProgress({ current: 0, total: poemIds.length });

    for (let i = 0; i < poemIds.length; i++) {
      const id = poemIds[i];
      try {
        const res = await fetch(`https://api.xuegushi.com/api/poem/${id}?platform=web`);
        const data = await res.json();
        await setToDB(STORES.POEMS, { id, ...data });

        if (data.poem?.id) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const pinyinRes = await fetch(
            `https://api.xuegushi.com/api/pinyin/poem?platform=web&poem_id=${data.poem.id}`
          );
          const pinyinData = await pinyinRes.json();
          await setToDB(STORES.PINYIN, { poem_id: data.poem.id, ...pinyinData });
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch {
        // Continue with next
      }

      setUpdateProgress({ current: i + 1, total: poemIds.length });
    }

    setUpdating(false);
    await loadData();
  };

  const paginatedPoems = poems.slice((poemPage - 1) * PAGE_SIZE, poemPage * PAGE_SIZE);
  const paginatedPinyins = pinyins.slice((pinyinPage - 1) * PAGE_SIZE, pinyinPage * PAGE_SIZE);
  const poemTotalPages = Math.ceil(poems.length / PAGE_SIZE);
  const pinyinTotalPages = Math.ceil(pinyins.length / PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] md:w-[70vw] lg:w-[50vw] max-w-[90vw] sm:max-w-[800px] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>本地数据管理</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            加载中...
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelected}
                disabled={selectedPoems.size === 0 && selectedPinyins.size === 0}
              >
                删除选中 ({selectedPoems.size + selectedPinyins.size})
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={updateSelected}
                disabled={selectedPoems.size === 0 || updating}
              >
                {updating
                  ? `更新中 (${updateProgress.current}/${updateProgress.total})`
                  : `更新选中 (${selectedPoems.size})`}
              </Button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("poems")}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "poems"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                诗词缓存 ({poems.length})
              </button>
              <button
                onClick={() => setActiveTab("pinyins")}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "pinyins"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                拼音缓存 ({pinyins.length})
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === "poems" ? (
                poems.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    暂无缓存数据
                  </div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="w-10 px-2 py-2 text-left">
                            <Checkbox
                              checked={poems.length > 0 && selectedPoems.size === poems.length}
                              onCheckedChange={toggleAllPoems}
                            />
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">ID</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">标题</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">作者</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">朝代</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPoems.map((poem) => (
                          <tr key={poem.id} className="border-b hover:bg-muted/30">
                            <td className="px-2 py-2">
                              <Checkbox
                                checked={selectedPoems.has(poem.id)}
                                onCheckedChange={() => togglePoem(poem.id)}
                              />
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">{poem.id}</td>
                            <td className="px-2 py-2">{poem.poem?.title || "-"}</td>
                            <td className="px-2 py-2 text-muted-foreground">{poem.poem?.author || "-"}</td>
                            <td className="px-2 py-2 text-muted-foreground">{poem.poem?.dynasty || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {poemTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 py-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPoemPage(1)}
                          disabled={poemPage === 1}
                        >
                          首页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPoemPage((p) => Math.max(1, p - 1))}
                          disabled={poemPage === 1}
                        >
                          上一页
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          第 {poemPage} / {poemTotalPages} 页
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPoemPage((p) => Math.min(poemTotalPages, p + 1))}
                          disabled={poemPage === poemTotalPages}
                        >
                          下一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPoemPage(poemTotalPages)}
                          disabled={poemPage === poemTotalPages}
                        >
                          尾页
                        </Button>
                      </div>
                    )}
                  </>
                )
              ) : pinyins.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  暂无缓存数据
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="w-10 px-2 py-2 text-left">
                          <Checkbox
                            checked={pinyins.length > 0 && selectedPinyins.size === pinyins.length}
                            onCheckedChange={toggleAllPinyins}
                          />
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">诗词ID</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">标题</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPinyins.map((pinyin) => (
                        <tr key={pinyin.poem_id} className="border-b hover:bg-muted/30">
                          <td className="px-2 py-2">
                            <Checkbox
                              checked={selectedPinyins.has(pinyin.poem_id)}
                              onCheckedChange={() => togglePinyin(pinyin.poem_id)}
                            />
                          </td>
                          <td className="px-2 py-2 text-muted-foreground">{pinyin.poem_id}</td>
                          <td className="px-2 py-2">{pinyin.title?.[0] || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pinyinTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPinyinPage(1)}
                        disabled={pinyinPage === 1}
                      >
                        首页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPinyinPage((p) => Math.max(1, p - 1))}
                        disabled={pinyinPage === 1}
                      >
                        上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        第 {pinyinPage} / {pinyinTotalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPinyinPage((p) => Math.min(pinyinTotalPages, p + 1))}
                        disabled={pinyinPage === pinyinTotalPages}
                      >
                        下一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPinyinPage(pinyinTotalPages)}
                        disabled={pinyinPage === pinyinTotalPages}
                      >
                        尾页
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
