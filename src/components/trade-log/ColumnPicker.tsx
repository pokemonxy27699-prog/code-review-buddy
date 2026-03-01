import { ALL_COLUMNS, ColumnKey, saveVisibleColumns } from "@/lib/trade-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  visible: ColumnKey[];
  onChange: (cols: ColumnKey[]) => void;
}

export default function ColumnPicker({ visible, onChange }: Props) {
  const toggle = (key: ColumnKey) => {
    const next = visible.includes(key)
      ? visible.filter((c) => c !== key)
      : [...visible, key];
    onChange(next);
    saveVisibleColumns(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border/50">
          <SlidersHorizontal className="h-3 w-3" /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3 bg-card border-border/50" align="end">
        <p className="text-xs font-medium mb-2">Toggle Columns</p>
        <div className="space-y-1.5">
          {ALL_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={visible.includes(col.key)}
                onCheckedChange={() => toggle(col.key)}
                className="h-3.5 w-3.5"
              />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
