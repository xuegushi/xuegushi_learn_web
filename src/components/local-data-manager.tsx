"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllFromDB, deleteFromDB, setToDB, STORES } from "@/lib/db";
import { FilterSection } from "./local-data-manager/filter-section";

interface PoemCache {
  id: number;
  poem?: {
    id?: number;
    title?: string;
    author?: string;
    dynasty?: string;
    type?: string;
    xu?: string | null;
    intro?: string;
    background?: string;
    content?: {
      content?: string[];
    };
  };
  detail?: {
    yi?: { content?: string[] };
    zhu?: { content?: string[] };
    shangxi?: { content?: string[] };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface PinyinCache {
  poem_id: number;
  title?: string[];
  title_cn?: string;
  author?: string;
  dynasty?: string;
  content?: string[][];
  createdAt?: string;
  updatedAt?: string;
}

interface LocalDataManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CacheItem {
  id: number;
  poem?: PoemCache["poem"];
  detail?: PoemCache["detail"];
  pinyin?: PinyinCache;
  hasPinyin: boolean;
}

const PAGE_SIZE = 10;

export function LocalDataManager({ open, onOpenChange }: LocalDataManagerProps) {
  const [items, setItems] = useState<CacheItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [previewItem, setPreviewItem] = useState<CacheItem | null>(null);
  const [keyword, setKeyword] = useState("");
  const [filterDynasty, setFilterDynasty] = useState("不限");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [poemData, pinyinData] = await Promise.all([
      getAllFromDB<PoemCache>(STORES.POEMS),
      getAllFromDB<PinyinCache>(STORES.PINYIN),
    ]);

    // Sort by update time descending (most recent first)
    const sortedPoemData = [...poemData].sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || '';
      const timeB = b.updatedAt || b.createdAt || '';
      return timeB.localeCompare(timeA); // Descending order
    });

    const pinyinMap = new Map<number, PinyinCache>();
    pinyinData.forEach((p) => pinyinMap.set(p.poem_id, p));

    const merged: CacheItem[] = sortedPoemData.map((poem) => ({
      id: poem.id,
      poem: poem.poem,
      detail: poem.detail,
      pinyin: pinyinMap.get(poem.poem?.id || poem.id),
      hasPinyin: pinyinMap.has(poem.poem?.id || poem.id),
    }));

    setItems(merged);
    setSelectedIds(new Set());
    setPage(1);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [open, loadData]);

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const deleteSelected = async () => {
    for (const id of selectedIds) {
      const item = items.find((i) => i.id === id);
      if (item) {
        await deleteFromDB(STORES.POEMS, id);
        const poemId = item.poem?.id || id;
        await deleteFromDB(STORES.PINYIN, poemId);
      }
    }
    await loadData();
  };

  const updateSelected = async () => {
    if (selectedIds.size === 0) return;
    setUpdating(true);
    setUpdateProgress({ current: 0, total: selectedIds.size });
    let count = 0;

    for (const id of selectedIds) {
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
          await setToDB(STORES.PINYIN, {
            poem_id: data.poem.id,
            ...pinyinData,
            title_cn: data.poem?.title || "",
            author: data.poem?.author || "",
            dynasty: data.poem?.dynasty || "",
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch {
        // Continue
      }
      count++;
      setUpdateProgress({ current: count, total: selectedIds.size });
    }

    setUpdating(false);
    await loadData();
  };

  // 筛选
  const filteredItems = items.filter((item) => {
    const matchKeyword = !keyword ||
      (item.poem?.title?.includes(keyword) || item.poem?.author?.includes(keyword));
    const matchDynasty = filterDynasty === "不限" || item.poem?.dynasty === filterDynasty;
    return matchKeyword && matchDynasty;
  });

  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] md:w-[70vw] lg:w-[50vw] max-w-[90vw] sm:max-w-[800px] max-h-[80vh] flex flex-col p-0 !gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>本地数据管理</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              加载中...
            </div>
          ) : (
            <>
              <div className="px-6 py-2 border-b flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0}
                >
                  删除选中 ({selectedIds.size})
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={updateSelected}
                  disabled={selectedIds.size === 0 || updating}
                >
                  {updating
                    ? `更新中 (${updateProgress.current}/${updateProgress.total})`
                    : `更新选中 (${selectedIds.size})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadData()}
                  className="ml-2"
                >
                  刷新数据
                </Button>
              </div>

              <FilterSection
                keyword={keyword}
                onKeywordChange={(v) => { setKeyword(v); setPage(1); }}
                dynasty={filterDynasty}
                onDynastyChange={(v) => { setFilterDynasty(v ?? ''); setPage(1); }}
                totalCount={filteredItems.length}
              />

              <div className="flex-1 overflow-auto">
                {filteredItems.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    {items.length === 0 ? "暂无缓存数据" : "没有找到匹配的缓存数据"}
                  </div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="w-10 px-2 py-2 text-left">
                            <Checkbox
                              checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                              onCheckedChange={toggleAll}
                            />
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">ID</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">标题</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">朝代</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">作者</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">拼音</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">创建时间</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">更新时间</th>
                          <th className="w-16 px-2 py-2 text-left text-xs font-medium text-muted-foreground">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-muted/30">
                            <td className="px-2 py-2">
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                              />
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">{item.id}</td>
                            <td className="px-2 py-2">{item.poem?.title || "-"}</td>
                            <td className="px-2 py-2 text-muted-foreground">{item.poem?.dynasty || "-"}</td>
                            <td className="px-2 py-2 text-muted-foreground">{item.poem?.author || "-"}</td>
                            <td className="px-2 py-2 text-center">
                              {item.hasPinyin ? (
                                <span className="text-xs">✓</span>
                              ) : (
                                <span className="text-xs">✗</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {item.poem?.createdAt ? new Date(item.poem.createdAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {item.poem?.updatedAt ? new Date(item.poem.updatedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-2 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setPreviewItem(item)}
                              >
                                预览
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 py-3 border-t">
                        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>首页</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
                        <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>下一页</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>尾页</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 预览弹窗 */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold px-3 border-b pb-2">
              {previewItem?.poem?.title || "预览"}
            </DialogTitle>
          </DialogHeader>
          {previewItem && (
            <ScrollArea className="h-[60vh] pr-4 px-3">
              <div className="space-y-6">
                {/* 标题+拼音 */}
                <div className="text-center">
                  <div className="flex justify-center gap-1 flex-wrap mb-3">
                    {(previewItem.poem?.title || "").split("").map((char, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-5">
                          {previewItem.pinyin?.title?.[idx] || ""}
                        </span>
                        <span className="text-2xl font-bold">{char}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 作者信息 */}
                <div className="text-center text-sm font-medium text-muted-foreground">
                  {previewItem.poem?.author} [{previewItem.poem?.dynasty}]
                </div>

                {/* 诗词正文 */}
                {previewItem.poem?.content?.content && (
                  <div className="pt-0">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      {previewItem.poem.xu && (
                        <div className="text-center text-muted-foreground text-sm mb-2 italic">
                          {previewItem.poem.xu}
                        </div>
                      )}
                      <div className={previewItem.poem?.type === "文言文" ? "text-left" : "text-center"}>
                        {previewItem.poem.content.content.map((line, lineIdx) => {
                          const chars = line.split("");
                          const pinyinLine = previewItem.pinyin?.content?.[lineIdx] || [];
                          return (
                            <div key={lineIdx} className="flex justify-center gap-1 mb-2 flex-wrap">
                              {chars.map((char, charIdx) => (
                                <div key={charIdx} className="flex flex-col items-center min-w-[1.5rem]">
                                  <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-5">
                                    {previewItem.hasPinyin ? (pinyinLine[charIdx] || "") : ""}
                                  </span>
                                  <span className="text-lg">{char}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 译文 */}
                {previewItem.detail?.yi?.content && (
                  <DetailSection title="译文" content={previewItem.detail.yi.content} />
                )}

                {/* 注释 */}
                {previewItem.detail?.zhu?.content && (
                  <DetailSection title="注释" content={previewItem.detail.zhu.content} isHtml />
                )}

                {/* 简介/背景 */}
                {(previewItem.poem?.intro || previewItem.poem?.background) && (
                  <DetailSection
                    title={previewItem.poem?.intro ? "简介" : "创作背景"}
                    content={[previewItem.poem?.intro || previewItem.poem?.background || ""]}
                    isHtml
                  />
                )}

                {/* 赏析 */}
                {previewItem.detail?.shangxi?.content && (
                  <DetailSection title="赏析" content={previewItem.detail.shangxi.content} isHtml />
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 详情章节组件 */
function DetailSection({ title, content, isHtml }: { title: string; content: string[]; isHtml?: boolean }) {
  return (
    <div className="pb-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        <h3 className="font-semibold text-base">{title}</h3>
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      </div>
      {isHtml ? (
        <div
          className="text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.join("") }}
        />
      ) : (
        content.map((text, idx) => (
          <p key={idx} className="text-muted-foreground leading-relaxed">
            {text}
          </p>
        ))
      )}
    </div>
  );
}
