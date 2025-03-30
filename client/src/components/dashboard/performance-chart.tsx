import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";

type PerformanceChartProps = {
  className?: string;
};

export default function PerformanceChart({ className = "" }: PerformanceChartProps) {
  const [period, setPeriod] = useState<"7days" | "30days">("30days");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        setLoading(true);
        const data = await snowflakeClient.getPerformanceData(period);
        setPerformanceData(data);
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
        toast({
          title: "Failed to load performance data",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPerformanceData();
  }, [period, toast]);

  return (
    <Card className={`shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Query Performance Over Time</h2>
          <div className="flex space-x-3">
            <Button
              size="sm"
              variant={period === "7days" ? "default" : "outline"}
              onClick={() => setPeriod("7days")}
            >
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant={period === "30days" ? "default" : "outline"}
              onClick={() => setPeriod("30days")}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
        
        <div className="mt-4 h-72 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : performanceData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
              No performance data available. Run some queries to see performance metrics.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Execution Time (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="originalTime"
                  name="Original Query Time"
                  stroke="#F56565"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="optimizedTime"
                  name="Optimized Query Time"
                  stroke="#38B2AC"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
