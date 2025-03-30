import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginProps = {
  onLogin: (user: any) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const { formState } = form;
  const isSubmitting = formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const data = await apiRequest("POST", "/api/auth/login", values);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      onLogin(data.user);
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Please check your username and password",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.929l-7.071 7.071 1.414 1.414L12 7.757l5.657 5.657 1.414-1.414L12 4.929zM12 12.343l-7.071 7.071 1.414 1.414L12 15.172l5.657 5.657 1.414-1.414L12 12.343z"/>
            </svg>
            <span className="ml-2 text-2xl font-semibold text-primary">SnowAutoPilot</span>
          </div>
          <CardTitle className="text-xl text-center">Login to your account</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        disabled={isSubmitting}
                      />
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
                        placeholder="Enter your password"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Demo accounts: username: demo, password: password123
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
