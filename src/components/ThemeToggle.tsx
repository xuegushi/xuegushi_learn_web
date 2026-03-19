"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme || "system"} onValueChange={(value) => { if (value) setTheme(value); }}>
      <SelectTrigger className="w-14 border-0">
        {theme === "light" && <Sun className="w-5 h-5" />}
        {theme === "dark" && <Moon className="w-5 h-5" />}
        {theme === "system" && <Monitor className="w-5 h-5" />}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            <span>白天</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            <span>夜间</span>
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            <span>跟随系统</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
