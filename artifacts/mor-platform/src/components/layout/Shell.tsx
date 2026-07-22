import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useRole } from "@/hooks/use-role";
import { Redirect } from "wouter";

export function Shell({ children }: { children: ReactNode }) {
  const { role } = useRole();

  if (!role) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
