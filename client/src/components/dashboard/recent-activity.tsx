import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { snowflakeClient } from "@/lib/snowflake";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type ActivityType = {
  id: number;
  userId: number;
  activityType: string;
  description: string;
  details: any;
  timestamp: string;
};

type RecentActivityProps = {
  className?: string;
};

export default function RecentActivity({ className = "" }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const data = await snowflakeClient.getActivityLogs(5);
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        toast({
          title: "Failed to load activity logs",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [toast]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "QUERY_OPTIMIZED":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary bg-opacity-10">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        );
      case "PIPELINE_CREATED":
      case "PIPELINE_UPDATED":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary bg-opacity-10">
            <svg className="h-5 w-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </span>
        );
      case "WARNING":
      case "CONNECTION_CREATED":
      case "CONNECTION_UPDATED":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-warning bg-opacity-10">
            <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        );
      case "ERROR_ANALYZED":
      case "ERROR":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-error bg-opacity-10">
            <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-neutral-300 bg-opacity-40">
            <svg className="h-5 w-5 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </span>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  return (
    <Card className={`shadow ${className}`}>
      <div className="px-6 py-5 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Recent Activity</h2>
      </div>
      
      <CardContent className="px-6 py-2 divide-y divide-neutral-200">
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            No recent activities found.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  {getActivityIcon(activity.activityType)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm font-medium text-neutral-900">
                    {activity.activityType.replace(/_/g, " ")}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">{activity.description}</div>
                  <div className="mt-2 text-xs text-neutral-400">
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-3 bg-neutral-50 rounded-b-lg border-t border-neutral-200 text-center">
        <a href="/activity" className="text-sm font-medium text-primary hover:text-primary-dark w-full">
          View all activity
        </a>
      </CardFooter>
    </Card>
  );
}
