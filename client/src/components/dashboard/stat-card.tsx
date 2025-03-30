import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  iconBgColor: string;
};

export default function StatCard({ title, value, change, icon, iconBgColor }: StatCardProps) {
  return (
    <Card className="overflow-hidden shadow">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconBgColor}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-neutral-900">{value}</div>
                {change && (
                  <div className="flex items-center mt-1">
                    <span className="text-sm font-medium text-success">{change}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
