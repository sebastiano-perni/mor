import { useGetClusterStats, useGetUtilizationHistory, useGetActivityFeed } from "@workspace/api-client-react";
import { StatCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Cpu, Layers, Activity, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { formatTime } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useGetClusterStats();
  const { data: history } = useGetUtilizationHistory();
  const { data: activities } = useGetActivityFeed({ limit: 8 });

  if (loadingStats || !stats) return <div className="p-8">Loading admin telemetry...</div>;

  const getActivityIcon = (type: string, severity: string) => {
    if (severity === 'error') return <AlertTriangle className="text-destructive" size={16} />;
    if (severity === 'warning') return <AlertTriangle className="text-amber-500" size={16} />;
    if (type.includes('completed') || type.includes('online')) return <CheckCircle2 className="text-emerald-500" size={16} />;
    return <Info className="text-blue-500" size={16} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Cluster Telemetry</h1>
        <p className="text-muted-foreground">Global view of system health and utilization.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Nodes" 
          value={stats.totalNodes} 
          icon={Server}
          trend={`${stats.activeNodes} Active, ${stats.offlineNodes} Offline`}
        />
        <StatCard 
          title="CPU Allocation" 
          value={Math.round((stats.usedCpus / stats.totalCpus) * 100) || 0}
          unit="%" 
          icon={Cpu}
          trend={`${stats.usedCpus} / ${stats.totalCpus} Cores`}
        />
        <StatCard 
          title="Queue Depth" 
          value={stats.queuedJobs} 
          icon={Layers}
          trend={`${stats.runningJobs} Currently running`}
        />
        <StatCard 
          title="Avg Queue Time" 
          value={stats.avgWaitMinutes} 
          unit="min"
          icon={Activity}
          trend="Last 24 hours"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>24H Utilization History</CardTitle>
            <CardDescription>CPU, GPU and Memory aggregate load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {history ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(val) => new Date(val).getHours() + ':00'} 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      labelFormatter={(val) => formatTime(val as string)}
                    />
                    <Area type="monotone" dataKey="cpuPercent" name="CPU" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                    <Area type="monotone" dataKey="gpuPercent" name="GPU" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorGpu)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Loading chart data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={16} /> Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[350px]">
            <div className="divide-y">
              {activities?.map(event => (
                <div key={event.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    {getActivityIcon(event.type, event.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
                      {event.jobId && <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">Job #{event.jobId}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {!activities?.length && (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
