import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { openaiClient } from "@/lib/openai";

type ErrorAnalyzerProps = {
  connectionId: number;
  onErrorAnalyzed?: () => void;
};

export default function ErrorAnalyzer({ connectionId, onErrorAnalyzed }: ErrorAnalyzerProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [errorContext, setErrorContext] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!errorMessage.trim()) {
      toast({
        title: "Empty error message",
        description: "Please enter an error message to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await openaiClient.analyzeError(
        connectionId, 
        errorMessage, 
        errorCode || undefined, 
        errorContext || undefined
      );
      setAnalysisResult(result);
      
      if (onErrorAnalyzed) {
        onErrorAnalyzed();
      }
      
      toast({
        title: "Error analyzed",
        description: "Analysis completed successfully",
      });
    } catch (error) {
      console.error("Error analysis failed:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze the error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exampleErrors = [
    {
      message: "SQL compilation error: Object 'SALES.CUSTOMERS' does not exist or not authorized.",
      code: "2003",
      context: "Attempting to run a query on the SALES.CUSTOMERS table"
    },
    {
      message: "Numeric overflow: Scaled number is greater than allowed range for DECIMAL(10,2).",
      code: "100046",
      context: "Running an INSERT operation on a financial transactions table"
    },
    {
      message: "Execution error: Join between tables results in too many rows.",
      code: "100183",
      context: "Performing a JOIN between ORDERS and PRODUCTS without proper filtering"
    }
  ];

  const useExampleError = () => {
    const example = exampleErrors[Math.floor(Math.random() * exampleErrors.length)];
    setErrorMessage(example.message);
    setErrorCode(example.code);
    setErrorContext(example.context);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="errorMessage">Error Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="errorMessage"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                className="mt-1 font-mono"
                placeholder="Paste your Snowflake error message here"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="errorCode">Error Code (Optional)</Label>
                <Input
                  id="errorCode"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., 1003, 2003, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="errorContext">Context (Optional)</Label>
                <Input
                  id="errorContext"
                  value={errorContext}
                  onChange={(e) => setErrorContext(e.target.value)}
                  className="mt-1"
                  placeholder="What were you trying to do?"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-neutral-500">Need inspiration?</span>{" "}
                <button 
                  className="text-primary hover:text-primary-dark" 
                  onClick={useExampleError}
                >
                  Use example error
                </button>
              </div>
              
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Analyze Error
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isAnalyzing ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-24 w-full" />
              
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-24 w-full" />
              
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Root Cause
              </h3>
              <div className="bg-neutral-50 p-4 rounded-md text-neutral-700">
                {analysisResult.analysis?.rootCause || "No root cause identified"}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Recommended Solution
              </h3>
              <div className="bg-neutral-50 p-4 rounded-md text-neutral-700">
                {analysisResult.analysis?.solution || "No solution provided"}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Prevention Measures
              </h3>
              <div className="bg-neutral-50 p-4 rounded-md text-neutral-700">
                {analysisResult.analysis?.preventionMeasures || "No prevention measures provided"}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
