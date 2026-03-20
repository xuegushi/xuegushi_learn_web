import { DynastyArr } from "@/config/poem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSectionProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  dynasty: string;
  onDynastyChange: (value: string) => void;
  totalCount: number;
}

/**
 * 筛选组件：关键字搜索 + 朝代筛选
 */
export function FilterSection({
  keyword,
  onKeywordChange,
  dynasty,
  onDynastyChange,
  totalCount,
}: FilterSectionProps) {
  return (
    <div className="px-6 py-2 border-b flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="搜索标题或作者"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="px-3 py-1.5 border rounded-md text-sm bg-background w-48"
      />
      <Select value={dynasty} onValueChange={onDynastyChange}>
        <SelectTrigger className="w-32">
          <SelectValue>{dynasty}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DynastyArr.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">
        共 {totalCount} 条
      </span>
    </div>
  );
}
