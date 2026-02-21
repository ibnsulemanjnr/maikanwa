import { Card, CardBody } from "@/components/ui/Card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatsCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-[#111827]">{value}</p>
            {change && (
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
            <div className="w-12 h-12 bg-[#1E2A78]/10 rounded-lg flex items-center justify-center text-2xl">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
