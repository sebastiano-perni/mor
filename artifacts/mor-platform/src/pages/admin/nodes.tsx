import { useState } from "react";
import { useListNodes, useUpdateNode, getListNodesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Server, Search, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export default function AdminNodes() {
  const { data: nodes, isLoading } = useListNodes();
  const updateNode = useUpdateNode();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const handleStatusChange = (id: number, status: "active" | "offline" | "maintenance") => {
    updateNode.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast.success(`Node ${id} status updated`);
        queryClient.invalidateQueries({ queryKey: getListNodesQueryKey() });
      },
      onError: () => toast.error("Failed to update node")
    });
  };

  const filteredNodes = nodes?.filter(n => n.name.toLowerCase().includes(search.toLowerCase())) || [];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'offline': return <XCircle size={16} className="text-destructive" />;
      case 'maintenance': return <Wrench size={16} className="text-amber-500" />;
      default: return <Server size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Compute Nodes</h1>
        <p className="text-muted-foreground">Manage hardware lifecycle and partition assignments.</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search by node name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card shadow-sm"
        />
      </div>

      <Card className="shadow-sm overflow-hidden border-sidebar-border/20">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[200px]">Node</TableHead>
              <TableHead>Specs (C/G/M)</TableHead>
              <TableHead>Partition</TableHead>
              <TableHead className="w-[150px]">CPU Load</TableHead>
              <TableHead className="w-[150px]">Mem Load</TableHead>
              <TableHead className="w-[180px]">Status Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading nodes...</TableCell></TableRow>
            ) : filteredNodes.map((node) => (
              <TableRow key={node.id} className={node.status !== 'active' ? 'bg-muted/10' : ''}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={node.status} />
                    <span className="font-mono font-medium">{node.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {node.cpuCores}c / {node.gpuCount}g / {node.memoryGB}gb
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium">
                    {node.partition}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={node.cpuLoad} className="h-1.5 w-20" />
                    <span className="text-xs w-8 text-right font-mono">{node.cpuLoad}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={node.memoryLoad} className="h-1.5 w-20" />
                    <span className="text-xs w-8 text-right font-mono">{node.memoryLoad}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={node.status} 
                    onValueChange={(v: any) => handleStatusChange(node.id, v)}
                  >
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
