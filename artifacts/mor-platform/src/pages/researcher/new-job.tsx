import { useState, useEffect } from "react";
import { useCreateJob, useScheduleJob, useListPartitions, useGetQueueEstimate, getGetQueueEstimateQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Clock, Info, Calendar } from "lucide-react";
import { formatWaitTime, formatTime, formatDate } from "@/lib/utils";

export default function NewJob() {
  const [, setLocation] = useLocation();
  const { data: partitions } = useListPartitions();
  const createJob = useCreateJob();
  const scheduleJob = useScheduleJob();

  // Read URL search params carried from Schedule page
  const searchParams = new URLSearchParams(window.location.search);
  const initialCpu = searchParams.get("cpu") ? Number(searchParams.get("cpu")) : 1;
  const initialGpu = searchParams.get("gpu") ? Number(searchParams.get("gpu")) : 0;
  const initialMem = searchParams.get("mem") ? Number(searchParams.get("mem")) : 4;
  const initialSchedule = searchParams.get("schedule") || "";
  
  const [jobName, setJobName] = useState("");
  const [partition, setPartition] = useState<string>("");
  const [cpu, setCpu] = useState([initialCpu]);
  const [gpu, setGpu] = useState([initialGpu]);
  const [memory, setMemory] = useState([initialMem]);
  const [wallHours, setWallHours] = useState([1]);
  const [note, setNote] = useState("");

  const [scheduledTime, setScheduledTime] = useState<string>(initialSchedule);
  const [isScheduledMode, setIsScheduledMode] = useState<boolean>(!!initialSchedule);

  const selectedPartition = partitions?.find(p => p.name === partition);

  // Poll for queue estimate when in queue mode
  const { data: estimate } = useGetQueueEstimate({
    partition: partition || undefined,
    cpuRequired: cpu[0],
    gpuRequired: gpu[0],
    memoryGB: memory[0]
  }, {
    query: {
      enabled: !!partition && !isScheduledMode,
      queryKey: getGetQueueEstimateQueryKey({
        partition: partition || undefined,
        cpuRequired: cpu[0],
        gpuRequired: gpu[0],
        memoryGB: memory[0]
      }),
      staleTime: 1000 * 10
    }
  });

  // Auto-select first partition
  useEffect(() => {
    if (partitions?.length && !partition) {
      setPartition(partitions[0].name);
    }
  }, [partitions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName || !partition) {
      toast.error("Please fill all required fields");
      return;
    }

    createJob.mutate({
      data: {
        jobName,
        partition,
        cpuRequired: cpu[0],
        gpuRequired: gpu[0],
        memoryGB: memory[0],
        wallHours: wallHours[0],
        note: note || undefined
      }
    }, {
      onSuccess: (job) => {
        if (isScheduledMode && scheduledTime) {
          scheduleJob.mutate({
            id: job.id,
            data: { scheduledFor: scheduledTime }
          }, {
            onSuccess: () => {
              toast.success("Job scheduled successfully!");
              setLocation(`/jobs/${job.id}`);
            },
            onError: () => {
              toast.success("Job submitted to queue");
              setLocation(`/jobs/${job.id}`);
            }
          });
        } else {
          toast.success("Job submitted to queue successfully");
          setLocation(`/jobs/${job.id}`);
        }
      },
      onError: () => {
        toast.error("Failed to submit job");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {isScheduledMode ? "Schedule Job Execution" : "Submit Job to Queue"}
        </h1>
        <p className="text-muted-foreground">
          {isScheduledMode
            ? "Configure task details for your reserved time slot."
            : "Configure and queue a new computational task for execution."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8 bg-card border rounded-xl p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobName" className="text-base">Job Name</Label>
                <Input 
                  id="jobName" 
                  placeholder="e.g. resnet_training_v2" 
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-base">Partition / Queue</Label>
                <Select value={partition} onValueChange={setPartition}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a partition" />
                  </SelectTrigger>
                  <SelectContent>
                    {partitions?.map(p => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name} <span className="text-muted-foreground ml-2 text-xs">({p.description})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-8 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Resource Requirements</h3>
                {initialSchedule && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
                    Pre-filled from slot selection
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>CPU Cores</Label>
                  <span className="font-mono text-sm">{cpu[0]} cores</span>
                </div>
                <Slider 
                  value={cpu} 
                  onValueChange={setCpu} 
                  max={selectedPartition?.maxCpus || 64} 
                  min={1} 
                  step={1} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>GPU Units</Label>
                  <span className="font-mono text-sm">{gpu[0]} units</span>
                </div>
                <Slider 
                  value={gpu} 
                  onValueChange={setGpu} 
                  max={selectedPartition?.maxGpus || 8} 
                  min={0} 
                  step={1} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Memory</Label>
                  <span className="font-mono text-sm">{memory[0]} GB</span>
                </div>
                <Slider 
                  value={memory} 
                  onValueChange={setMemory} 
                  max={selectedPartition?.maxMemoryGB || 512} 
                  min={1} 
                  step={4} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Max Wall Time</Label>
                  <span className="font-mono text-sm">{wallHours[0]} hours</span>
                </div>
                <Slider 
                  value={wallHours} 
                  onValueChange={setWallHours} 
                  max={selectedPartition?.maxWallHours || 168} 
                  min={1} 
                  step={1} 
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <Label htmlFor="note">Notes (Optional)</Label>
                <Input 
                  id="note" 
                  placeholder="Additional context or references" 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                className={isScheduledMode ? "gap-2 w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground font-medium" : "gap-2 w-full sm:w-auto"} 
                disabled={createJob.isPending || scheduleJob.isPending}
              >
                <Zap size={18} />
                {createJob.isPending || scheduleJob.isPending 
                  ? "Submitting..." 
                  : isScheduledMode ? "Confirm & Book Slot" : "Submit to Queue"}
              </Button>
            </div>
          </form>
        </div>

        <div>
          <div className="sticky top-8 space-y-6">
            {/* Sidebar info card: Scheduled Slot Details vs Live Queue Estimate */}
            {isScheduledMode && scheduledTime ? (
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <Calendar size={18} />
                    Reserved Time Slot
                  </CardTitle>
                  <CardDescription>Job will begin at the selected window without queue delays.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border shadow-sm space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scheduled Window</div>
                    <div className="text-xl font-bold text-foreground">
                      {formatDate(scheduledTime)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Allocated: {cpu[0]}c / {gpu[0]}g / {memory[0]}GB
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 text-xs text-muted-foreground">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p>Guaranteed availability. No queue wait time is required for this slot.</p>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs gap-1.5"
                    onClick={() => setIsScheduledMode(false)}
                  >
                    <Clock size={13} /> Current Time Slot (Join Live Queue)
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    Live Queue Estimate
                  </CardTitle>
                  <CardDescription>Based on current cluster load and requested resources.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {partition ? (
                    <div className="space-y-4">
                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="text-sm text-muted-foreground mb-1">Est. Wait Time</div>
                        <div className="text-3xl font-bold text-foreground">
                          {estimate ? formatWaitTime(estimate.estimatedWaitMinutes) : "--"}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <span className="text-muted-foreground">Likely start:</span>
                        <span className="font-medium">{estimate ? formatTime(estimate.estimatedStartAt) : "--"}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p>Confidence is <b>{estimate?.confidence || "unknown"}</b>. Priority inversion may affect actual start time.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Select a partition to see estimates.
                    </div>
                  )}

                  {scheduledTime && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300"
                      onClick={() => setIsScheduledMode(true)}
                    >
                      <Calendar size={13} /> Use Reserved Time Slot ({formatTime(scheduledTime)})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedPartition && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Partition Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max CPU:</span>
                    <span className="font-mono">{selectedPartition.maxCpus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max GPU:</span>
                    <span className="font-mono">{selectedPartition.maxGpus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Mem:</span>
                    <span className="font-mono">{selectedPartition.maxMemoryGB} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Time:</span>
                    <span className="font-mono">{selectedPartition.maxWallHours} h</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
