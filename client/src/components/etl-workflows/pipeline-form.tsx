import { useState } from "react";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { openaiClient } from "@/lib/openai";

const formSchema = z.object({
  connectionId: z.string().min(1, "Connection is required"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  sourceDescription: z.string().min(10, "Source description must be at least 10 characters"),
  targetDescription: z.string().min(10, "Target description must be at least 10 characters"),
  businessRequirements: z.string().optional(),
  schedule: z.string().optional(),
});

type PipelineFormProps = {
  connections: any[];
  onSuccess: () => void;
};

export default function PipelineForm({ connections, onSuccess }: PipelineFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connectionId: connections.find(c => c.isActive)?.id.toString() || "",
      name: "",
      description: "",
      sourceDescription: "",
      targetDescription: "",
      businessRequirements: "",
      schedule: "Daily at 2:00 AM",
    },
  });
  
  const { formState } = form;
  const isSubmitting = formState.isSubmitting || isGenerating;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsGenerating(true);
      
      await openaiClient.generateEtlPipeline(
        parseInt(values.connectionId),
        values.name,
        values.description || "",
        values.sourceDescription,
        values.targetDescription,
        values.businessRequirements || "",
        values.schedule || ""
      );
      
      toast({
        title: "Pipeline created",
        description: "ETL pipeline has been successfully created",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Pipeline creation failed:", error);
      toast({
        title: "Pipeline creation failed",
        description: error instanceof Error ? error.message : "Failed to create the ETL pipeline",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const scheduleOptions = [
    "Hourly",
    "Daily at 2:00 AM",
    "Daily at 12:00 PM",
    "Weekly on Monday at 1:00 AM",
    "Monthly on the 1st at 3:00 AM",
    "Custom"
  ];

  return (
    <>
      <CardHeader>
        <CardTitle>Create New ETL Pipeline</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="connectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Snowflake Connection</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {connections.map((connection) => (
                        <SelectItem 
                          key={connection.id} 
                          value={connection.id.toString()}
                        >
                          {connection.name} {connection.isActive ? "(Active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SALES_DATA_SYNC" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scheduleOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this ETL pipeline" 
                      {...field} 
                      disabled={isSubmitting}
                      className="min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-neutral-900">Data Source and Target</h3>
              <p className="text-sm text-neutral-500">
                Provide detailed descriptions to generate an optimal ETL pipeline
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="sourceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the source data structure, format, and location. E.g., 'JSON data in S3 bucket with customer transactions including id, amount, and timestamp fields'" 
                      {...field} 
                      disabled={isSubmitting}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the target data structure and expectations. E.g., 'Snowflake table ANALYTICS.CUSTOMER_TRANSACTIONS with fields customer_id, transaction_amount, transaction_date, and category'" 
                      {...field} 
                      disabled={isSubmitting}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="businessRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific business rules or transformations required. E.g., 'Calculate daily totals by customer category and exclude transactions under $10'" 
                      {...field} 
                      disabled={isSubmitting}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Pipeline...
                </>
              ) : (
                "Create Pipeline"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </>
  );
}
