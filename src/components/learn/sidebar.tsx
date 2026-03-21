"use client";

import { CatalogItem, CatalogDetail } from "@/types/poem";
import { Database } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto border-r bg-gray-50 dark:bg-gray-800 overflow-y-auto h-full transition-all duration-300
          ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full"}
          ${collapsed ? "md:w-0 md:-translate-x-full" : "md:w-72 md:translate-x-0"}`}
      >
        <div className="flex h-full flex-col p-4 md:p-6">
          <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="font-semibold text-lg">筛选</h2>
            <button onClick={onSidebarClose} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  }`}
                >
                  {m === "recite" ? "背诵模式" : "学习模式"}
                </button>
              ))}
            </div>
          </div>

          {/* 选集 */}
          <div>
            <h2 className="font-semibold mb-3">选集</h2>
            <Select value={system} onValueChange={onSystemChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {catalogList.find((c) => c.catalog === system)?.catalog_name || "选择选集"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {catalogList.map((item) => (
                  <SelectItem key={item.catalog} value={item.catalog}>
                    {item.catalog_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 分册 */}
          <div>
            <h2 className="font-semibold mb-3">分册</h2>
            <Select value={selectedFascicule} onValueChange={onFasciculeChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {catalogDetail?.fasciculeList?.find((f) => f._id === selectedFascicule)?.fascicule_name || "选择分册"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {catalogDetail?.fasciculeList?.map((fasc) => (
                  <SelectItem key={fasc._id} value={fasc._id}>
                    {fasc.fascicule_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 背诵设置 - 仅背诵模式显示 */}
          {mode === "recite" && (
            <div>
            <h2 className="font-semibold mb-3">背诵设置</h2>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showRandomChar && !showFirstChar && !showLastChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
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
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showFirstChar && !showLastChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
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
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${showLastChar && !showFirstChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
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
              <label className={`flex items-center justify-center gap-1 text-xs cursor-pointer py-1.5 px-1.5 rounded border ${!showFirstChar && !showLastChar && !showRandomChar ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"}`}>
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
                都不显示
              </label>
            </div>
          </div>
          )}

          </div>

          {/* 本地数据管理 - 固定到底部 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onLocalDataClick}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <Database className="h-4 w-4" />
              本地数据管理
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
