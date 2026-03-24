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
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { getAllFromDB, deleteFromDB, setToDB, STORES, getDBSize } from "@/lib/db";
import { FilterSection } from "./local-data-manager/filter-section";
import { Pagination } from "@/components/ui/pagination";

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
  createdAt?: string;
  updatedAt?: string;
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
  const [dbSize, setDbSize] = useState<string>("0.00");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // Sorting state
  type SortKey = 'id' | 'createdAt' | 'updatedAt';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'updatedAt',
    direction: 'desc'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [poemData, pinyinData] = await Promise.all([
      getAllFromDB<PoemCache>(STORES.POEMS),
      getAllFromDB<PinyinCache>(STORES.PINYIN),
    ]);

    // Sort based on sortConfig
    const sortedPoemData = [...poemData].sort((a, b) => {
      const valueA = a[sortConfig.key as keyof PoemCache];
      const valueB = b[sortConfig.key as keyof PoemCache];

      // Handle undefined/null values
      if (valueA === undefined || valueA === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (valueB === undefined || valueB === null) return sortConfig.direction === 'asc' ? -1 : 1;

      // For string values (like dates), use localeCompare
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // For numeric values (like ID)
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.direction === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }

      // Default fallback
      return 0;
    });

    const pinyinMap = new Map<number, PinyinCache>();
    pinyinData.forEach((p) => pinyinMap.set(p.poem_id, p));

    const merged: CacheItem[] = sortedPoemData.map((poem) => ({
      id: poem.id,
      poem: poem.poem,
      detail: poem.detail,
      createdAt: poem.createdAt,
      updatedAt: poem.updatedAt,
      pinyin: pinyinMap.get(poem.poem?.id || poem.id),
      hasPinyin: pinyinMap.has(poem.poem?.id || poem.id),
    }));

    setItems(merged);
    setSelectedIds(new Set());
    setPage(1);

    // Get DB size
    const { mb } = await getDBSize();
    setDbSize(mb);

    setLoading(false);
  }, [sortConfig]);

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
        // 1. 先请求诗词详情
        const res = await fetch(`https://api.xuegushi.com/api/poem/${id}?platform=web`);
        const data = await res.json();
        await setToDB(STORES.POEMS, { id, ...data });

        // 2. 再请求诗词拼音（顺序执行，不并发）
        if (data.poem?.id) {
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
      } catch {
        // Continue
      }
      count++;
      setUpdateProgress({ current: count, total: selectedIds.size });
    }

    setUpdating(false);
    await loadData();
  };

  const handleSortChange = (key: SortKey) => {
    setSortConfig(prev => {
      // If clicking on the same column, toggle direction
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // If clicking on a different column, set to ascending by default
      return { key, direction: 'asc' };
    });
    // Reset to first page when sorting changes
    setPage(1);
  };

  // 排序并筛选
  const sortedItems = [...items].sort((a, b) => {
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    // Handle undefined/null values
    if (valueA === undefined || valueA === null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (valueB === undefined || valueB === null) return sortConfig.direction === 'asc' ? -1 : 1;

    // For string values (like dates), use localeCompare
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortConfig.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // For numeric values (like ID)
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortConfig.direction === 'asc'
        ? valueA - valueB
        : valueB - valueA;
    }

    // Default fallback
    return 0;
  });

  const filteredItems = sortedItems.filter((item) => {
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
                  onClick={() => setDeleteConfirmOpen(true)}
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
                <span className="ml-auto text-xs text-muted-foreground self-center">
                  本地大小：{dbSize} MB
                </span>
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
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="w-10 px-2 py-2 text-left">
                            <Checkbox
                              checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                              onCheckedChange={toggleAll}
                            />
                          </th>
                          <th className={`px-2 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/100 ${sortConfig.key === 'id' ? 'font-semibold' : ''}`} onClick={() => handleSortChange('id')}>
                            <span className="flex items-center gap-1">
                              ID
                              {sortConfig.key === 'id' ? (
                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </span>
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">标题</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">朝代</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">作者</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">拼音</th>
                          <th className={`px-2 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/100 ${sortConfig.key === 'createdAt' ? 'font-semibold' : ''}`} onClick={() => handleSortChange('createdAt')}>
                            <span className="flex items-center gap-1">
                              创建时间
                              {sortConfig.key === 'createdAt' ? (
                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </span>
                          </th>
                          <th className={`px-2 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/100 ${sortConfig.key === 'updatedAt' ? 'font-semibold' : ''}`} onClick={() => handleSortChange('updatedAt')}>
                            <span className="flex items-center gap-1">
                              更新时间
                              {sortConfig.key === 'updatedAt' ? (
                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </span>
                          </th>
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
                            <td className="px-2 py-2 max-w-[160px] truncate">{item.poem?.title || "-"}</td>
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
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
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
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalCount={filteredItems.length}
                        onPageChange={setPage}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            确定要删除选中的 {selectedIds.size} 条数据吗？此操作不可恢复。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await deleteSelected();
                setDeleteConfirmOpen(false);
              }}>
              确认删除
            </Button>
          </div>
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
