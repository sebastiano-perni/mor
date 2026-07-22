import { useGetUserSummary, useListJobs, useGetResourceAvailability } from "@workspace/api-client-react";
import { StatCard, JobStatusBadge } from "@/components/shared";
import { Clock, CheckCircle2, Play, List, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime, formatWaitTime } from "@/lib/utils";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetUserSummary();
  const { data: jobs, isLoading: loadingJobs } = useListJobs({ status: "running" }); // Let's just fetch all or running for quick list
  const { data: allJobs } = useListJobs(); 
  const { data: resources } = useGetResourceAvailability();

  if (loadingSummary) return <div className="animate-pulse">Loading dashboard...</div>;

  const recentJobs = allJobs?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Researcher Dashboard</h1>
          <p className="text-muted-foreground">Overview of your computation tasks and resource allocation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/schedule">
            <Button variant="outline">Schedule Slot</Button>
          </Link>
          <Link href="/jobs/new">
            <Button className="gap-2"><Zap size={16} /> Submit Job</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Running Jobs" 
          value={summary?.runningJobs || 0} 
          icon={Play}
          trend="Currently active"
        />
        <StatCard 
          title="Queued Jobs" 
          value={summary?.queuedJobs || 0} 
          icon={List}
          trend="Waiting for resources"
        />
        <StatCard 
          title="Completed Today" 
          value={summary?.completedJobs || 0} 
          icon={CheckCircle2}
          trend="Out of total history"
        />
        <StatCard 
          title="Avg Wait Time" 
          value={formatWaitTime(summary?.avgWaitMinutes || 0)} 
          icon={Clock}
          trend="Based on your recent jobs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Jobs</CardTitle>
            <Link href="/jobs" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed mt-4">
                No recent jobs found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">#{job.id}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/jobs/${job.id}`} className="hover:underline hover:text-primary">
                          {job.jobName}
                        </Link>
                      </TableCell>
                      <TableCell><JobStatusBadge status={job.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(job.submittedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Cluster Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">CPU</span>
                <span className="text-sm font-mono">{resources?.availableCpus || 0} cores free</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${resources?.cpuUtilPercent || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{resources?.cpuUtilPercent || 0}% utilized</div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">GPU</span>
                <span className="text-sm font-mono">{resources?.availableGpus || 0} units free</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${resources?.gpuUtilPercent || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{resources?.gpuUtilPercent || 0}% utilized</div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm font-mono">{resources?.availableMemoryGB || 0} GB free</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${resources?.memoryUtilPercent || 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{resources?.memoryUtilPercent || 0}% utilized</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
