import { useState } from "react";
import { useListAllJobs, useUpdateJobAdmin, getListAllJobsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/shared";
import { formatTime, formatWaitTime } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Search, StopCircle, ArrowUpCircle } from "lucide-react";

export default function AdminJobs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: jobs, isLoading } = useListAllJobs(queryParams);
  
  const updateJob = useUpdateJobAdmin();
  const queryClient = useQueryClient();

  const handleStatusAction = (id: number, action: "cancelled" | "priority_up") => {
    if (action === "cancelled") {
      if (!confirm("Force kill this job?")) return;
      updateJob.mutate({ id, data: { status: "cancelled" } }, {
        onSuccess: () => {
          toast.success(`Job ${id} cancelled`);
          queryClient.invalidateQueries({ queryKey: getListAllJobsQueryKey(queryParams) });
        }
      });
    } else if (action === "priority_up") {
      updateJob.mutate({ id, data: { priority: 999 } }, {
        onSuccess: () => {
          toast.success(`Job ${id} prioritized`);
          queryClient.invalidateQueries({ queryKey: getListAllJobsQueryKey(queryParams) });
        }
      });
    }
  };

  const filteredJobs = jobs?.filter(j => 
    j.jobName.toLowerCase().includes(search.toLowerCase()) || 
    j.userName.toLowerCase().includes(search.toLowerCase()) ||
    j.id.toString().includes(search)
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Global Queue</h1>
        <p className="text-muted-foreground">Monitor and intervene in all cluster jobs.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by job ID, name, or user..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading queue...</TableCell></TableRow>
            ) : filteredJobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{job.id}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{job.jobName}</TableCell>
                <TableCell className="text-sm">{job.userName}</TableCell>
                <TableCell><JobStatusBadge status={job.status} /></TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {job.cpuRequired}c / {job.gpuRequired || 0}g / {job.memoryGB}m
                </TableCell>
                <TableCell className="text-xs">{formatTime(job.submittedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {(job.status === 'queued') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10" 
                        title="Bump Priority"
                        onClick={() => handleStatusAction(job.id, 'priority_up')}
                      >
                        <ArrowUpCircle size={16} />
                      </Button>
                    )}
                    {(job.status === 'running' || job.status === 'queued') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        title="Force Kill"
                        onClick={() => handleStatusAction(job.id, 'cancelled')}
                      >
                        <StopCircle size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
