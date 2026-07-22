import { useState } from "react";
import { useListJobs, useCancelJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { JobStatusBadge } from "@/components/shared";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, XCircle, Plus } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Jobs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: jobs, isLoading } = useListJobs(queryParams);
  const cancelJob = useCancelJob();
  const queryClient = useQueryClient();

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this job?")) {
      cancelJob.mutate({ id }, {
        onSuccess: () => {
          toast.success("Job cancelled");
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey(queryParams) });
        },
        onError: () => toast.error("Failed to cancel job")
      });
    }
  };

  const filteredJobs = jobs?.filter(job => 
    job.jobName.toLowerCase().includes(search.toLowerCase()) || 
    job.id.toString().includes(search)
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">My Jobs</h1>
          <p className="text-muted-foreground">Manage your computation tasks.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="gap-2"><Plus size={16} /> Submit New Job</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by name or ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Partition</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading jobs...</TableCell>
              </TableRow>
            ) : filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No jobs found matching criteria.</TableCell>
              </TableRow>
            ) : (
              filteredJobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{job.id}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/jobs/${job.id}`} className="hover:underline hover:text-primary">
                      {job.jobName}
                    </Link>
                  </TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell>{job.partition}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.cpuRequired}c / {job.gpuRequired || 0}g / {job.memoryGB}gb
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(job.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                      {(job.status === "queued" || job.status === "running" || job.status === "scheduled") && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancel(job.id)}
                          title="Cancel Job"
                        >
                          <XCircle size={18} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
