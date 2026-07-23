import { useRole } from "@/hooks/use-role";
import { useLocation } from "wouter";
import { Terminal, ShieldAlert } from "lucide-react";

export default function RoleSelector() {
  const { changeRole } = useRole();
  const [, setLocation] = useLocation();

  const handleSelect = (role: "admin" | "user") => {
    changeRole(role);
    if (role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-sidebar text-sidebar-foreground p-4">
      <div className="max-w-3xl w-full">
        <div className="mb-12 text-center">
<h1 className="font-bold tracking-tight mb-4 text-[#785abe] text-[80px]">mor.</h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-lg mx-auto">
            HPC Cluster Management Platform. <br/> Select your operational context.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => handleSelect("user")}
            className="flex flex-col items-start p-8 rounded-2xl border-2 border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:border-primary transition-all text-left group"
            data-testid="button-role-researcher"
          >
            <div className="w-12 h-12 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Terminal size={24} />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Researcher</h2>
            <p className="text-sidebar-foreground/70 leading-relaxed">
              Submit computational jobs, monitor queue positions, request resources, and track allocation limits.
            </p>
          </button>

          <button 
            onClick={() => handleSelect("admin")}
            className="flex flex-col items-start p-8 rounded-2xl border-2 border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:border-primary transition-all text-left group"
            data-testid="button-role-admin"
          >
            <div className="w-12 h-12 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Cluster Admin</h2>
            <p className="text-sidebar-foreground/70 leading-relaxed">
              Manage node health, reprioritize queues, audit utilization, and maintain cluster stability.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
