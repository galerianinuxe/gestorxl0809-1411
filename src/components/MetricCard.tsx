import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number;
  subValue?: string;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  iconColor = "text-emerald-500",
  label,
  value,
  subValue,
  onClick,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "bg-slate-700 border-slate-600",
        onClick && "cursor-pointer hover:bg-slate-600 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn("h-5 w-5", iconColor)} />
          <span className="text-slate-300 text-sm md:text-base">{label}</span>
        </div>
        <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">
          {value}
        </div>
        {subValue && (
          <div className="text-sm text-slate-400 mt-1">{subValue}</div>
        )}
        {onClick && (
          <div className="text-xs text-slate-500 mt-1">Clique para detalhes →</div>
        )}
      </CardContent>
    </Card>
  );
}
