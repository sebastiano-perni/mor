import { useParams, Link } from "wouter";
import { useGetJob, getGetJobQueryKey, useCancelJob } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { JobStatusBadge } from "@/components/shared";
import { formatTime, formatDate, formatWaitTime } from "@/lib/utils";
import { ArrowLeft, XCircle, Cpu, HardDrive, Clock, Info, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function JobDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: job, isLoading } = useGetJob(id, { query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } });
  
  const cancelJob = useCancelJob();
  const queryClient = useQueryClient();

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this job?")) {
      cancelJob.mutate({ id }, {
        onSuccess: () => {
          toast.success("Job cancelled");
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
        },
        onError: () => toast.error("Failed to cancel job")
      });
    }
  };

  if (isLoading) return <div className="animate-pulse p-8">Loading job...</div>;
  if (!job) return <div>Job not found</div>;

  const isCancellable = job.status === "queued" || job.status === "running" || job.status === "scheduled";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 text-sm mb-6">
        <Link href="/jobs" className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{job.jobName}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="text-muted-foreground font-mono text-sm">
            Job ID: {job.id} • Partition: {job.partition}
          </div>
        </div>
        
        <div className="flex gap-3">
          {isCancellable && (
            <Button variant="destructive" onClick={handleCancel} className="gap-2">
              <XCircle size={16} /> Cancel Job
            </Button>
          )}
        </div>
      </div>

      {job.status === "running" && job.progress !== null && job.progress !== undefined && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-end mb-2">
              <span className="font-medium text-primary">Execution Progress</span>
              <span className="font-mono font-bold text-xl text-primary">{Math.round(job.progress)}%</span>
            </div>
            <Progress value={job.progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Started: {formatTime(job.startedAt)}</span>
              <span>Est. completion: {formatTime(job.estimatedCompletedAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {job.status === "queued" && job.queuePosition && (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
              #{job.queuePosition}
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-400">Position in Queue</h3>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                Estimated to start at {formatTime(job.estimatedStartAt)}. Priority level {job.priority}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border">
                <Cpu size={24} className="text-muted-foreground mb-2" />
                <span className="text-2xl font-bold font-mono">{job.cpuRequired}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Cores</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border">
                <Zap size={24} className="text-muted-foreground mb-2" />
                <span className="text-2xl font-bold font-mono">{job.gpuRequired || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">GPUs</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border">
                <HardDrive size={24} className="text-muted-foreground mb-2" />
                <span className="text-2xl font-bold font-mono">{job.memoryGB}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">GB Mem</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
              <Clock className="text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-medium">Wall Time Requested</div>
                <div className="text-muted-foreground text-sm">{job.wallHours} hours maximum</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline & Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-muted ml-3 pl-6 space-y-6">
              
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                <div className="text-sm font-medium">Submitted</div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatDate(job.submittedAt)}</div>
              </div>

              {job.scheduledFor && (
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-secondary ring-4 ring-background" />
                  <div className="text-sm font-medium">Scheduled</div>
                  <div className="text-xs text-muted-foreground mt-0.5">For {formatDate(job.scheduledFor)}</div>
                </div>
              )}

              {job.startedAt && (
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-background" />
                  <div className="text-sm font-medium">Execution Started</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(job.startedAt)}</div>
                </div>
              )}

              {job.completedAt && (
                <div className="relative">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ring-4 ring-background ${job.status === 'failed' ? 'bg-destructive' : 'bg-emerald-500'}`} />
                  <div className="text-sm font-medium">{job.status === 'failed' ? 'Failed' : 'Completed'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(job.completedAt)}</div>
                </div>
              )}

            </div>

            {job.note && (
              <div className="mt-8 pt-6 border-t">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Info size={16} className="text-muted-foreground" />
                  User Notes
                </div>
                <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border">
                  {job.note}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
