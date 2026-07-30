import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Terminal, LayoutDashboard, List, Activity, Settings, Users, Server, Clock, LogOut } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useRole } from "@/hooks/use-role";

export function Sidebar() {
  const [location] = useLocation();
  const { role, clearRole } = useRole();
  const { data: user } = useGetCurrentUser();

  const isAdmin = role === "admin";
  
  const navItems = isAdmin ? [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Nodes", path: "/admin/nodes", icon: Server },
    { name: "All Jobs", path: "/admin/jobs", icon: List },
    { name: "Users", path: "/admin/users", icon: Users },
  ] : [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Jobs", path: "/jobs", icon: List },
    { name: "Schedule", path: "/schedule", icon: Clock },
    { name: "Resources", path: "/resources", icon: Activity },
  ];

  const handleLogout = () => {
    clearRole();
  };

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-[100dvh] border-r border-sidebar-border shrink-0 fixed left-0 top-0">
      <div className="p-6">
        <Link href={isAdmin ? "/admin" : "/dashboard"}>
          <span className="font-extrabold text-4xl tracking-tight text-[#785abe]">mor.</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== (isAdmin ? "/admin" : "/dashboard") && location.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-sidebar-primary" : "opacity-70")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="bg-sidebar-accent/50 rounded-lg p-2.5 border border-sidebar-border">
          <div className="text-[10px] text-sidebar-foreground/60 mb-0.5 uppercase tracking-wider font-semibold">Active Context</div>
          <div className="font-medium text-xs text-sidebar-foreground flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isAdmin ? "bg-amber-400" : "bg-emerald-400")} />
            {isAdmin ? "Cluster Admin" : "Researcher"}
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-white border border-sidebar-border">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">{user.department}</div>
            </div>
          </div>
        ) : (
          <div className="h-8" />
        )}
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-white transition-colors w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-sidebar-accent/50 border border-sidebar-border/50"
        >
          <LogOut size={16} />
          Switch Role
        </button>
      </div>
    </div>
  );
}
