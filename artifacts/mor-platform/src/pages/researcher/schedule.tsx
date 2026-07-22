import { useState } from "react";
import { useListScheduleSlots, useListJobs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, ChevronRight, Cpu, Zap, HardDrive } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Link } from "wouter";

export default function Schedule() {
  const [cpuReq, setCpuReq] = useState(4);
  const [gpuReq, setGpuReq] = useState(0);
  const [memReq, setMemReq] = useState(16);

  const { data: slots, isLoading } = useListScheduleSlots({
    cpuRequired: cpuReq,
    gpuRequired: gpuReq,
    memoryGB: memReq
  });

  const { data: jobs } = useListJobs({ status: "scheduled" });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Schedule Slot</h1>
        <p className="text-muted-foreground">Find guaranteed availability for critical jobs in the next 48 hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Resource Filter</CardTitle>
              <CardDescription>Find slots with at least:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  CPU Cores <span>{cpuReq}</span>
                </label>
                <input 
                  type="range" min="1" max="64" value={cpuReq} 
                  onChange={e => setCpuReq(Number(e.target.value))} 
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  GPUs <span>{gpuReq}</span>
                </label>
                <input 
                  type="range" min="0" max="8" value={gpuReq} 
                  onChange={e => setGpuReq(Number(e.target.value))} 
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  Memory (GB) <span>{memReq}</span>
                </label>
                <input 
                  type="range" min="4" max="256" step="4" value={memReq} 
                  onChange={e => setMemReq(Number(e.target.value))} 
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {jobs && jobs.length > 0 && (
            <Card className="bg-secondary border-secondary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon size={16} /> My Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-background rounded-md p-3 border shadow-sm text-sm">
                    <div className="font-medium truncate mb-1">{job.jobName}</div>
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{job.scheduledFor ? formatTime(job.scheduledFor) : '--'}</span>
                      <span>{job.cpuRequired}c / {job.gpuRequired}g</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full min-h-[500px]">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle>Available Windows</CardTitle>
              <CardDescription>Slots meeting your resource requirements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Scanning availability...</div>
              ) : slots && slots.length > 0 ? (
                <div className="divide-y">
                  {slots.map((slot, i) => {
                    const start = new Date(slot.startAt);
                    const end = new Date(slot.endAt);
                    const isToday = start.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={i} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0 border border-primary/20">
                            <span className="text-xs font-bold uppercase tracking-wider">{isToday ? "TODAY" : formatDate(slot.startAt)}</span>
                            <span className="text-lg font-bold leading-none mt-0.5">{formatTime(slot.startAt).split(' ')[0]}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                            </h3>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Cpu size={14}/> {slot.availableCpus} avail</span>
                              <span className="flex items-center gap-1.5"><Zap size={14}/> {slot.availableGpus} avail</span>
                              <span className="flex items-center gap-1.5"><HardDrive size={14}/> {slot.availableMemoryGB}GB avail</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link href={`/jobs/new?schedule=${slot.startAt}&cpu=${cpuReq}&gpu=${gpuReq}&mem=${memReq}`}>
                          <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            Book Slot <ChevronRight size={16} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No matching slots</h3>
                  <p className="text-muted-foreground max-w-sm mt-1">
                    No windows found with the requested resources. Try reducing your requirements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
