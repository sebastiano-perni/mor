import { formatBytes, formatTime } from "@/lib/utils";

export function JobStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "default";
  
  switch(status) {
    case "running":
      variant = "default";
      break;
    case "queued":
      variant = "warning";
      break;
    case "completed":
      variant = "success";
      break;
    case "failed":
    case "cancelled":
      variant = "destructive";
      break;
    case "scheduled":
      variant = "secondary";
      break;
  }
  
  return (
    <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
      ${variant === 'default' ? 'bg-primary/10 text-primary' : ''}
      ${variant === 'success' ? 'bg-emerald-500/10 text-emerald-700' : ''}
      ${variant === 'warning' ? 'bg-amber-500/10 text-amber-700' : ''}
      ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : ''}
      ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : ''}
    `}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}

export function StatCard({ title, value, unit, icon: Icon, trend }: { title: string, value: string | number, unit?: string, icon?: any, trend?: string }) {
  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <div className="text-muted-foreground/60"><Icon size={18} /></div>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {unit && <div className="text-sm font-medium text-muted-foreground">{unit}</div>}
      </div>
      {trend && <div className="mt-2 text-xs text-muted-foreground">{trend}</div>}
    </div>
  );
}
