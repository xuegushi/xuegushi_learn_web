"use client";

import { CatalogItem, CatalogDetail } from "@/types/poem";
import { Database } from "lucide-react";
import { RadioGroup } from "@/components/ui/radio-group";
import { ChoiceCard } from "@/components/learn/choice-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface SidebarProps {
  catalogList: CatalogItem[];
  catalogDetail: CatalogDetail | null;
  system: string;
  selectedFascicule: string;
  showFirstChar: boolean;
  showLastChar: boolean;
  showRandomChar: boolean;
  onSystemChange: (catalogId: string | null) => void;
  onFasciculeChange: (fasciculeId: string | null) => void;
  onShowFirstCharChange: (value: boolean) => void;
  onShowLastCharChange: (value: boolean) => void;
  onShowRandomCharChange: (value: boolean) => void;
  onLocalDataClick: () => void;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
  mode: "recite" | "learn";
  onModeChange: (mode: "recite" | "learn") => void;
  collapsed: boolean;
  onCollapse: () => void;
}

export function Sidebar({
  catalogList,
  catalogDetail,
  system,
  selectedFascicule,
  showFirstChar,
  showLastChar,
  showRandomChar,
  onSystemChange,
  onFasciculeChange,
  onShowFirstCharChange,
  onShowLastCharChange,
  onShowRandomCharChange,
  onLocalDataClick,
  sidebarOpen,
  onSidebarClose,
  mode,
  onModeChange,
  collapsed,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCollapse,
}: SidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onSidebarClose}
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 overflow-y-hidden md:z-auto border-r bg-gray-50 dark:bg-gray-800 h-full transition-all duration-300
          ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full"}
          ${collapsed ? "md:w-0 md:-translate-x-full" : "md:w-72 md:translate-x-0"}`}>
        <ScrollArea className="h-[calc(100vh-56px-40px)] md:h-[calc(100vh-66px-48px)] p-4 pb-16">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="font-semibold text-lg">筛选</h2>
            <button onClick={onSidebarClose} className="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 模式选择 */}
          <div>
            <h2 className="font-semibold mb-3">模式</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["recite", "learn"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                    mode === m
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  {m === "recite" ? "背诵模式" : "学习模式"}
                </button>
              ))}
            </div>
          </div>

          {/* 选集 - Accordion 包裹 */}
          <Accordion
            type="single"
            collapsible
            defaultValue="catalog"
            className="mb-2">
            <AccordionItem value="catalog">
              <AccordionTrigger className="font-semibold">
                选集
              </AccordionTrigger>
              <AccordionContent>
                {/* <ScrollArea className="h-30"> */}
                <div className="pr-4">
                  <RadioGroup value={system} onValueChange={onSystemChange}>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogList.map((item) => (
                        <ChoiceCard
                          key={item.catalog}
                          value={item.catalog}
                          title={item.catalog_name}
                          selected={system === item.catalog}
                        />
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                {/* </ScrollArea> */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 分册 - Accordion 包裹 */}
          <Accordion
            type="single"
            collapsible
            defaultValue="fascicule"
            className="mb-2">
            <AccordionItem value="fascicule">
              <AccordionTrigger className="font-semibold">
                分册
              </AccordionTrigger>
              <AccordionContent>
                {/* <ScrollArea className="h-30"> */}
                <div className="pr-4">
                  <RadioGroup
                    value={selectedFascicule}
                    onValueChange={onFasciculeChange}>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogDetail?.fasciculeList?.map((fasc) => (
                        <ChoiceCard
                          key={fasc._id}
                          value={fasc._id}
                          title={fasc.fascicule_name}
                          selected={selectedFascicule === fasc._id}
                        />
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                {/* </ScrollArea> */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 背诵设置 - 仅背诵模式显示 */}
          {mode === "recite" && (
            <div>
              <h2 className="font-semibold mb-3">背诵设置</h2>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showRandomChar && !showFirstChar && !showLastChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
                  <input
                    type="radio"
                    name="reciteSetting"
                    checked={showRandomChar && !showFirstChar && !showLastChar}
                    onChange={() => {
                      onShowRandomCharChange(true);
                      onShowFirstCharChange(false);
                      onShowLastCharChange(false);
                    }}
                    className="w-3 h-3"
                  />
                  随机显示
                </label>
                <label
                  className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showFirstChar && !showLastChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
                  <input
                    type="radio"
                    name="reciteSetting"
                    checked={showFirstChar && !showLastChar}
                    onChange={() => {
                      onShowFirstCharChange(true);
                      onShowLastCharChange(false);
                      onShowRandomCharChange(false);
                    }}
                    className="w-3 h-3"
                  />
                  显示首字
                </label>
                <label
                  className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showLastChar && !showFirstChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
                  <input
                    type="radio"
                    name="reciteSetting"
                    checked={showLastChar && !showFirstChar}
                    onChange={() => {
                      onShowLastCharChange(true);
                      onShowFirstCharChange(false);
                      onShowRandomCharChange(false);
                    }}
                    className="w-3 h-3"
                  />
                  显示尾字
                </label>
                <label
                  className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${!showFirstChar && !showLastChar && !showRandomChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
                  <input
                    type="radio"
                    name="reciteSetting"
                    checked={!showFirstChar && !showLastChar && !showRandomChar}
                    onChange={() => {
                      onShowFirstCharChange(false);
                      onShowLastCharChange(false);
                      onShowRandomCharChange(false);
                    }}
                    className="w-3 h-3"
                  />
                  隐藏文字
                </label>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* 本地数据管理 - 固定到底部 */}
        <div
          className={`absolute bottom-0 left-0 right-0  bg-gray-50 dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-600`}>
          <button
            onClick={onLocalDataClick}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center gap-2">
            <Database className="h-4 w-4" />
            本地数据管理
          </button>
        </div>
      </aside>
    </>
  );
}
