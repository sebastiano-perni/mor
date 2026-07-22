import { useGetResourceAvailability } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Cpu, Zap, HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Resources() {
  const { data: res, isLoading } = useGetResourceAvailability();

  if (isLoading || !res) return <div className="p-8">Loading resources...</div>;

  const MetricCard = ({ title, icon: Icon, percent, available, totalLabel }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <Icon size={20} />
            </div>
            <span className="font-semibold">{title}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">{percent}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Utilized</div>
          </div>
        </div>
        
        <Progress value={percent} className="h-3 mb-3" />
        
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>{available} Available</span>
          <span>{totalLabel}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <Activity className="text-primary" /> Global Resources
        </h1>
        <p className="text-muted-foreground">Live telemetry of the shared cluster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Compute Cores" 
          icon={Cpu} 
          percent={res.cpuUtilPercent} 
          available={`${res.availableCpus} Cores`}
          totalLabel="Cluster Wide"
        />
        <MetricCard 
          title="Accelerators" 
          icon={Zap} 
          percent={res.gpuUtilPercent} 
          available={`${res.availableGpus} GPUs`}
          totalLabel="Cluster Wide"
        />
        <MetricCard 
          title="System Memory" 
          icon={HardDrive} 
          percent={res.memoryUtilPercent} 
          available={`${res.availableMemoryGB} GB`}
          totalLabel="Cluster Wide"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Message</CardTitle>
          <CardDescription>Current cluster status and MOTD</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              All Systems Nominal
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              No planned maintenance in the next 7 days. Note: High utilization on the GPU partition is expected 
              due to ICML deadline submissions. Queue times for large jobs (&gt;4 GPUs) may exceed 12 hours.
              Please schedule your runs accordingly or use the Schedule tool for guaranteed slots.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
