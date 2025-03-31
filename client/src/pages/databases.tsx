import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@/hooks/use-connection";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertCircle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConnectionRequiredWrapper } from "@/components/connection-required-wrapper";

type DatabasesProps = {
  user: any;
  onLogout: () => void;
};

type Database = {
  name: string; 
  business_org: string;
  account: string;
  bytes: number;
  size_tb: number; 
  monthly_cost: string;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 bytes";
  
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function Databases({ user, onLogout }: DatabasesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { toast } = useToast();
  
  // Use our connection context
  const { 
    activeConnection, 
    loading: connectionLoading, 
    error: connectionError 
  } = useConnection();

  // Fetch databases from Snowflake
  const { 
    data: databases,
    isLoading: databasesLoading,
    error: databasesError
  } = useQuery({
    queryKey: ['/api/snowflake/databases'],
    enabled: !!activeConnection,
    refetchOnWindowFocus: false
  });

  // Filter databases based on search term
  const filteredDatabases = Array.isArray(databases) 
    ? databases.filter((db: Database) => 
        db.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredDatabases.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentDatabases = filteredDatabases.slice(startIdx, endIdx);
  
  // Go to a specific page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const pageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of visible pages
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the start or end
    if (currentPage <= 2) {
      end = Math.min(totalPages - 1, maxVisiblePages - 1);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisiblePages + 2);
    }
    
    // Add ellipsis if necessary
    if (start > 2) {
      pages.push(-1); // -1 is a marker for ellipsis
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if necessary
    if (end < totalPages - 1) {
      pages.push(-2); // -2 is another marker for ellipsis
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <MainLayout user={user} onLogout={onLogout}>
      <ConnectionRequiredWrapper>
        <div className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {databasesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Loading databases...</span>
              </div>
            ) : databasesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {databasesError instanceof Error 
                    ? databasesError.message 
                    : "Failed to load databases. Please try again."}
                </AlertDescription>
              </Alert>
            ) : (
              <Card className="shadow">
                <CardHeader className="pb-3">
                  <CardTitle>My databases</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 space-y-2 sm:space-y-0">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        placeholder="Search databases..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-sm">Database</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Business org</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Account</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Size</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Monthly cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDatabases.length > 0 ? (
                          currentDatabases.map((db: Database, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                              <td className="py-3 px-4 text-blue-600 hover:underline cursor-pointer">{db.name}</td>
                              <td className="py-3 px-4">{db.business_org || "Slingshot"}</td>
                              <td className="py-3 px-4">{db.account}</td>
                              <td className="py-3 px-4">{db.size_tb ? `${db.size_tb.toFixed(2)} TB` : formatSize(db.bytes)}</td>
                              <td className="py-3 px-4">{db.monthly_cost}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              {searchTerm ? "No databases match your search" : "No databases found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredDatabases.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Rows per page:</span>
                        <Select 
                          value={rowsPerPage.toString()}
                          onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue placeholder="10" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-500">
                          {startIdx + 1} - {Math.min(endIdx, filteredDatabases.length)} of {filteredDatabases.length}
                        </span>
                      </div>

                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => goToPage(currentPage - 1)}
                              className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                          </PaginationItem>
                          
                          {pageNumbers().map((page, i) => (
                            page < 0 ? (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <span className="mx-1">...</span>
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  isActive={page === currentPage}
                                  onClick={() => goToPage(page)}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => goToPage(currentPage + 1)}
                              className={`${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ConnectionRequiredWrapper>
    </MainLayout>
  );
}