import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonthLabel, shiftMonth, type MonthKey } from "@/lib/settlement";

export function SettlementMonthPicker({
  value,
  options,
  onChange,
}: {
  value: MonthKey;
  options: MonthKey[];
  onChange: (month: MonthKey) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="settlement-month">Hónap</Label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Előző hónap"
          onClick={() => onChange(shiftMonth(value, -1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id="settlement-month"
            className="w-full min-w-0 sm:w-52"
            aria-label="Hónap kiválasztása"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((m) => (
              <SelectItem key={m} value={m}>
                {formatMonthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Következő hónap"
          onClick={() => onChange(shiftMonth(value, 1))}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
