import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { snowflakeClient } from "@/lib/snowflake";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  account: z.string().min(2, "Account is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.string().default("ACCOUNTADMIN"),
  warehouse: z.string().default("COMPUTE_WH"),
});

type ConnectionFormProps = {
  onSuccess: () => void;
};

export default function ConnectionForm({ onSuccess }: ConnectionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      account: "",
      username: "",
      password: "",
      role: "ACCOUNTADMIN",
      warehouse: "COMPUTE_WH",
    },
  });
  
  const { formState } = form;
  const isSubmitting = formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await snowflakeClient.testConnection(values);
      
      toast({
        title: "Connection created",
        description: "Successfully connected to Snowflake",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Snowflake",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>New Snowflake Connection</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Snowflake Connection" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="orgname-accountname" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Snowflake username" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your Snowflake password" 
                      {...field} 
                      disabled={isSubmitting} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ACCOUNTADMIN" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="COMPUTE_WH" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Testing connection...
                </div>
              ) : (
                "Create Connection"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
