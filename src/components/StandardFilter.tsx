import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFilterChip } from "./MobileFilterChip";
import { MobileFilterSheet } from "./MobileFilterSheet";

export type FilterPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom" | "all";

interface StandardFilterProps {
  selectedPeriod: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
  showAllOption?: boolean;
  extraFilters?: React.ReactNode;
}

export function StandardFilter({
  selectedPeriod,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear,
  showAllOption = false,
  extraFilters,
}: StandardFilterProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Mobile: Compact chip + bottom sheet
  if (isMobile) {
    return (
      <>
        <div className="flex items-center justify-between mb-3 gap-2">
          <MobileFilterChip
            selectedPeriod={selectedPeriod}
            startDate={startDate}
            endDate={endDate}
            onClick={() => setSheetOpen(true)}
            onClear={onClear}
          />
          
          {/* Extra filters inline on mobile if simple */}
          {extraFilters && (
            <div className="flex-1 flex justify-end">
              {extraFilters}
            </div>
          )}
        </div>

        <MobileFilterSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          endDate={endDate}
          onEndDateChange={onEndDateChange}
          onApply={() => setSheetOpen(false)}
          onClear={onClear}
          showAllOption={showAllOption}
        />
      </>
    );
  }

  // Desktop/Tablet: Full filter card
  return (
    <Card className="bg-slate-700 border-slate-600 mb-3">
      <CardContent className="p-3">
        <div className="flex flex-col gap-3">
          {/* Main filters row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            {/* Período */}
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-slate-300 text-sm mb-1 block">Período</Label>
              <Select value={selectedPeriod} onValueChange={(v) => onPeriodChange(v as FilterPeriod)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="daily" className="text-white">Hoje</SelectItem>
                  <SelectItem value="weekly" className="text-white">Última Semana</SelectItem>
                  <SelectItem value="monthly" className="text-white">Último Mês</SelectItem>
                  <SelectItem value="yearly" className="text-white">Último Ano</SelectItem>
                  <SelectItem value="custom" className="text-white">Personalizado</SelectItem>
                  {showAllOption && <SelectItem value="all" className="text-white">Todos</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Data Inicial */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">
                <Calendar className="h-3 w-3 inline mr-1" />
                Início
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white h-10"
                disabled={selectedPeriod !== "custom"}
              />
            </div>

            {/* Data Final */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">
                <Calendar className="h-3 w-3 inline mr-1" />
                Fim
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white h-10"
                disabled={selectedPeriod !== "custom"}
              />
            </div>

            {/* Limpar */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={onClear}
                className="h-10 w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Extra filters row */}
          {extraFilters && (
            <div className="border-t border-slate-600 pt-3">
              {extraFilters}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
