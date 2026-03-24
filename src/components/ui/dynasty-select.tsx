"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynastyArr } from "@/config/poem";

type Dyn = { value: string; label: string };

const DYNASTY_OPTIONS: Dyn[] = [
  { value: "all", label: "全部朝代" },
  ...DynastyArr.map((d) => ({ value: d, label: d }))
];

export function DynastySelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "all")}>
      <SelectTrigger>
        <SelectValue>{DYNASTY_OPTIONS.find((d) => d.value === value)?.label ?? "全部朝代"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {DYNASTY_OPTIONS.map((d) => (
          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { DYNASTY_OPTIONS };
