"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PoemDetail, PinyinData } from "@/types/poem";

interface PoemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poemDetail: PoemDetail | null;
  pinyinData: PinyinData | null;
}

/**
 * 诗词详情弹窗
 * 显示完整诗词信息，包含拼音标注
 */
export function PoemDetailDialog({
  open,
  onOpenChange,
  poemDetail,
  pinyinData,
}: PoemDetailDialogProps) {
  if (!poemDetail) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold px-3 border-b pb-2">
            {poemDetail.poem?.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4 px-3">
          <div className="space-y-8">
            {/* 标题+拼音 */}
            <TitleWithPinyin title={poemDetail.poem?.title || ""} pinyin={pinyinData?.title} />

            {/* 作者信息 */}
            <div className="text-center text-sm font-medium text-muted-foreground">
              {poemDetail.poem?.author} [{poemDetail.poem?.dynasty}]
            </div>

            {/* 诗词正文 */}
            {poemDetail.poem?.content?.content && (
              <PoemContent
                content={poemDetail.poem.content.content}
                pinyin={pinyinData?.content}
                xu={poemDetail.poem.xu}
                type={poemDetail.poem?.type}
              />
            )}

            {/* 译文 */}
            {poemDetail.detail?.yi?.content && (
              <DetailSection title="译文" content={poemDetail.detail.yi.content} />
            )}

            {/* 注释 */}
            {poemDetail.detail?.zhu?.content && (
              <DetailSection title="注释" content={poemDetail.detail.zhu.content} isHtml />
            )}

            {/* 简介/背景 */}
            {(poemDetail.poem?.intro || poemDetail.poem?.background) && (
              <DetailSection
                title={poemDetail.poem?.intro ? "简介" : "创作背景"}
                content={[poemDetail.poem?.intro || poemDetail.poem?.background || ""]}
                isHtml
              />
            )}

            {/* 赏析 */}
            {poemDetail.detail?.shangxi?.content && (
              <DetailSection title="赏析" content={poemDetail.detail.shangxi.content} isHtml />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** 标题+拼音显示 */
function TitleWithPinyin({ title, pinyin }: { title: string; pinyin?: string[] }) {
  return (
    <div className="text-center">
      <div className="mb-3">
        <div className="flex justify-center gap-1 flex-wrap">
          {title.split("").map((char, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-5">
                {pinyin?.[idx] || ""}
              </span>
              <span className="text-2xl font-bold">{char}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 诗词正文+拼音 */
interface PoemContentProps {
  content: string[];
  pinyin?: string[][];
  xu?: string | null;
  type?: string;
}

function PoemContent({ content, pinyin, xu, type }: PoemContentProps) {
  return (
    <div className="pt-0">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        {/* 序 */}
        {xu && (
          <div className="text-center text-muted-foreground text-sm mb-2 italic">
            {xu}
          </div>
        )}

        {/* 正文 */}
        <div className={type === "文言文" ? "text-left" : "text-center"}>
          {content.map((line, lineIdx) => {
            const chars = line.split("");
            const pinyinLine = pinyin?.[lineIdx] || [];

            return (
              <div key={lineIdx} className="flex justify-center gap-1 mb-2 flex-wrap">
                {chars.map((char, charIdx) => (
                  <div key={charIdx} className="flex flex-col items-center min-w-[1.5rem]">
                    <span className="text-xs text-blue-500 dark:text-blue-400 leading-tight h-5">
                      {pinyinLine[charIdx] || ""}
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
  );
}

/** 详情章节 */
interface DetailSectionProps {
  title: string;
  content: string[];
  isHtml?: boolean;
}

function DetailSection({ title, content, isHtml }: DetailSectionProps) {
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
