// apps/web/components/admin/StatsCard.tsx
import { Card, CardBody } from "@/components/ui/Card";

interface StatsCardProps {
  title: string;
  value: string | number | null | undefined;

  // Optional
  subtext?: string;
  loading?: boolean;

  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
}

function formatValue(v: StatsCardProps["value"]) {
  if (v === null || v === undefined) return "—";
  return typeof v === "number" ? v.toLocaleString() : v;
}

export default function StatsCard({
  title,
  value,
  subtext,
  loading = false,
  change,
  changeType = "neutral",
  icon,
}: StatsCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 mb-1">{title}</p>

            {loading ? (
              <div className="mt-1 h-7 w-24 rounded bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-[#111827]">{formatValue(value)}</p>
            )}

            {subtext && !loading && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}

            {change && !loading && (
              <p
                className={`text-sm mt-2 ${
                  changeType === "positive"
                    ? "text-green-600"
                    : changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {change}
              </p>
            )}
          </div>

          {icon && (
            <div className="w-12 h-12 bg-[#1E2A78]/10 rounded-lg flex items-center justify-center text-2xl shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
