import { useGetUserSummary, useListJobs, useGetResourceAvailability } from "@workspace/api-client-react";
import { StatCard, JobStatusBadge } from "@/components/shared";
import {
  Clock, CheckCircle2, Play, List, Zap, BrainCircuit,
  ArrowRight, Cpu, HardDrive, Timer, TrendingUp, Info,
  ChevronRight, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatWaitTime, formatDuration, formatETA } from "@/lib/utils";

// ── Confidence helpers ────────────────────────────────────────────────────────

type Confidence = "high" | "medium" | "low";

function deriveConfidence(
  queuePosition: number | null,
  cpuUtil: number,
  gpuUtil: number,
): Confidence {
  const maxUtil = Math.max(cpuUtil, gpuUtil);
  if ((queuePosition ?? 0) <= 1 && maxUtil < 65) return "high";
  if ((queuePosition ?? 0) <= 3 && maxUtil < 85) return "medium";
  return "low";
}

const CONFIDENCE_STYLES: Record<Confidence, { label: string; dot: string; badge: string }> = {
  high:   { label: "High confidence",   dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  medium: { label: "Medium confidence", dot: "bg-amber-400",   badge: "bg-amber-500/10  text-amber-600  border-amber-500/20"  },
  low:    { label: "Low confidence",    dot: "bg-rose-400",    badge: "bg-rose-500/10   text-rose-600   border-rose-500/20"   },
};

function ConfidenceBadge({ level }: { level: Confidence }) {
  const s = CONFIDENCE_STYLES[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", s.badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

// ── Running job card ──────────────────────────────────────────────────────────

function RunningJobCard({ job, cpuUtil, gpuUtil }: { job: any; cpuUtil: number; gpuUtil: number }) {
  const now = Date.now();
  const msLeft = job.estimatedCompletedAt ? new Date(job.estimatedCompletedAt).getTime() - now : null;
  const progress = job.progress != null ? Math.round(job.progress * 100) : null;
  const conf = deriveConfidence(null, cpuUtil, gpuUtil);

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group p-5 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <p className="font-semibold truncate">{job.jobName}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              #{job.id} · {job.partition} · {job.cpuRequired}c / {job.gpuRequired || 0}g / {job.memoryGB}GB
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
        </div>

        {/* Progress */}
        {progress != null && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-mono font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* ETA block */}
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={13} className="text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Predicted completion</span>
          </div>
          <p className="text-lg font-bold font-mono">{formatETA(job.estimatedCompletedAt)}</p>
          {msLeft != null && msLeft > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{formatDuration(msLeft)} remaining</p>
          )}
        </div>

        <ConfidenceBadge level={conf} />
      </div>
    </Link>
  );
}

// ── Queued job card ───────────────────────────────────────────────────────────

function QueuedJobCard({ job, cpuUtil, gpuUtil }: { job: any; cpuUtil: number; gpuUtil: number }) {
  const now = Date.now();
  const estimatedStart = job.estimatedStartAt ?? new Date(now + ((job.queuePosition ?? 1) * 35 * 60000)).toISOString();
  const msWait = estimatedStart ? new Date(estimatedStart).getTime() - now : null;
  const conf = deriveConfidence(job.queuePosition, cpuUtil, gpuUtil);

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group p-5 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {job.queuePosition != null && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                  {job.queuePosition}
                </span>
              )}
              <p className="font-semibold truncate">{job.jobName}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              #{job.id} · {job.partition} · {job.cpuRequired}c / {job.gpuRequired || 0}g / {job.memoryGB}GB
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
        </div>

        {/* Queue position meter */}
        {job.queuePosition != null && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">Queue position</span>
              <span className="text-xs font-mono font-semibold">#{job.queuePosition} of {job.queuePosition + 1}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(job.queuePosition + 1, 6) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < job.queuePosition ? "bg-amber-400/70" : "bg-primary"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* ETA block */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Predicted start</span>
          </div>
          <p className="text-lg font-bold font-mono">{formatETA(estimatedStart)}</p>
          {msWait != null && msWait > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{formatDuration(msWait)} wait</p>
          )}
        </div>

        <ConfidenceBadge level={conf} />
      </div>
    </Link>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetUserSummary();
  const { data: allJobs } = useListJobs();
  const { data: resources } = useGetResourceAvailability();

  if (loadingSummary) return <div className="animate-pulse p-4 text-muted-foreground">Loading dashboard...</div>;

  const cpuUtil   = resources?.cpuUtilPercent   ?? 0;
  const gpuUtil   = resources?.gpuUtilPercent   ?? 0;
  const memUtil   = resources?.memoryUtilPercent ?? 0;

  const runningJobs = allJobs?.filter(j => j.status === "running") ?? [];
  const queuedJobs  = allJobs?.filter(j => j.status === "queued").sort(
    (a, b) => (a.queuePosition ?? 99) - (b.queuePosition ?? 99)
  ) ?? [];
  const activeCount = runningJobs.length + queuedJobs.length;

  // Derive overall engine confidence from cluster state
  const overallConf: Confidence =
    cpuUtil < 60 && gpuUtil < 60 && queuedJobs.length <= 2 ? "high" :
    cpuUtil < 80 && gpuUtil < 80 && queuedJobs.length <= 5 ? "medium" : "low";

  const confStyle = CONFIDENCE_STYLES[overallConf];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Researcher Dashboard</h1>
          <p className="text-muted-foreground">Real-time job telemetry and queue forecasts for your account.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/schedule">
            <Button className="gap-2 bg-primary hover:opacity-90 text-primary-foreground font-medium shadow-sm transition-colors border-none">
              <Clock size={16} /> Schedule Slot
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Running Jobs" value={summary?.runningJobs ?? 0} icon={Play} trend="Currently active" />
        <StatCard title="In Queue" value={summary?.queuedJobs ?? 0} icon={List} trend="Waiting for resources" />
        <Card className="flex flex-col justify-between border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu size={16} className="text-primary" />
                Cluster Availability
              </span>
              <Link href="/resources" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-normal">
                Details <ChevronRight size={12} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {[
              { label: "CPU", value: cpuUtil, text: `${resources?.availableCpus ?? 0} cores free` },
              { label: "GPU", value: gpuUtil, text: `${resources?.availableGpus ?? 0} units free` },
              { label: "RAM", value: memUtil, text: `${resources?.availableMemoryGB ?? 0} GB free` },
            ].map(({ label, value, text }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{label}</span>
                  <span className="text-muted-foreground font-mono">{text}</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Content area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3 — Active & Queued Jobs */}
        <div className="lg:col-span-2 space-y-4">

          {/* No active jobs state */}
          {activeCount === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center bg-card">
              <div className="p-3 rounded-full bg-muted mb-3">
                <BrainCircuit size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium">No active jobs</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Schedule a slot to start running jobs on the cluster.
              </p>
              <Link href="/schedule" className="mt-4">
                <Button size="sm" className="gap-2 bg-primary hover:opacity-90 text-primary-foreground border-none shadow-sm"><Clock size={14} /> Schedule Slot</Button>
              </Link>
            </div>
          )}

          {/* Running jobs */}
          {runningJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play size={14} className="text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Running — {runningJobs.length} job{runningJobs.length > 1 ? "s" : ""}
                </h3>
              </div>
              <div className="grid gap-3">
                {runningJobs.map(job => (
                  <RunningJobCard key={job.id} job={job} cpuUtil={cpuUtil} gpuUtil={gpuUtil} />
                ))}
              </div>
            </div>
          )}

          {/* Queued jobs */}
          {queuedJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <Clock size={14} className="text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Next in queue
                </h3>
              </div>
              <div className="grid gap-3">
                <QueuedJobCard key={queuedJobs[0].id} job={queuedJobs[0]} cpuUtil={cpuUtil} gpuUtil={gpuUtil} />
              </div>
              {queuedJobs.length > 1 && (
                <div className="mt-3">
                  <Link href="/jobs">
                    <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground">
                      Viewed all queued jobs ({queuedJobs.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1/3 — Queue Intelligence */}
        <div className="space-y-4">

          {/* Queue Intelligence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" />
                Queue Intelligence
              </CardTitle>
              <CardDescription>Factors shaping current estimates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Jobs in system queue</span>
                  <span className="font-mono font-semibold">{queuedJobs.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Active jobs cluster-wide</span>
                  <span className="font-mono font-semibold">{runningJobs.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Your avg wait (history)</span>
                  <span className="font-mono font-semibold">{formatWaitTime(summary?.avgWaitMinutes ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">CPU / GPU pressure</span>
                  <span className="font-mono font-semibold">
                    {Math.round(cpuUtil)}% / {Math.round(gpuUtil)}%
                  </span>
                </div>
              </div>

              {/* Estimate methodology note */}
              <div className="bg-muted/40 rounded-lg p-3 flex gap-2.5">
                <Info size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ETAs factor in current queue depth, per-partition throughput rates, and average job runtimes from the last 7 days.
                </p>
              </div>

              <Link href="/schedule">
                <Button className="w-full gap-2 bg-primary hover:opacity-90 text-primary-foreground border-none shadow-sm font-medium">
                  <Clock size={13} /> Schedule Slot
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
