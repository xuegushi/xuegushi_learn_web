"use client";

import React from "react";

export function HomeGuide() {
  return (
    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm" role="note" aria-label="首页引导">
      <span className="font-semibold">引导：</span>
      学习模式帮助你理解诗词结构、拼音与注释/译文，背诵模式帮助你进行记忆巩固和进度汇总。
      点击下方卡片进入对应入口，开始你的学习旅程。
    </div>
  );
}
